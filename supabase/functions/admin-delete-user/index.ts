import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });

const getMetaValue = (user: Record<string, unknown> | null | undefined, key: string) => {
  if (!user) return "";
  const userMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
  return String(userMeta[key] || appMeta[key] || "").trim();
};

const listAllUsers = async (supabaseAdmin: ReturnType<typeof createClient>) => {
  const allUsers: Array<Record<string, unknown>> = [];
  let page = 1;
  const perPage = 200;

  while (page <= 50) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);

    const users = (data?.users || []) as Array<Record<string, unknown>>;
    allUsers.push(...users);

    if (users.length < perPage) break;
    page += 1;
  }

  return allUsers;
};

const findLinkedUserId = async ({
  supabaseAdmin,
  targetUserId,
  targetRole,
  targetAuthUser,
}: {
  supabaseAdmin: ReturnType<typeof createClient>;
  targetUserId: string;
  targetRole: string;
  targetAuthUser: Record<string, unknown>;
}) => {
  if (targetRole === "student") {
    const directParentId = getMetaValue(targetAuthUser, "parent_id");
    if (directParentId) return directParentId;
  }

  if (targetRole === "parent") {
    const directStudentId = getMetaValue(targetAuthUser, "linked_student_id");
    if (directStudentId) return directStudentId;
  }

  const users = await listAllUsers(supabaseAdmin);
  if (targetRole === "student") {
    const linkedParent = users.find((user) => getMetaValue(user, "linked_student_id") === targetUserId);
    return linkedParent ? String(linkedParent.id || "") : "";
  }

  if (targetRole === "parent") {
    const linkedStudent = users.find((user) => getMetaValue(user, "parent_id") === targetUserId);
    return linkedStudent ? String(linkedStudent.id || "") : "";
  }

  return "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(500, { error: "Missing SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY secrets" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(401, { error: "Missing Authorization header" });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData?.user?.id) {
      return json(401, { error: "Unauthorized" });
    }
    const requesterId = authData.user.id;

    const { data: isAdminResult, error: isAdminError } = await supabaseAdmin.rpc("is_admin", {
      candidate: requesterId,
    });
    if (isAdminError || !isAdminResult) {
      return json(403, { error: "Only admins can delete user accounts" });
    }

    const body = await req.json();
    const targetUserId = String(body?.targetUserId || "").trim();
    if (!targetUserId) {
      return json(400, { error: "targetUserId is required" });
    }

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileError) {
      return json(500, { error: `Could not read target profile: ${profileError.message}` });
    }
    if (!targetProfile) {
      return json(404, { error: "Target profile not found" });
    }

    const targetRole = String(targetProfile.role || "student").toLowerCase();

    const idsToDelete = new Set<string>([targetUserId]);
    if (targetRole === "student" || targetRole === "parent") {
      const { data: targetAuthData, error: targetAuthError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (targetAuthError || !targetAuthData?.user) {
        return json(404, { error: "Target auth account not found" });
      }

      const linkedUserId = await findLinkedUserId({
        supabaseAdmin,
        targetUserId,
        targetRole,
        targetAuthUser: targetAuthData.user as unknown as Record<string, unknown>,
      });

      if (linkedUserId && linkedUserId !== targetUserId) {
        idsToDelete.add(linkedUserId);
      }
    }

    if (idsToDelete.has(requesterId)) {
      return json(400, { error: "You cannot delete your own account" });
    }

    const deletedIds: string[] = [];
    for (const id of idsToDelete) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        return json(500, { error: `Failed to delete auth user ${id}: ${error.message}`, deletedIds });
      }
      deletedIds.push(id);
    }

    const idsArray = [...idsToDelete];
    const { error: profileDeleteError } = await supabaseAdmin.from("profiles").delete().in("id", idsArray);
    if (profileDeleteError) {
      return json(500, { error: `Auth users deleted, but profile cleanup failed: ${profileDeleteError.message}`, deletedIds });
    }

    await supabaseAdmin.from("admins").delete().in("id", idsArray);

    return json(200, { deletedIds });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
});
