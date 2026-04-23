import React, { useState, useRef, useEffect } from "react";
import { Bell, Settings, Plus, Search, BookOpen, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "./Usercontext";
import { usePopup } from "./PopupProvider";
import { supabase } from "../supabaseClient";
import { offlineManager } from "../offlineStore";
import logoImage from "../assets/image/learn.png";

const HEADER_ROLE_CONFIG = {
  admin: { showNew: false, showStats: false, actions: ["Add User", "System Report"] },
  student: { showNew: false, showStats: true, actions: [] },
  parent: { showNew: false, showStats: true, actions: [] },
};

function Header() {
  const { user } = useUser();
  const { showAlert } = usePopup();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ courses: 0, deadlines: 0 });
  const [showNotif, setShowNotif] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const notifRef = useRef(null);
  const announcementShownRef = useRef(new Set());

  const shouldPopupAnnouncement = (notif) => {
    if (!notif?.id) return false;
    if (announcementShownRef.current.has(notif.id)) return false;
    return String(notif.type || "").toLowerCase() === "announcement";
  };

  const markAnnouncementShown = (notifId) => {
    if (!notifId) return;
    announcementShownRef.current.add(notifId);
  };

  // 1. DYNAMIC DATA: Fetch Notifications + Role-based quick stats from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchHeaderData = async () => {
      const notifCacheKey = "header_notifications";
      const statsCacheKey = "header_stats";
      let notifData = null;

      if (navigator.onLine) {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        notifData = data || [];
        await offlineManager.setCache(notifCacheKey, notifData, user.id);
      } else {
        notifData = (await offlineManager.getCache(notifCacheKey, user.id)) || [];
      }

      setNotifications(notifData || []);

      const latestUnreadAnnouncement = (notifData || []).find(
        (n) => !n.is_read && String(n.type || "").toLowerCase() === "announcement"
      );
      if (
        latestUnreadAnnouncement &&
        shouldPopupAnnouncement(latestUnreadAnnouncement) &&
        user.role !== "admin"
      ) {
        markAnnouncementShown(latestUnreadAnnouncement.id);
        setShowNotif(true);
        showAlert(
          `${latestUnreadAnnouncement.title}\n\n${latestUnreadAnnouncement.message}\n\nOpen the notification tab on the header to view it.`,
          "New Announcement"
        );
      }

      // For learners, show active course count from course_progress.
      if (["student", "parent"].includes(user.role)) {
        if (navigator.onLine) {
          const { count: courseCount } = await supabase
            .from("course_progress")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

          const { count: deadlineCount } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

          const nextStats = {
            courses: courseCount || 0,
            deadlines: deadlineCount || 0,
          };
          setStats(nextStats);
          await offlineManager.setCache(statsCacheKey, nextStats, user.id);
        } else {
          const cachedStats = await offlineManager.getCache(statsCacheKey, user.id);
          if (cachedStats) setStats(cachedStats);
        }
      }

    };

    fetchHeaderData();

    // 2. REALTIME: Listen for new notifications
    const channel = supabase
      .channel("live_notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => {
            const next = [payload.new, ...prev].slice(0, 5);
            offlineManager.setCache("header_notifications", next, user.id).catch(() => {});
            return next;
          });
          setStats((prev) => ({ ...prev, deadlines: prev.deadlines + 1 }));
          if (
            payload?.new &&
            shouldPopupAnnouncement(payload.new) &&
            user.role !== "admin"
          ) {
            markAnnouncementShown(payload.new.id);
            setShowNotif(true);
            showAlert(
              `${payload.new.title}\n\n${payload.new.message}\n\nOpen the notification tab on the header to view it.`,
              "New Announcement"
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, showAlert]);

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", user.id);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setStats((prev) => ({ ...prev, deadlines: 0 }));
    }
  }

  function goToSettings() {
    const isAdminArea = location.pathname.startsWith("/admin");
    if (isAdminArea || user.role === "admin") {
      navigate("/admin/settings");
      return;
    }
    navigate("/settings");
  }

  if (!user) return null;
  const config = HEADER_ROLE_CONFIG[user.role] || {};

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 sticky top-0 z-40">
      <div className="flex justify-between items-center gap-6">
        
        {/* LEFT: Branding & Dynamic Subtext */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="LearnLink logo"
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                LearnLink
              </h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
                {user.role} Session
              </div>
            </div>
          </div>

          {/* DYNAMIC UI: Quick Stats (Only for Student/Parent) */}
          {config.showStats && (
            <div className="hidden lg:flex items-center gap-6 border-l border-slate-200 dark:border-slate-800 pl-8">
                <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                <span className="text-sm font-medium">{stats.courses} Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span className="text-sm font-medium">{stats.deadlines} Alerts</span>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE: Search Bar UI */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Find resources, users, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* RIGHT: Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* DYNAMIC ACTION BUTTON */}
          {config.showNew && (
            <button 
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create</span>
            </button>
          )}

          {/* NOTIFICATION BELL WITH DYNAMIC BADGE */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotif(!showNotif)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors"
            >
              <Bell size={20} className="text-slate-600 dark:text-slate-300" />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-sm">Notifications</span>
                  <button onClick={markAllRead} className="text-xs text-indigo-500 cursor-pointer">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700 transition-colors">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">No new alerts</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SETTINGS GEAR */}
          <button
            onClick={goToSettings}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Open settings"
            title="Settings"
          >
            <Settings size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;
