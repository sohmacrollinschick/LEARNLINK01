// ✅ AdminSidebar.jsx (routes updated to match the new routing above)
// - Past Papers -> /admin/upload/past-papers
// - Study Notes -> /admin/upload/study-notes
// - Videos -> /admin/upload/videos
// Everything else stays same

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  ChevronUp,
  Settings,
  Menu,
  Megaphone,
  UploadCloud,
  FolderOpen,
} from "lucide-react";
import logoImage from "../assets/image/learn.png";

function AdminSidebar({ darkMode }) {
  const [openUsers, setOpenUsers] = useState(false);
  const [openContent, setOpenContent] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const location = useLocation();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (path) => location.pathname === path;

  const linkBase =
    "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors duration-200";

  const activeStyle = darkMode ? "bg-indigo-900/50 text-indigo-200" : "bg-indigo-100 text-indigo-700";
  const inactiveStyle = darkMode
    ? "text-slate-300 hover:bg-slate-800/80"
    : "text-slate-700 hover:bg-slate-100";

  const dropdownLink = (to, label) => (
    <Link
      to={to}
      className="text-sm py-1.5 pl-4 border-l-2 border-transparent hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
    >
      {label}
    </Link>
  );

  return (
    <div
      className={`
        transition-all duration-300 h-screen flex flex-col justify-between
        ${darkMode ? "bg-slate-900/95 border-slate-700" : "bg-white/90 border-slate-200"}
        border-r p-4
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      <div>
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 px-2">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <img
                src={logoImage}
                alt="LearnLink logo"
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
              <span className={`text-xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                LearnLink
              </span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-1 rounded-lg ${darkMode ? "text-white hover:bg-slate-800" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex flex-col space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)] no-scrollbar">
          {/* DASHBOARD */}
          <Link
            to="/admin/dashboard"
            className={`${linkBase} ${isActive("/admin/dashboard") ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard className="w-5 h-5 text-sky-500" />
            {!isCollapsed && <span className="text-sm font-semibold">System Overview</span>}
          </Link>

          {/* UPLOAD HUB */}
          <div className="pt-4 pb-2">
            {!isCollapsed && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
                Upload Center
              </p>
            )}

            <button
              onClick={() => setOpenUpload(!openUpload)}
              className={`${linkBase} ${inactiveStyle} w-full justify-between`}
            >
              <div className="flex items-center space-x-3">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                {!isCollapsed && <span className="text-sm font-semibold">Post New...</span>}
              </div>
              {!isCollapsed && (openUpload ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
            </button>

            {!isCollapsed && openUpload && (
              <div className="ml-9 mt-1 flex flex-col space-y-1 border-l border-slate-200 dark:border-slate-700">
                {dropdownLink("/admin/upload/past-papers", "Past Papers")}
                {dropdownLink("/admin/upload/study-notes", "Study Notes (PDF)")}
                {dropdownLink("/admin/upload/videos", "Upload Videos")}
              </div>
            )}
          </div>

          {/* CONTENT MANAGEMENT */}
          <button
            onClick={() => setOpenContent(!openContent)}
            className={`${linkBase} ${inactiveStyle} w-full justify-between`}
          >
            <div className="flex items-center space-x-3">
              <FolderOpen className="w-5 h-5 text-orange-500" />
              {!isCollapsed && <span className="text-sm font-semibold">Manage Content</span>}
            </div>
            {!isCollapsed && (openContent ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
          </button>

          {!isCollapsed && openContent && (
            <div className="ml-9 mt-1 flex flex-col space-y-1 border-l border-slate-200 dark:border-slate-700">
              {dropdownLink("/admin/manage-notes", "Manage Notes")}
              {dropdownLink("/admin/manage-past-papers", "Manage Past Papers")}
              {dropdownLink("/admin/manage-videos", "Manage Videos")}
              {dropdownLink("/admin/archived", "Archive Library")}
            </div>
          )}

          {/* USER MANAGEMENT */}
          <button
            onClick={() => setOpenUsers(!openUsers)}
            className={`${linkBase} ${inactiveStyle} w-full justify-between`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-purple-500" />
              {!isCollapsed && <span className="text-sm font-semibold">User Management</span>}
            </div>
            {!isCollapsed && (openUsers ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
          </button>

          {!isCollapsed && openUsers && (
            <div className="ml-9 mt-1 flex flex-col space-y-1 border-l border-slate-200 dark:border-slate-700">
              {dropdownLink("/admin/manage", "Manage All Users")}
            </div>
          )}

          {/* SYSTEM TOOLS */}
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-6 mb-2">
              Administrative
            </p>
          )}

          <Link
            to="/admin/announcements"
            className={`${linkBase} ${isActive("/admin/announcements") ? activeStyle : inactiveStyle}`}
          >
            <Megaphone className="w-5 h-5 text-rose-500" />
            {!isCollapsed && <span className="text-sm font-medium">Broadcast News</span>}
          </Link>

          <Link
            to="/admin/settings"
            className={`${linkBase} ${isActive("/admin/settings") ? activeStyle : inactiveStyle}`}
          >
            <Settings className="w-5 h-5 text-slate-500" />
            {!isCollapsed && <span className="text-sm font-medium">System Settings</span>}
          </Link>
        </nav>
      </div>

      {/* FOOTER */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        {!isCollapsed && (
          <div className={`flex items-center space-x-3 p-2 rounded-2xl ${darkMode ? "bg-slate-800/40" : "bg-slate-50"}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              AD
            </div>
            <div>
              <p className={`text-xs font-black ${darkMode ? "text-white" : "text-gray-800"}`}>ADMINISTRATOR</p>
              <Link to="/logout" className="text-[10px] text-red-500 font-bold hover:underline">
                SIGN OUT
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSidebar;
