import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout Components
import AdminSidbar from "./components/AdminSidbar";
import Header from "./components/Header";

// Pages
import Admindashboard from "./components/Admindashboard";
import ManageUsers from "./components/ManageUsers";
import AdminArchived from "./components/Adminpast.jsx";
import Upload from "./components/Adminpastpapers.jsx";
import Adminsetting from "./components/Adminsetting.jsx";
import Allcourses from "./components/Allcourses.jsx";
import ManageCourse from "./components/ManageCourse.jsx";
import AdminManageNotes from "./components/AdminManageNotes.jsx";
import AdminManageVideos from "./components/AdminManageVideos.jsx";
import AdminManagePastPapers from "./components/AdminManagePastPapers.jsx";
import AdminAssignment from "./components/AdminAssignment.jsx";
import AdminAnnouncements from "./components/AdminAnnouncements.jsx";
import Input from "./components/Input.jsx";
import Logout from "./components/Logout.jsx";
import Uploadnotes from "./components/uploadnotes.jsx";

export default function AdminApp() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <div
      className={`${
        darkMode ? "dark" : ""
      } flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950`}
    >
      {/* Sidebar */}
      <AdminSidbar
        darkMode={darkMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm overflow-hidden">
          <Header
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        </div>

        <div className="flex-1 overflow-auto mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/65 dark:bg-slate-900/65 backdrop-blur-md p-4">
          <Routes>
            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Dashboard */}
            <Route
              path="/admin/dashboard"
              element={<Admindashboard darkMode={darkMode} />}
            />

            {/* User Management */}
            <Route
              path="/admin/manage"
              element={<ManageUsers darkMode={darkMode} />}
            />

            {/* Archived */}
            <Route
              path="/admin/archived"
              element={<AdminArchived darkMode={darkMode} />}
            />

            {/* Settings */}
            <Route
              path="/admin/settings"
              element={<Adminsetting darkMode={darkMode} />}
            />
            <Route
              path="/admin/announcements"
              element={<AdminAnnouncements darkMode={darkMode} />}
            />

            {/* Courses */}
            <Route
              path="/admin/courses"
              element={<Allcourses darkMode={darkMode} />}
            />
            <Route
              path="/admin/manage-courses"
              element={<ManageCourse darkMode={darkMode} />}
            />
            <Route
              path="/admin/manage-notes"
              element={<AdminManageNotes darkMode={darkMode} />}
            />
            <Route
              path="/admin/manage-videos"
              element={<AdminManageVideos darkMode={darkMode} />}
            />
            <Route
              path="/admin/manage-past-papers"
              element={<AdminManagePastPapers darkMode={darkMode} />}
            />

            {/* Uploads */}
            <Route
              path="/admin/upload/past-papers"
              element={<Upload darkMode={darkMode} />}
            />
             <Route
              path="/admin/upload/study-notes"
              element={<Uploadnotes darkMode={darkMode} />}
            />
            <Route
              path="/admin/upload/videos"
              element={<AdminAssignment darkMode={darkMode} />}
            />
            <Route
              path="/admin/upload/results"
              element={<Input darkMode={darkMode} />}
            />

            {/* Logout */}
            <Route path="/logout" element={<Logout />} />

            {/* Fallback */}
            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
