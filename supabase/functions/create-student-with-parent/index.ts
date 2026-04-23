import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const payload = await req.json();
    // Webhooks send the new row inside the 'record' object
    const record = payload.record;

    const parentEmail = record.parent_email;
    const studentId = record.id;

    if (!parentEmail) {
      return new Response("No parent email found in record", { status: 200 });
    }

    // Initialize Admin Client to bypass RLS and create users
    const supabaseAdmin = createClient(
      Deno.env.get("https://krcqixttwqifjioywtmj.supabase.co") ?? "",
      Deno.env.get(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY3FpeHR0d3FpZmppb3l3dG1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2NDk4NiwiZXhwIjoyMDgwMTQwOTg2fQ.vSCAUCR_mOf3kDmLsYFeOil8fKzxTWi7XVLj7HyWqBc",
      ) ?? "",
    );

    // Create the Parent Account in Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: parentEmail,
      email_confirm: true,
      user_metadata: {
        role: "parent",
        linked_student_id: studentId,
      },
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Parent created", parentId: data.user.id }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
