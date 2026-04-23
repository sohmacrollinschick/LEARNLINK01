import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { Megaphone, Send, Users, Clock3, Trash2 } from "lucide-react";

export default function AdminAnnouncements({ darkMode }) {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [status, setStatus] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all",
  });

  const targetLabel = useMemo(() => {
    if (form.target === "all") return "all users";
    if (form.target === "student") return "students";
    if (form.target === "parent") return "parents";
    return "selected users";
  }, [form.target]);

  async function loadRecentAnnouncements() {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, message, target, recipient_count, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      setStatus(error.message || "Could not load announcement history.");
      setHistoryLoading(false);
      return;
    }

    setRecentAnnouncements(data || []);
    setHistoryLoading(false);
  }

  async function computeRecipientCount(targetRole) {
    let query = supabase.from("profiles").select("id", { count: "exact", head: true });
    if (targetRole !== "all") query = query.eq("role", targetRole);
    const { count } = await query;
    setRecipientCount(count || 0);
  }

  useEffect(() => {
    loadRecentAnnouncements();
  }, []);

  useEffect(() => {
    computeRecipientCount(form.target);
  }, [form.target]);

  async function sendAnnouncement(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be logged in as admin.");

      let profilesQuery = supabase.from("profiles").select("id, role");
      if (form.target !== "all") {
        profilesQuery = profilesQuery.eq("role", form.target);
      }

      const { data: recipients, error: recipientErr } = await profilesQuery;
      if (recipientErr) throw recipientErr;
      if (!recipients?.length) {
        setStatus("No recipients found for this target.");
        setLoading(false);
        return;
      }

      const { error: announcementErr } = await supabase.from("announcements").insert({
        author_id: user.id,
        title: form.title,
        message: form.message,
        target: form.target,
        recipient_count: recipients.length,
      });

      if (announcementErr) throw announcementErr;
      setStatus(`Announcement sent to ${recipients.length} user(s).`);
      setForm({ title: "", message: "", target: form.target });
      await loadRecentAnnouncements();
    } catch (error) {
      setStatus(error.message || "Failed to send announcement.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnnouncement(id) {
    if (!id) return;
    const confirmed = window.confirm("Delete this announcement?");
    if (!confirmed) return;

    setDeletingId(id);
    setStatus("");
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;

      setRecentAnnouncements((prev) => prev.filter((row) => row.id !== id));
      setStatus("Announcement deleted.");
    } catch (error) {
      setStatus(error.message || "Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className={`max-w-6xl mx-auto space-y-6 ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
              <Megaphone className="w-6 h-6 text-rose-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Publish Announcements
            </h1>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
            Send school-wide updates as notifications and keep an announcement record.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div
          className={`lg:col-span-3 rounded-2xl p-6 border ${
            darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <form onSubmit={sendAnnouncement} className="space-y-4">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Announcement title"
              required
              className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800"
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Write your message..."
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800"
            />
            <select
              value={form.target}
              onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800"
            >
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
            </select>

            <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
              <Users size={16} />
              Targeting {targetLabel}: {recipientCount} recipient(s)
            </div>

            {status ? <p className="text-sm text-blue-500 font-semibold">{status}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Send size={16} />
              {loading ? "Sending..." : "Publish Announcement"}
            </button>
          </form>
        </div>

        <div
          className={`lg:col-span-2 rounded-2xl p-6 border ${
            darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-lg font-black mb-4">Recent Announcements</h3>

          {historyLoading ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : recentAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements published yet.</p>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {recentAnnouncements.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border ${darkMode ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"}`}
                >
                  <p className="text-sm font-black">{item.title}</p>
                  <p className="text-xs mt-1 text-slate-500 line-clamp-3">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="uppercase">{item.target}</span>
                    <span>{item.recipient_count || 0} recipients</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock3 size={12} />
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-rose-600 text-white disabled:opacity-60"
                    >
                      <Trash2 size={12} />
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

