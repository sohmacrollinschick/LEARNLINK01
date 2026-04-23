import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Edit2, Save, Trash2, X, ExternalLink } from "lucide-react";
import { usePopup } from "./PopupProvider";

const isPastPaperRow = (row) => String(row?.file_url || "").toLowerCase().includes("gce-papers");

const extractBucketObjectPath = (fileUrl) => {
  const raw = String(fileUrl || "").trim();
  if (!raw) return null;
  const marker = "/storage/v1/object/public/GCE-PAPERS/";
  const idx = raw.indexOf(marker);
  if (idx === -1) return null;
  const path = raw.slice(idx + marker.length).split("?")[0];
  return path || null;
};

export default function AdminManagePastPapers({ darkMode }) {
  const { showConfirm } = usePopup();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [draft, setDraft] = useState({
    title: "",
    subject: "",
    topic: "",
    class_level: "",
    file_url: "",
  });

  useEffect(() => {
    fetchPastPapers();
  }, []);

  async function fetchPastPapers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_notes")
      .select("id, title, subject, topic, class_level, file_url, created_at")
      .order("created_at", { ascending: false });

    if (!error) {
      setPapers((data || []).filter(isPastPaperRow));
    } else {
      setPapers([]);
    }
    setLoading(false);
  }

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({
      title: row.title || "",
      subject: row.subject || "",
      topic: row.topic || "",
      class_level: row.class_level || "",
      file_url: row.file_url || "",
    });
  }

  async function saveEdit(id) {
    const { error } = await supabase.from("study_notes").update(draft).eq("id", id);
    if (!error) {
      setEditingId(null);
      fetchPastPapers();
    }
  }

  async function deletePaper(row) {
    const confirmed = await showConfirm("Delete this past paper?");
    if (!confirmed) return;

    const objectPath = extractBucketObjectPath(row.file_url);
    if (objectPath) {
      await supabase.storage.from("GCE-PAPERS").remove([objectPath]);
    }

    const { error } = await supabase.from("study_notes").delete().eq("id", row.id);
    if (!error) setPapers((prev) => prev.filter((item) => item.id !== row.id));
  }

  const processed = [...papers]
    .filter((row) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        (row.title || "").toLowerCase().includes(term) ||
        (row.subject || "").toLowerCase().includes(term) ||
        (row.class_level || "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "title_asc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "title_desc") return (b.title || "").localeCompare(a.title || "");
      if (sortBy === "subject_asc") return (a.subject || "").localeCompare(b.subject || "");
      if (sortBy === "class_asc") return (a.class_level || "").localeCompare(b.class_level || "");
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className={`text-3xl font-black mb-6 ${darkMode ? "text-white" : "text-slate-900"}`}>
        Manage Past Papers
      </h1>

      <div className="mb-4 grid md:grid-cols-2 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, subject, or class..."
          className={`w-full rounded-xl px-4 py-3 border ${
            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`w-full rounded-xl px-4 py-3 border ${
            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="title_asc">Sort: Title (A-Z)</option>
          <option value="title_desc">Sort: Title (Z-A)</option>
          <option value="subject_asc">Sort: Subject (A-Z)</option>
          <option value="class_asc">Sort: Class (A-Z)</option>
        </select>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
        {loading ? (
          <div className={`p-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Loading past papers...</div>
        ) : processed.length === 0 ? (
          <div className={`p-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>No uploaded past papers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-50 text-slate-700"}>
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Class</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((row) => (
                  <tr key={row.id} className={darkMode ? "border-t border-slate-700" : "border-t border-slate-100"}>
                    <td className="p-3">
                      {editingId === row.id ? (
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                          className={`w-full rounded-lg px-3 py-2 border ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                        />
                      ) : (
                        row.title
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === row.id ? (
                        <input
                          value={draft.subject}
                          onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                          className={`w-full rounded-lg px-3 py-2 border ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                        />
                      ) : (
                        row.subject
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === row.id ? (
                        <input
                          value={draft.class_level}
                          onChange={(e) => setDraft((d) => ({ ...d, class_level: e.target.value }))}
                          className={`w-full rounded-lg px-3 py-2 border ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                        />
                      ) : (
                        row.class_level
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {row.file_url ? (
                          <a
                            href={row.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-sky-600 text-white"
                            title="Open file"
                          >
                            <ExternalLink size={16} />
                          </a>
                        ) : null}
                        {editingId === row.id ? (
                          <>
                            <button onClick={() => saveEdit(row.id)} className="p-2 rounded-lg bg-emerald-600 text-white">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-slate-500 text-white">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(row)} className="p-2 rounded-lg bg-indigo-600 text-white">
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button onClick={() => deletePaper(row)} className="p-2 rounded-lg bg-rose-600 text-white">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
