import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AdminApp from "./AdminApp";
import Login from "./Login";
import { UserProvider, useUser } from "./components/Usercontext.jsx";
import { PopupProvider } from "./components/PopupProvider.jsx";
import SyncBootstrap from "./components/SyncBootstrap.jsx";

function MainContent() {
  const { user, loading } = useUser();

  // 1. Wait for Supabase to finish checking the session
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold animate-pulse">LearnLink Cameroon...</p>
        </div>
      </div>
    );
  }

  // 2. If no user is found, ONLY show the Login page
  // This prevents any syncing or dashboard access
  if (!user) {
    return <Login />;
  }

  // 3. Role-based Routing (Only happens AFTER login)
  // Ensure your Supabase user_metadata or profiles table has these roles
  if (user.user_metadata?.role === "admin" || user.role === "admin") {
    return <AdminApp />;
  }
  

  // 4. Default to Student App
  return <App />;
}

function Main() {
  return (
    <BrowserRouter>
      <UserProvider>
        <PopupProvider>
          <SyncBootstrap />
          <MainContent />
        </PopupProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
