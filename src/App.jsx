import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Layout Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Page Components
import Dashboard from "./components/StudentDashboard";
import Home from "./components/Home";
import NotificationsPage from "./components/Massages"; 
import Notes from "./components/Notes";
import OfflineLibrary from "./components/OfflineLibrary";
import ArchivedContent from "./components/ArchivedContent";
import Notesview from "./components/Notesview";
import PastPapers from "./components/PastPapers";
import Leaderboard from "./components/Leaderboard";
import Subscription from "./components/Subscription";
import Community from "./components/Community";
import HelpCenter from "./components/Helpcenter";
import Profile from "./components/Profile";
import Settings from "./components/Setting";
import { extractClickableInfo, trackStudentActivity } from "./lib/studentActivity";


// Auth Context
import { useUser } from "./components/Usercontext.jsx";

export default function App() {
  const { user, loading } = useUser();
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const interactionRef = useRef({ clicks: 0 });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Verifying Account...</p>
        </div>
      </div>
    );
  }

  
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  useEffect(() => {
    trackStudentActivity({
      user,
      eventType: "session_start",
      pagePath: location.pathname,
      metadata: { source: "student_app" },
    });
    // Intentionally once per authenticated user session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    trackStudentActivity({
      user,
      eventType: "page_view",
      pagePath: location.pathname,
      metadata: { search: location.search || null },
    });
  }, [user, location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event) => {
      const info = extractClickableInfo(event.target);
      if (!info) return;

      interactionRef.current.clicks += 1;
      trackStudentActivity({
        user,
        eventType: "click",
        pagePath: location.pathname,
        targetType: info.targetType,
        targetId: info.targetId,
        metadata: {
          ...info.metadata,
          clickCountSession: interactionRef.current.clicks,
        },
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [user, location.pathname]);

  
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-gray-950" : "bg-gray-100"}`}>
      
      {/* Sidebar - Now correctly tied to an authenticated user */}
      <Sidebar darkMode={darkMode} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="flex-1 overflow-y-auto no-scrollbar p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Home />} />
            <Route path="/notifications" element={<NotificationsPage darkMode={darkMode} />} />
            <Route path="/gce-papers" element={<PastPapers />} />
            <Route path="/downloads/notes" element={<Notes />} />
            <Route path="/offline-library" element={<OfflineLibrary />} />
            <Route path="/archive" element={<ArchivedContent />} />
            <Route path="/my-notes" element={<Notesview />} />
             <Route path="/rankings" element={<Leaderboard />} />
            <Route path="/subscription" element={<Subscription />} /> 
            <Route path="/community" element={<Community />} />
            <Route path="/support" element={<HelpCenter />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />


            {/* Default Redirection */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
