import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { FileText, Loader2, Save, GraduationCap } from "lucide-react";

const UploadNotes = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [selectedClass, setSelectedClass] = useState("Form 3");

  const cameroonClasses = useMemo(
    () => [
      "Form 1",
      "Form 2",
      "Form 3",
      "Form 4",
      "Form 5",
    ],
    []
  );

  const [formData, setFormData] = useState({
    title: "",
    subject: "Biology",
    topic: "",
  });
  const [noteFile, setNoteFile] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      if (!noteFile) throw new Error("Choose a file to upload.");

      const safeName = noteFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${selectedClass}/${formData.subject}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("lesson-notes")
        .upload(filePath, noteFile, { upsert: false, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("lesson-notes").getPublicUrl(filePath);
      if (!publicData?.publicUrl) throw new Error("Failed to generate file URL.");

      const payload = {
        ...formData,
        class_level: selectedClass,
        file_url: publicData.publicUrl,
      };

      const { error } = await supabase.from("study_notes").insert([payload]);
      if (error) throw error;

      setStatus({ type: "success", msg: "Notes published successfully!" });
      setFormData({ title: "", subject: "Biology", topic: "" });
      setNoteFile(null);
    } catch (err) {
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
    <div className="p-6 bg-transparent min-h-screen">

      {/* PAGE TITLE */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Add content to LearnLink Library
        </h1>
      </div>

      {/* CLASS SELECTOR PILLS */}
      <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
        {cameroonClasses.map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => setSelectedClass(cls)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all
              ${
                selectedClass === cls
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500"
              }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* MAIN CARD */}
      <div className="max-w-4xl">
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700"
        >

          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                <FileText size={28} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Publishing
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Study Note
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <GraduationCap size={16} />
              {selectedClass}
            </div>
          </div>

          {/* INPUT GRID */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">

            <input
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Note title (e.g. Trigonometry Basics)"
              className="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
            />

            <select
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
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
          </div>

          <div className="mb-6">
            <input
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              placeholder="Topic (optional) e.g. Photosynthesis"
              className="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
            />
          </div>

          <div className="mb-8">
            <input
              required
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setNoteFile(e.target.files?.[0] || null)}
              className="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
            />
          </div>

          {/* STATUS MESSAGE */}
          {status.msg && (
            <div
              className={`mb-6 px-6 py-4 rounded-xl text-sm font-bold ${
                status.type === "success"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {status.msg}
            </div>
          )}

          {/* PUBLISH BUTTON */}
          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Publishing...
              </>
            ) : (
              <>
                <Save size={18} />
                Publish Note
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-5">
            File is uploaded to Supabase bucket <strong>lesson-notes</strong> and stored as a direct URL.
          </p>
        </form>
      </div>
    </div>
  );
};

export default UploadNotes;
