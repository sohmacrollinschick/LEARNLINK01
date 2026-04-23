import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "./Usercontext";
import { trackStudentActivity } from "../lib/studentActivity";
import {
  Trophy,
  Download,
  Video,
  CheckCircle,
  TrendingUp,
  CalendarDays,
  GraduationCap
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function StudentDashboard() {
  const { user } = useUser();

  const [stats, setStats] = useState({
    attendance_rate: 0,
    videos_watched: 0,
    quizzes_completed: 0,
    term_average: 0,
    points: 0,
    subscription: "Free"
  });

  const [rank, setRank] = useState(0);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    if (user) fetchStudentData();
  }, [user]);

  async function fetchStudentData() {
    const userId = user.id;

    // 🔹 1. Profile (subscription)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription")
      .eq("id", userId)
      .single();

    // 🔹 2. Quiz attempts
    const { data: quizzes } = await supabase
      .from("quiz_attempts")
      .select("score, total, percentage, created_at")
      .eq("user_id", userId);

    const quizzesCompleted = quizzes?.length || 0;
    const totalScore = quizzes?.reduce((acc, q) => acc + q.score, 0) || 0;
    const totalPossible = quizzes?.reduce((acc, q) => acc + q.total, 0) || 0;

    const average =
      totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    // 🔹 3. Course progress
    const { data: progress } = await supabase
      .from("course_progress")
      .select("progress_percentage, completed_parts")
      .eq("user_id", userId);

    const videosWatched =
      progress?.reduce((acc, p) => acc + p.completed_parts, 0) || 0;

    const attendance =
      progress?.length > 0
        ? Math.round(
            progress.reduce((acc, p) => acc + p.progress_percentage, 0) /
              progress.length
          )
        : 0;

    // 🔹 4. Leaderboard (calculate ranking)
    const { data: leaderboard } = await supabase
      .from("quiz_attempts")
      .select("user_id, score");

    const scoresMap = {};

    leaderboard?.forEach((row) => {
      scoresMap[row.user_id] =
        (scoresMap[row.user_id] || 0) + row.score;
    });

    const sorted = Object.entries(scoresMap)
      .sort((a, b) => b[1] - a[1]);

    const position =
      sorted.findIndex(([id]) => id === userId) + 1;

    setRank(position || 0);

    // Top 3
    setLeaders(sorted.slice(0, 3));

    setStats({
      attendance_rate: attendance,
      videos_watched: videosWatched,
      quizzes_completed: quizzesCompleted,
      term_average: average,
      points: totalScore,
      subscription: profile?.subscription || "Free"
    });

    trackStudentActivity({
      user,
      eventType: "dashboard_sync",
      pagePath: "/dashboard",
      metadata: {
        quizzesCompleted,
        videosWatched,
        attendance,
        average,
      },
    });
  }

  function downloadReport() {
    const now = new Date();
    const lines = [
      "LearnLink Academic Progress Report",
      "",
      `Generated: ${now.toLocaleString()}`,
      `Student: ${user?.email || "Unknown"}`,
      `Rank: #${rank || "-"}`,
      "",
      `Attendance Rate: ${stats.attendance_rate}%`,
      `Videos Watched: ${stats.videos_watched}`,
      `Quizzes Completed: ${stats.quizzes_completed}`,
      `Average Score: ${stats.term_average}%`,
      `Points: ${stats.points}`,
      `Subscription: ${stats.subscription}`,
    ];

    const blob = buildSimplePdf(lines);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "academic_progress.pdf";
    link.click();

    trackStudentActivity({
      user,
      eventType: "download_report",
      pagePath: "/dashboard",
      targetType: "button",
      targetId: "academic_progress_report",
      metadata: { format: "pdf" },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">

      {/* HERO */}
      <div className="bg-blue-600 text-white rounded-3xl p-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">
            Hello, {user?.email?.split("@")[0]} 👋
          </h1>
          <p className="text-sm mt-2">
            Rank #{rank} • {stats.points} XP • {stats.subscription} Plan
          </p>
        </div>

        <button
          onClick={downloadReport}
          className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold"
        >
          <Download size={18} /> Download Report
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<CalendarDays />} label="Attendance" value={`${stats.attendance_rate}%`} />
        <StatCard icon={<Video />} label="Videos Watched" value={stats.videos_watched} />
        <StatCard icon={<CheckCircle />} label="Quizzes Completed" value={stats.quizzes_completed} />
        <StatCard icon={<GraduationCap />} label="Average Score" value={`${stats.term_average}%`} />
      </div>

      {/* CHART */}
      <div className="bg-white p-8 rounded-3xl border">
        <h2 className="font-black mb-6 flex items-center gap-2">
          <TrendingUp size={18} /> Academic Progress
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={[
              { name: "Average", value: stats.term_average }
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* LEADERBOARD */}
      <div className="bg-white p-8 rounded-3xl border">
        <h2 className="font-black mb-6 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" /> Top Students
        </h2>

        {leaders.map(([id, points], i) => (
          <div
            key={id}
            className="flex justify-between bg-slate-100 p-4 rounded-2xl mb-3"
          >
            <span>#{i + 1} Student {id.slice(0, 5)}</span>
            <span>{points} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl border flex items-center gap-4">
      <div className="p-3 bg-slate-100 rounded-xl">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

function buildSimplePdf(lines) {
  const escapePdfText = (value) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  let y = 790;
  const textOps = ["BT", "/F1 12 Tf"];

  lines.forEach((line, index) => {
    if (y < 60) return;
    textOps.push(`1 0 0 1 50 ${y} Tm`);
    textOps.push(`(${escapePdfText(line)}) Tj`);
    y -= index === 0 ? 24 : 18;
  });

  textOps.push("ET");

  const streamContent = textOps.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}
