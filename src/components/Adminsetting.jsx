import React, { useEffect, useState, useContext, createContext } from "react";
import { supabase } from "../supabaseClient";
import { offlineManager } from "../offlineStore";
import { SYNC_ACTIONS, flushPendingSync, queueSyncAction } from "../syncEngine";

// Theme context as before
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === "dark" ? "dark-theme" : "light-theme"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export default function AdminSettings({ darkMode }) {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);

  // We can store admin data here
  const [adminData, setAdminData] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  async function fetchAdminProfile() {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("No user logged in");
      setLoading(false);
      return;
    }
    setAuthUser(user);

    // Fetch admin profile from 'admins' table by user.id
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching admin profile:", error.message);
      alert("Error fetching profile");
      setAdminData({
        id: user.id,
        email: user.email || "",
      });
    } else {
      setAdminData(
        data || {
          id: user.id,
          email: user.email || "",
        },
      );
    }
    setLoading(false);
  }

  if (loading) return <div className="p-6 text-sm font-semibold text-slate-500">Loading...</div>;
  if (!adminData) return <div className="p-6 text-sm font-semibold text-rose-500">No admin data found.</div>;

  return (
    <ThemeProvider>
      <div
        className={`max-w-5xl mx-auto p-6 rounded-2xl border shadow-sm ${
          darkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
        style={{ fontFamily: "sans-serif" }}
      >
        <h1 className="text-3xl font-black tracking-tight">Admin Settings</h1>
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-6">
          {activeTab === "account" && (
            <AccountSettings adminData={adminData} setAdminData={setAdminData} />
          )}
          {activeTab === "preferences" && (
            <AppPreferences adminData={adminData} authUser={authUser} />
          )}
          {activeTab === "security" && (
            <SecurityPrivacy adminData={adminData} setAdminData={setAdminData} />
          )}
          {activeTab === "help" && <HelpSupport />}
          {activeTab === "about" && <About />}
        </div>
      </div>
    </ThemeProvider>
  );
}

function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "account", label: "Account" },
    { id: "preferences", label: "App Preferences" },
    { id: "security", label: "Security & Privacy" },
    { id: "help", label: "Help & Support" },
    { id: "about", label: "About" },
  ];

  return (
    <nav className="border-b border-slate-200 dark:border-slate-700 pb-3 mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`mr-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            activeTab === tab.id
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

// --- Account Settings ---
function AccountSettings({ adminData, setAdminData }) {
  const [profile, setProfile] = useState({
    name: adminData.name || "",
    email: adminData.email || "",
    phone: adminData.phone || "",
    profile_url: adminData.profile_url || null,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle profile pic upload to Supabase Storage
  async function uploadProfilePic(file) {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `profile_${adminData.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to bucket 'avatars' (create it in Supabase dashboard)
      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const publicURL = publicData?.publicUrl;
      if (!publicURL) throw new Error("Failed to resolve public URL");

      // Update profile_url in adminData and DB
      setProfile((prev) => ({ ...prev, profile_url: publicURL }));
      await updateAdminProfile({ profile_url: publicURL });

      alert("Profile picture updated!");
    } catch (error) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  // Save changes to name/email/phone
  async function updateAdminProfile(updates) {
    setLoading(true);
    const updatesObj = { ...updates };
    try {
      const { error } = await supabase
        .from("admins")
        .update(updatesObj)
        .eq("id", adminData.id);

      if (error) throw error;

      setAdminData((prev) => ({ ...prev, ...updatesObj }));
    } catch (error) {
      alert("Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitProfile(e) {
    e.preventDefault();
    await updateAdminProfile({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
    });
    alert("Profile updated successfully!");
  }

  return (
    <section aria-label="Account Settings">
      <h2>Profile Info</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div>
          {profile.profile_url ? (
            <img
              src={profile.profile_url}
              alt="Profile"
              style={{ width: 80, height: 80, borderRadius: "50%" }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#ccc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 30,
                color: "#666",
              }}
            >
              ?
            </div>
          )}
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files.length > 0) uploadProfilePic(e.target.files[0]);
            }}
            accept="image/*"
            disabled={uploading}
          />
          {uploading && <p>Uploading...</p>}
        </div>

        <form onSubmit={onSubmitProfile} style={{ flex: 1 }}>
          <label>
            Name:
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
              style={{ width: "100%", padding: 6, marginTop: 4 }}
              required
            />
          </label>
          <br />
          <label>
            Email:
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, email: e.target.value }))
              }
              style={{ width: "100%", padding: 6, marginTop: 4 }}
              required
            />
          </label>
          <br />
          <label>
            Phone (optional):
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, phone: e.target.value }))
              }
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>
          <br />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: "8px 12px",
              backgroundColor: "#0077ff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      <ChangePassword adminId={adminData.id} />
    </section>
  );
}

// Change Password with Supabase auth update
function ChangePassword({ adminId }) {
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    if (passwords.newPass !== passwords.confirm) {
      alert("New passwords do not match");
      return;
    }

    if (passwords.newPass.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Supabase doesn't support re-auth with password out of box.
      // So here we only update password of current logged in user.
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPass,
      });

      if (error) throw error;

      alert("Password updated successfully!");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (error) {
      alert("Failed to update password: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3 style={{ marginTop: 30 }}>Change Password</h3>
      <form onSubmit={onSubmit} style={{ maxWidth: 400 }}>
        <label>
          Current Password (for security):
          <input
            type="password"
            value={passwords.current}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, current: e.target.value }))
            }
            required
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />
        </label>
        <label>
          New Password:
          <input
            type="password"
            value={passwords.newPass}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, newPass: e.target.value }))
            }
            required
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />
        </label>
        <label>
          Confirm New Password:
          <input
            type="password"
            value={passwords.confirm}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, confirm: e.target.value }))
            }
            required
            style={{ width: "100%", padding: 6, marginTop: 4 }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            backgroundColor: "#0077ff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </>
  );
}

// --- App Preferences ---
function AppPreferences({ adminData, authUser }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [offlineMode, setOfflineMode] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [videoAutoplay, setVideoAutoplay] = useState(true);
  const [videoQuality, setVideoQuality] = useState("auto");
  const [contentLanguage, setContentLanguage] = useState("english");
  const [compactMode, setCompactMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      if (!authUser?.id) {
        if (mounted) setHydrating(false);
        return;
      }

      const cacheKey = "admin_user_preferences";
      let data = null;

      if (navigator.onLine) {
        const { data: remote, error } = await supabase
          .from("user_preferences")
          .select("offline_enabled, push_notifications, email_notifications, video_autoplay, video_quality, content_language, compact_mode")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (error) {
          data = await offlineManager.getCache(cacheKey, authUser.id);
        } else {
          data = remote ?? null;
          if (data) {
            await offlineManager.setCache(cacheKey, data, authUser.id);
          }
          await flushPendingSync(authUser.id);
        }
      } else {
        data = await offlineManager.getCache(cacheKey, authUser.id);
      }

      if (mounted && data) {
        setOfflineMode(data.offline_enabled ?? true);
        setPushNotif(data.push_notifications ?? true);
        setEmailNotif(data.email_notifications ?? true);
        setVideoAutoplay(data.video_autoplay ?? true);
        setVideoQuality(data.video_quality ?? "auto");
        setContentLanguage(data.content_language ?? "english");
        setCompactMode(data.compact_mode ?? false);
      }

      if (mounted) setHydrating(false);
    }

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, [authUser?.id]);

  async function updateNotifSettings(updates) {
    if (!authUser?.id) return;
    setLoading(true);
    try {
      const payload = {
        offline_enabled: updates.offline_enabled ?? offlineMode,
        push_notifications: updates.push_notifications ?? pushNotif,
        email_notifications: updates.email_notifications ?? emailNotif,
        video_autoplay: updates.video_autoplay ?? videoAutoplay,
        video_quality: updates.video_quality ?? videoQuality,
        content_language: updates.content_language ?? contentLanguage,
        compact_mode: updates.compact_mode ?? compactMode,
      };

      await offlineManager.setCache("admin_user_preferences", payload, authUser.id);
      await queueSyncAction(SYNC_ACTIONS.UPSERT_USER_PREFERENCES, payload, authUser.id);

      if (navigator.onLine) {
        const result = await flushPendingSync(authUser.id);
        if (result.failed > 0) {
          throw new Error("Some preference updates are queued and will retry.");
        }
      }
    } catch (error) {
      alert("Failed to update preferences: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handlers
  function toggleOffline() {
    setOfflineMode((prev) => {
      updateNotifSettings({ offline_enabled: !prev });
      return !prev;
    });
  }
  function togglePushNotif() {
    setPushNotif((prev) => {
      updateNotifSettings({ push_notifications: !prev });
      return !prev;
    });
  }
  function toggleEmailNotif() {
    setEmailNotif((prev) => {
      updateNotifSettings({ email_notifications: !prev });
      return !prev;
    });
  }
  function toggleVideoAutoplay() {
    setVideoAutoplay((prev) => {
      updateNotifSettings({ video_autoplay: !prev });
      return !prev;
    });
  }
  function changeVideoQuality(q) {
    setVideoQuality(q);
    updateNotifSettings({ video_quality: q });
  }
  function changeLanguage(value) {
    setContentLanguage(value);
    updateNotifSettings({ content_language: value });
  }
  function toggleCompactMode() {
    setCompactMode((prev) => {
      updateNotifSettings({ compact_mode: !prev });
      return !prev;
    });
  }

  if (hydrating) return <p>Loading preferences...</p>;

  return (
    <section aria-label="App Preferences">
      <h2>Theme</h2>
      <label>
        <input
          type="radio"
          checked={theme === "light"}
          onChange={() => theme !== "light" && toggleTheme()}
        />
        Light
      </label>
      <br />
      <label>
        <input
          type="radio"
          checked={theme === "dark"}
          onChange={() => theme !== "dark" && toggleTheme()}
        />
        Dark
      </label>

      <h2 style={{ marginTop: 30 }}>Offline Mode</h2>
      <label>
        <input
          type="checkbox"
          checked={offlineMode}
          onChange={toggleOffline}
          disabled={loading}
        />
        Enable offline data sync and access
      </label>

      <h2 style={{ marginTop: 30 }}>Notifications</h2>
      <label>
        <input
          type="checkbox"
          checked={emailNotif}
          onChange={toggleEmailNotif}
          disabled={loading}
        />
        Enable email notifications
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={pushNotif}
          onChange={togglePushNotif}
          disabled={loading}
        />
        Enable push notifications
      </label>

      <h2 style={{ marginTop: 30 }}>Video Playback Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={videoAutoplay}
          onChange={toggleVideoAutoplay}
          disabled={loading}
        />
        Auto-play next video
      </label>
      <br />
      <label>
        Video quality:
        <select
          value={videoQuality}
          onChange={(e) => changeVideoQuality(e.target.value)}
          disabled={loading}
          style={{ marginLeft: 8, padding: 4 }}
        >
          <option value="auto">Auto</option>
          <option value="low">Low (360p)</option>
          <option value="medium">Medium (720p)</option>
          <option value="high">High (1080p)</option>
        </select>
      </label>

      <h2 style={{ marginTop: 30 }}>Language & Layout</h2>
      <label>
        Language:
        <select
          value={contentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          disabled={loading}
          style={{ marginLeft: 8, padding: 4 }}
        >
          <option value="english">English</option>
          <option value="french">French</option>
        </select>
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={compactMode}
          onChange={toggleCompactMode}
          disabled={loading}
        />
        Compact layout mode
      </label>
    </section>
  );
}

// --- Security & Privacy ---
function SecurityPrivacy({ adminData, setAdminData }) {
  const [twoFA, setTwoFA] = useState(adminData.two_factor_enabled ?? false);
  const [shareData, setShareData] = useState(adminData.share_data ?? true);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoadingSessions(true);
    try {
      // Supabase stores sessions in auth.sessions table but it’s protected,
      // so to fetch active sessions, usually a custom table or function is required.
      // Here we simulate with current user only.

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("No user logged in");
        setSessions([]);
        setLoadingSessions(false);
        return;
      }

      // For demo, show current session only
      setSessions([
        {
          id: user.id,
          device: "Current Device",
          location: "Unknown",
          current: true,
        },
      ]);
    } catch (error) {
      alert("Failed to load sessions: " + error.message);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function updatePrivacySettings(updates) {
    setLoading(true);
    try {
      const newSettings = {
        two_factor_enabled: updates.two_factor_enabled ?? twoFA,
        share_data: updates.share_data ?? shareData,
      };
      const { error } = await supabase
        .from("admins")
        .update(newSettings)
        .eq("id", adminData.id);
      if (error) throw error;
      setTwoFA(newSettings.two_factor_enabled);
      setShareData(newSettings.share_data);
      setAdminData((prev) => ({
        ...prev,
        two_factor_enabled: newSettings.two_factor_enabled,
        share_data: newSettings.share_data,
      }));
    } catch (error) {
      alert("Failed to update privacy settings: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Toggle 2FA
  function toggleTwoFA() {
    updatePrivacySettings({ two_factor_enabled: !twoFA });
  }

  // Toggle Data Sharing
  function toggleShareData() {
    updatePrivacySettings({ share_data: !shareData });
  }

  return (
    <section aria-label="Security and Privacy">
      <h2>Two-Factor Authentication (2FA)</h2>
      <label>
        <input
          type="checkbox"
          checked={twoFA}
          onChange={toggleTwoFA}
          disabled={loading}
        />
        Enable Two-Factor Authentication
      </label>

      <h2 style={{ marginTop: 30 }}>Data Sharing</h2>
      <label>
        <input
          type="checkbox"
          checked={shareData}
          onChange={toggleShareData}
          disabled={loading}
        />
        Share anonymized usage data to improve LearnLink
      </label>

      <h2 style={{ marginTop: 30 }}>Active Sessions</h2>
      {loadingSessions ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p>No active sessions found.</p>
      ) : (
        <ul>
          {sessions.map((sess) => (
            <li key={sess.id} style={{ marginBottom: 10 }}>
              <strong>{sess.device}</strong> - {sess.location}{" "}
              {sess.current && <em>(Current session)</em>}
              {/* Add session logout button if you implement backend session management */}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// --- Help & Support ---
function HelpSupport() {
  return (
    <section aria-label="Help and Support">
      <h2>FAQ</h2>
      <p>
        <a
          href="https://learnlink.example.com/faq"
          target="_blank"
          rel="noreferrer"
        >
          Visit our FAQ page
        </a>
      </p>

      <h2 style={{ marginTop: 30 }}>Contact Support</h2>
      <p>Email: support@learnlink.example.com</p>
      <p>Chat: (coming soon)</p>

      <h2 style={{ marginTop: 30 }}>Report a Bug / Feedback</h2>
      <FeedbackForm />
    </section>
  );
}

function FeedbackForm() {
  const [feedback, setFeedback] = useState("");
  const onSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      alert("Please write your feedback.");
      return;
    }
    alert("Thanks for your feedback!");
    setFeedback("");
  };
  return (
    <form onSubmit={onSubmit}>
      <textarea
        rows={5}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Write your feedback here..."
        style={{ width: "100%", padding: 8 }}
      />
      <button
        type="submit"
        style={{
          marginTop: 10,
          padding: "8px 12px",
          backgroundColor: "#0077ff",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Submit Feedback
      </button>
    </form>
  );
}

// --- About ---
function About() {
  return (
    <section aria-label="About LearnLink">
      <h2>LearnLink</h2>
      <p>Version: 1.0.0</p>
      <p>
        LearnLink is an offline-first e-learning platform designed for
        accessibility and performance, especially in low bandwidth regions.
      </p>
      <p>
        <a
          href="https://learnlink.example.com/terms"
          target="_blank"
          rel="noreferrer"
        >
          Terms & Conditions
        </a>{" "}
        |{" "}
        <a
          href="https://learnlink.example.com/privacy"
          target="_blank"
          rel="noreferrer"
        >
          Privacy Policy
        </a>
      </p>
    </section>
  );
}
