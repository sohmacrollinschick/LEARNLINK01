import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TutorSidebar from "./components/Tutorsidebar";

// Placeholder Pages
const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Tutor Dashboard</h1>
    <p>Here you can see your stats and sessions overview.</p>
  </div>
);

const Profile = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Tutor Profile</h1>
    <p>Manage your personal information and account settings here.</p>
  </div>
);

const Sessions = ({ type }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">{type} Sessions</h1>
    <p>View your {type.toLowerCase()} sessions here.</p>
  </div>
);

const TutorApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <Router>
      <div className={`flex h-screen ${darkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
        {/* Sidebar */}
        <TutorSidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/tutor/dashboard" element={<Dashboard />} />
            <Route path="/tutor/profile" element={<Profile />} />
            <Route path="/tutor/sessions/upcoming" element={<Sessions type="Upcoming" />} />
            <Route path="/tutor/sessions/completed" element={<Sessions type="Completed" />} />
            <Route path="/tutor/sessions/cancelled" element={<Sessions type="Cancelled" />} />
            <Route path="/tutor/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1></div>} />
            <Route path="/logout" element={<Navigate to="/tutor/dashboard" />} />
            <Route path="*" element={<Navigate to="/tutor/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default TutorApp;
