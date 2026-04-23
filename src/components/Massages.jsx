import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "./Usercontext";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

export default function Massages({ darkMode = false }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const cardBg = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  async function loadNotifications() {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: notifData, error: notifError } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (notifError) {
      console.error("Failed to load notifications:", notifError);
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationRows = (notifData || []).map((row) => ({
      ...row,
      source: "notification",
    }));

    if (user.role !== "admin") {
      setNotifications(notificationRows);
      setLoading(false);
      return;
    }

    const { data: announcementData, error: announcementError } = await supabase
      .from("announcements")
      .select("id, title, message, target, recipient_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (announcementError) {
      console.error("Failed to load announcement log:", announcementError);
      setNotifications(notificationRows);
      setLoading(false);
      return;
    }

    const announcementRows = (announcementData || []).map((row) => ({
      id: `announcement-${row.id}`,
      title: row.title,
      message: row.message,
      type: `announcement (${row.target}, ${row.recipient_count || 0} recipients)`,
      is_read: true,
      created_at: row.created_at,
      source: "announcement",
    }));

    const mergedRows = [...notificationRows, ...announcementRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setNotifications(mergedRows);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!user?.id) return;

    const notificationChannel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [{ ...payload.new, source: "notification" }, ...prev]);
        },
      )
      .subscribe();

    const announcementChannel =
      user.role === "admin"
        ? supabase
            .channel("admin-announcements-feed")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "announcements",
              },
              (payload) => {
                setNotifications((prev) => [
                  {
                    id: `announcement-${payload.new.id}`,
                    title: payload.new.title,
                    message: payload.new.message,
                    type: `announcement (${payload.new.target}, ${payload.new.recipient_count || 0} recipients)`,
                    is_read: true,
                    created_at: payload.new.created_at,
                    source: "announcement",
                  },
                  ...prev,
                ]);
              },
            )
            .subscribe()
        : null;

    return () => {
      supabase.removeChannel(notificationChannel);
      if (announcementChannel) supabase.removeChannel(announcementChannel);
    };
  }, [user?.id, user?.role]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => !n.is_read);
    return notifications;
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markOneAsRead(id) {
    const item = notifications.find((row) => row.id === id);
    if (!item || item.source !== "notification") return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((row) => (row.id === id ? { ...row, is_read: true } : row)),
      );
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((n) => !n.is_read && n.source === "notification")
      .map((n) => n.id);

    if (!unreadIds.length) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", user.id);

    if (!error) {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    }
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${darkMode ? "text-white" : "text-slate-900"}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
          <p className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>
            Announcements and updates sent to your account
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50"
          disabled={unreadCount === 0}
        >
          Mark All Read
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${
            activeTab === "all"
              ? "bg-blue-600 text-white"
              : darkMode
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${
            activeTab === "unread"
              ? "bg-amber-500 text-white"
              : darkMode
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-blue-600" size={38} />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${cardBg}`}>
          <Bell className={`mx-auto mb-3 ${mutedText}`} size={34} />
          <p className="font-bold">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div key={item.id} className={`rounded-2xl border p-5 ${cardBg}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{item.title || "Notification"}</p>
                  <p className={`text-sm mt-1 ${mutedText}`}>{item.message || "-"}</p>
                  <div className="text-xs mt-3 text-slate-400">
                    {item.type ? `${item.type} • ` : ""}
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                  </div>
                </div>

                {!item.is_read ? (
                  <button
                    onClick={() => markOneAsRead(item.id)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Mark Read
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    Read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
