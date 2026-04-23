// src/pages/Leaderboard.jsx

import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Trophy, Medal, Crown, Loader2 } from "lucide-react";

const Leaderboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Example table: leaderboard
      // columns: id, full_name, points, class_level
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;

      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0)
      return <Crown className="text-yellow-500" size={20} />;
    if (index === 1)
      return <Medal className="text-slate-400" size={20} />;
    if (index === 2)
      return <Medal className="text-amber-600" size={20} />;
    return (
      <span className="text-xs font-black text-slate-400">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 transition-all">

      {/* PAGE HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Trophy className="text-blue-600" />
          Leaderboard
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Top performing students on LearnLink
        </p>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="max-w-4xl">

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

            {students.map((student, index) => (
              <div
                key={student.id}
                className={`flex items-center justify-between px-8 py-6 transition-all
                  ${
                    index === 0
                      ? "bg-yellow-50 dark:bg-yellow-900/10"
                      : "border-t border-slate-100 dark:border-slate-800"
                  }
                `}
              >
                {/* LEFT SIDE */}
                <div className="flex items-center gap-5">

                  {/* RANK */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {getRankIcon(index)}
                  </div>

                  {/* NAME */}
                  <div>
                    <p className="font-black text-lg text-slate-900 dark:text-white">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                      {student.class_level}
                    </p>
                  </div>
                </div>

                {/* POINTS */}
                <div className="text-right">
                  <p className="text-xl font-black text-blue-600">
                    {student.points}
                  </p>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Points
                  </p>
                </div>
              </div>
            ))}

            {students.length === 0 && (
              <div className="text-center py-20 text-slate-400 font-bold">
                No leaderboard data yet.
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;