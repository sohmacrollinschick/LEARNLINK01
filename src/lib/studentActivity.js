import { supabase } from "../supabaseClient";

const dedupeMap = new Map();
const DEDUPE_WINDOW_MS = 1500;

function sanitizeText(value, max = 180) {
  if (value == null) return null;
  const text = String(value).trim().replace(/\s+/g, " ");
  if (!text) return null;
  return text.slice(0, max);
}

function shouldSkip(user) {
  return !user?.id || String(user?.role || "").toLowerCase() !== "student";
}

function dedupeKey(payload) {
  return [
    payload.user_id,
    payload.event_type,
    payload.page_path || "",
    payload.target_type || "",
    payload.target_id || "",
  ].join("|");
}

export async function trackStudentActivity({
  user,
  eventType,
  pagePath = null,
  targetType = null,
  targetId = null,
  metadata = {},
}) {
  if (shouldSkip(user) || !eventType) return;

  const payload = {
    user_id: user.id,
    role: "student",
    event_type: sanitizeText(eventType, 60),
    page_path: sanitizeText(pagePath, 255),
    target_type: sanitizeText(targetType, 60),
    target_id: sanitizeText(targetId, 180),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };

  const key = dedupeKey(payload);
  const now = Date.now();
  const previous = dedupeMap.get(key);
  if (previous && now - previous < DEDUPE_WINDOW_MS) return;
  dedupeMap.set(key, now);

  const { error } = await supabase.from("student_interactions").insert(payload);
  if (error) {
    console.warn("student_interactions insert failed:", error.message);
  }
}

export function extractClickableInfo(target) {
  if (!target || typeof target.closest !== "function") return null;
  const node = target.closest("button, a, [data-track]");
  if (!node) return null;

  const tag = node.tagName?.toLowerCase() || "unknown";
  const href = tag === "a" ? sanitizeText(node.getAttribute("href"), 255) : null;
  const label =
    sanitizeText(node.getAttribute("data-track")) ||
    sanitizeText(node.getAttribute("aria-label")) ||
    sanitizeText(node.textContent, 120) ||
    href ||
    tag;

  return {
    targetType: tag,
    targetId: label,
    metadata: {
      href,
      className: sanitizeText(node.className, 255),
    },
  };
}
