import React, { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Search, Users, BookOpen, ShieldCheck, GraduationCap, Video, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard({ darkMode }) {
  /* ---------- DATA STATE ---------- */
  const [profiles, setProfiles] = useState([]);
  const [videosCount, setVideosCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [pastPapersCount, setPastPapersCount] = useState(0);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const realtimeRef = useRef(null);

  /* ---------- SYNC LOGIC (UPDATED) ---------- */
  const fetchAll = async () => {
    setLoading(true);
    try {
      // Match Manage Users page source of truth.
      const [
        { data: allUsers, error: usersError },
        { count: totalVideos, error: videosError },
        { data: studyNotes, error: studyNotesError },
      ] = await Promise.all([
        supabase.rpc("admin_list_profiles"),
        supabase.from("videos").select("id", { count: "exact", head: true }),
        supabase.from("study_notes").select("id, file_url"),
      ]);

      if (usersError) throw usersError;
      if (videosError) throw videosError;
      if (studyNotesError) throw studyNotesError;

      const notesRows = studyNotes || [];
      const papersRows = notesRows.filter((row) =>
        String(row?.file_url || "").toLowerCase().includes("gce-papers")
      );

      setProfiles(allUsers || []);
      setVideosCount(totalVideos || 0);
      // Mirrors Manage Notes page data source (study_notes).
      setNotesCount(notesRows.length);
      // Mirrors Manage Past Papers filter logic.
      setPastPapersCount(papersRows.length);
      setActivity(fabricateActivity(allUsers || []));
      
      localStorage.setItem("admin_profiles", JSON.stringify(allUsers));
    } catch (err) {
      console.error("Dashboard Sync Failed:", err.message);
      showToast(`Sync Error: Check Console`);
      const cached = localStorage.getItem("admin_profiles");
      if (cached) setProfiles(JSON.parse(cached));
      setVideosCount(0);
      setNotesCount(0);
      setPastPapersCount(0);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- REALTIME LOGIC ---------- */
  const setupRealtime = () => {
    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchAll();
        showToast("Users updated.");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => {
        fetchAll();
        showToast("Videos updated.");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_notes" }, () => {
        fetchAll();
        showToast("Notes updated.");
      })
      .subscribe();
    
    realtimeRef.current = channel;
  };

  useEffect(() => {
    fetchAll();
    setupRealtime();
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  /* ---------- HELPER FUNCTIONS ---------- */
  function fabricateActivity(arr) {
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - i - 1));
      const key = d.toISOString().slice(0, 10);
      return {
        date: key,
        logins: arr.filter((p) => p.created_at?.slice(0, 10) === key).length,
      };
    });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  /* ---------- SEARCH & STATS CALCULATION ---------- */
  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(query.toLowerCase())
  );

  const totals = useMemo(() => {
    const admins = profiles.filter((p) => p.role === "admin").length;
    const students = profiles.filter((p) => p.role === "student").length;
    const parents = profiles.filter((p) => p.role === "parent").length;
    return {
      total: profiles.length,
      admins,
      students,
      parents,
      videos: videosCount,
      notes: notesCount,
      pastPapers: pastPapersCount,
    };
  }, [profiles, videosCount, notesCount, pastPapersCount]);

  /* ---------- RENDER ---------- */
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Admin Dashboard
          </h1>
          <p className={darkMode ? "text-slate-400" : "text-gray-500"}>
            {loading ? "Syncing..." : "System Overview"}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 p-2 rounded-lg border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <Search size={18} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts..."
            className="bg-transparent outline-none text-sm w-48"
          />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <StatCard darkMode={darkMode} icon={<Users />} label="Total Users" value={totals.total} color="text-blue-500" />
        <StatCard darkMode={darkMode} icon={<ShieldCheck />} label="Admins" value={totals.admins} color="text-indigo-500" />
        <StatCard darkMode={darkMode} icon={<GraduationCap />} label="Students" value={totals.students} color="text-pink-500" />
        <StatCard darkMode={darkMode} icon={<Users />} label="Parents" value={totals.parents} color="text-cyan-500" />
        <StatCard darkMode={darkMode} icon={<Video />} label="Videos Posted" value={totals.videos} color="text-red-500" />
        <StatCard darkMode={darkMode} icon={<BookOpen />} label="Notes Posted" value={totals.notes} color="text-green-500" />
        <StatCard darkMode={darkMode} icon={<FileText />} label="Past Papers" value={totals.pastPapers} color="text-amber-500" />
      </section>

      <section className={`p-6 rounded-xl border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm"}`}>
        <h3 className={`font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>Registration Trends</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activity}>
              <XAxis dataKey="date" hide />
              <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#ffffff", borderColor: darkMode ? "#334155" : "#e2e8f0" }} />
              <Line type="monotone" dataKey="logins" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, darkMode }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className={`p-3 rounded-lg ${darkMode ? "bg-slate-700" : "bg-gray-50"} ${color}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <div className={`text-xs font-medium uppercase ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{label}</div>
        <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</div>
      </div>
    </div>
  );
}
