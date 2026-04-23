import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "./UserContext";
import {
  LayoutDashboard,
  Settings,
  LogOutIcon,
  Trophy,
  BookOpen,
  FileText,
  MessageSquare,
  UserCog,
  Menu,
  ChevronRight,
  HelpCircle,
  FileDown,
  Archive,
  WifiOff,
  StickyNote,
  ShieldCheck,
} from "lucide-react";
import logoImage from "../assets/image/learn.png";

const Sidebar = () => {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role?.toLowerCase() || "learner";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  /* ================= MENU CONFIG ================= */

  const menuConfig = {
    learner: [
      { id: "dash", icon: <LayoutDashboard />, label: "My Learning", to: "/dashboard", color: "text-blue-500" },
      { id: "courses", icon: <BookOpen />, label: "Browse Courses", to: "/courses", color: "text-pink-500" },
      { id: "notes", icon: <StickyNote />, label: "Study Notes", to: "/my-notes", color: "text-purple-500" },
      { id: "papers", icon: <FileText />, label: "Past Papers", to: "/gce-papers", color: "text-amber-500" },
      { id: "downloads", icon: <FileDown />, label: "Download Notes", to: "/downloads/notes", color: "text-emerald-500" },
      { id: "offline", icon: <WifiOff />, label: "Offline Library", to: "/offline-library", color: "text-red-500" },
      { id: "archive", icon: <Archive />, label: "Archived Content", to: "/archive", color: "text-slate-400" },
      { id: "rank", icon: <Trophy />, label: "Leaderboard", to: "/rankings", color: "text-orange-500" },
    ],

    parent: [
      { id: "results", icon: <LayoutDashboard />, label: "Child Results", to: "/parent/results", color: "text-blue-500" },
      { id: "subscription", icon: <ShieldCheck />, label: "Subscription", to: "/subscription", color: "text-amber-500" },
    ]
  };

  const currentMenu = menuConfig[role] || menuConfig.learner;

  /* ================= SIDEBAR ITEM ================= */

  const SidebarItem = ({ icon, label, to, colorClass }) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        title={isCollapsed ? label : undefined}
        aria-label={isCollapsed ? label : undefined}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
        ${isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
          : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        {React.cloneElement(icon, {
          className: `w-5 h-5 ${isActive ? "text-white" : colorClass}`,
        })}
        {!isCollapsed && <span className="font-bold text-sm">{label}</span>}
      </Link>
    );
  };

  return (
    <div
      className={`h-screen flex flex-col justify-between border-r bg-white transition-all duration-300
      ${isCollapsed ? "w-20" : "w-72"}`}
    >
      {/* LOGO */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="LearnLink logo"
            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
          />
          {!isCollapsed && (
            <span className="text-lg font-black">LearnLink</span>
          )}
        </div>

        <button onClick={toggleSidebar}>
          <Menu size={18} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto">

        {currentMenu.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            to={item.to}
            colorClass={item.color}
          />
        ))}

        {/* SUPPORT SECTION */}
        <div className="pt-6 space-y-2">
          {role !== "parent" && (
            <SidebarItem
              icon={<MessageSquare />}
              label="Community"
              to="/community"
              colorClass="text-blue-400"
            />
          )}

          <SidebarItem
            icon={<HelpCircle />}
            label="Help Center"
            to="/support"
            colorClass="text-slate-400"
          />
        </div>
      </nav>

      {/* PROFILE SECTION */}
      <div className="p-4 border-t bg-slate-50">
        <div className="relative">
          <AnimatePresence>
            {showProfileMenu && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-xl shadow-lg p-2"
              >
                <Link
                  to="/profile"
                  className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg"
                >
                  <UserCog size={16} />
                  <span className="text-sm font-bold">Profile</span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg"
                >
                  <Settings size={16} />
                  <span className="text-sm font-bold">Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-lg"
                >
                  <LogOutIcon size={16} />
                  <span className="text-sm font-bold">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => !isCollapsed && setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>

            {!isCollapsed && (
              <div className="flex-1 flex justify-between items-center">
                <span className="font-bold text-sm truncate">
                  {user?.email?.split("@")[0]}
                </span>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${showProfileMenu ? "-rotate-90" : ""}`}
                />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
