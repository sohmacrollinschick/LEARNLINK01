// src/pages/AdminNotes.jsx  (Option A: uploads into study_notes)

import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Save, Loader2 } from "lucide-react";

export default function AdminNotes({ darkMode }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [formData, setFormData] = useState({
    title: "",
    subject: "Biology",
    topic: "",
    class_level: "Form 3",
  });
  const [paperFile, setPaperFile] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      if (!paperFile) throw new Error("Choose a file to upload.");

      const safeName = paperFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${formData.class_level}/${formData.subject}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("GCE-PAPERS")
        .upload(filePath, paperFile, { upsert: false, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("GCE-PAPERS").getPublicUrl(filePath);
      if (!publicData?.publicUrl) throw new Error("Failed to generate file URL.");

      const payload = {
        ...formData,
        file_url: publicData.publicUrl,
      };

      const { error } = await supabase.from("study_notes").insert([payload]);
      if (error) throw error;

      setStatus({ type: "success", msg: "Past paper uploaded successfully!" });
      setFormData({
        title: "",
        subject: "Biology",
        topic: "",
        class_level: "Form 3",
      });
      setPaperFile(null);
    } catch (err) {
      console.error("Insert error:", err);
      const raw = err?.message || "Upload failed.";
      let rlsHint = "";
      if (raw.toLowerCase().includes("row-level security")) {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id || "unknown";
        rlsHint = ` Ensure notes/papers RLS migration is applied and this account is in public.admins. User id: ${uid}.`;
      }
      setStatus({ type: "error", msg: `${raw}.${rlsHint}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto py-6 px-4 ${darkMode ? "text-white" : "text-slate-800"}`}>
      <h2 className="text-3xl font-black mb-6 tracking-tight">Upload Past Papers</h2>

      <form
        onSubmit={handleSave}
        className={`p-8 rounded-2xl border shadow-sm ${
          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        } space-y-4`}
      >
        <input
          placeholder="Note Title (e.g. Calculus Intro)"
          required
          className={`w-full p-4 rounded-xl border outline-none ${
            darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Topic (optional)"
            className={`p-4 rounded-xl border outline-none ${
              darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />

          <select
            className={`p-4 rounded-xl border ${
              darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}
            value={formData.class_level}
            onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
          >
            <option>Form 1</option>
            <option>Form 2</option>
            <option>Form 3</option>
            <option>Form 4</option>
            <option>Form 5</option>
            <option>Lower Sixth</option>
            <option>Upper Sixth</option>
          </select>
        </div>

        {/* Subject dropdown (optional) */}
        <select
          className={`w-full p-4 rounded-xl border ${
            darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        >
          <option>Biology</option>
          <option>Chemistry</option>
          <option>Physics</option>
          <option>Mathematics</option>
          <option>English</option>
          <option>Geography</option>
          <option>History</option>
          <option>Economics</option>
          <option>Computer Science</option>
        </select>

        <div>
          <input
            required
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className={`w-full p-4 rounded-xl border outline-none ${
              darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}
            onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
          />
        </div>

        {status.msg ? (
          <div
            className={`p-4 rounded-2xl font-bold text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status.msg}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> PUBLISH PAST PAPER</>}
        </button>
      </form>
    </div>
  );
}
