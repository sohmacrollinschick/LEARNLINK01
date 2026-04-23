import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { usePopup } from "./PopupProvider";
import { Bell, Crown, Globe, Loader2, Lock, LogOut, Monitor, PlayCircle, Trash2, Wifi } from "lucide-react";

const defaultPrefs = {
  email_notifications: true,
  push_notifications: true,
  offline_enabled: true,
  video_autoplay: true,
  video_quality: "auto",
  theme: "system",
  content_language: "english",
  compact_mode: false,
};

export default function Settings() {
  const { showConfirm } = usePopup();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [userInfo, setUserInfo] = useState({
    email: "",
    subscription: "Free",
    preferences: defaultPrefs,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: profileData }, { data: prefData }] = await Promise.all([
      supabase.from("profiles").select("subscription").eq("id", user.id).maybeSingle(),
      supabase
        .from("user_preferences")
        .select(
          "email_notifications, push_notifications, offline_enabled, video_autoplay, video_quality, theme, content_language, compact_mode",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setUserInfo({
      email: user.email || "",
      subscription: profileData?.subscription || "Free",
      preferences: {
        ...defaultPrefs,
        ...(prefData || {}),
      },
    });
    setLoading(false);
  }

  async function savePreferences() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      ...userInfo.preferences,
    };

    const { error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      alert(error.message || "Failed to save preferences.");
      return;
    }
    alert("Preferences saved.");
  }

  async function changePassword() {
    if (!password) return alert("Enter new password");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert(error.message);
    else {
      alert("Password updated.");
      setPassword("");
    }
  }

  async function logoutAll() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function deleteAccount() {
    const confirmed = await showConfirm("This will permanently delete your account. Continue?");
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").delete().eq("id", user.id);
    window.location.href = "/";
  }

  function patchPrefs(next) {
    setUserInfo((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...next,
      },
    }));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black mb-10">Settings</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock size={18} /> Security
          </h2>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl border"
          />
          <button onClick={changePassword} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold">
            Update Password
          </button>
          <button
            onClick={logoutAll}
            className="w-full bg-gray-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          <Row
            label="Email Notifications"
            checked={userInfo.preferences.email_notifications}
            onChange={(v) => patchPrefs({ email_notifications: v })}
          />
          <Row
            label="Push Notifications"
            checked={userInfo.preferences.push_notifications}
            onChange={(v) => patchPrefs({ push_notifications: v })}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <PlayCircle size={18} /> Learning Experience
          </h2>
          <Row
            label="Auto-play Videos"
            checked={userInfo.preferences.video_autoplay}
            onChange={(v) => patchPrefs({ video_autoplay: v })}
          />
          <Row
            label="Offline Learning Enabled"
            checked={userInfo.preferences.offline_enabled}
            onChange={(v) => patchPrefs({ offline_enabled: v })}
            icon={<Wifi size={16} className="text-blue-500" />}
          />
          <div className="flex items-center justify-between">
            <span>Video Quality</span>
            <select
              value={userInfo.preferences.video_quality}
              onChange={(e) => patchPrefs({ video_quality: e.target.value })}
              className="px-3 py-2 rounded-xl border"
            >
              <option value="auto">Auto</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Monitor size={18} /> App Appearance
          </h2>
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <select
              value={userInfo.preferences.theme}
              onChange={(e) => patchPrefs({ theme: e.target.value })}
              className="px-3 py-2 rounded-xl border"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Globe size={16} className="text-indigo-500" />
              Language
            </span>
            <select
              value={userInfo.preferences.content_language}
              onChange={(e) => patchPrefs({ content_language: e.target.value })}
              className="px-3 py-2 rounded-xl border"
            >
              <option value="english">English</option>
              <option value="french">French</option>
            </select>
          </div>
          <Row
            label="Compact Mode"
            checked={userInfo.preferences.compact_mode}
            onChange={(v) => patchPrefs({ compact_mode: v })}
          />
          <button
            onClick={savePreferences}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <h2 className="text-lg font-bold mb-4 flex items-center justify-center gap-2">
            <Crown size={18} />
            Subscription
          </h2>
          <div className="inline-flex px-6 py-3 bg-yellow-100 text-yellow-700 rounded-full font-bold mb-6">
            {userInfo.subscription}
          </div>
          {userInfo.subscription === "Free" && (
            <button
              onClick={() => (window.location.href = "/subscription")}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold"
            >
              Upgrade to Premium
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-200">
          <h2 className="text-lg font-bold text-red-600 mb-6 flex items-center gap-2">
            <Trash2 size={18} />
            Danger Zone
          </h2>
          <button onClick={deleteAccount} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold">
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, checked, onChange, icon = null }) {
  return (
    <div className="flex justify-between items-center">
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
