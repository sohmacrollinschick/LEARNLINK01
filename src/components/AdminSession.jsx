import React from "react";

export default function AdminSession({ darkMode }) {
  return (
    <div
      className={`max-w-5xl mx-auto space-y-6 ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Current Sessions</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
            Session planning tools will be added here later.
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl p-6 border ${
          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <p className="text-sm text-slate-500">
          This page is currently a placeholder. All teacher and session
          management features have been disabled until you decide how you want
          to handle them.
        </p>
      </div>
    </div>
  );
}

