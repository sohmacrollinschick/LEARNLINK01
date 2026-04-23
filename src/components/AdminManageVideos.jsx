import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Edit2, Loader2, Save, Trash2, X } from "lucide-react";
import { usePopup } from "./PopupProvider";

export default function AdminManageVideos({ darkMode }) {
  const { showConfirm } = usePopup();
  const [videos, setVideos] = useState([]);
  const [subjectsById, setSubjectsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: "" });
  const [editingParts, setEditingParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partBusy, setPartBusy] = useState(false);
  const [newPartTitle, setNewPartTitle] = useState("");
  const [newPartFile, setNewPartFile] = useState(null);
  const [partError, setPartError] = useState("");
  const [partSuccess, setPartSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchSubjects(), fetchVideos()]);
    setLoading(false);
  }

  async function fetchSubjects() {
    const { data, error } = await supabase.from("subjects").select("id, name, form");
    if (error) return;

    const map = {};
    (data || []).forEach((s) => {
      map[String(s.id)] = { name: s.name || "", form: s.form || "" };
    });
    setSubjectsById(map);
  }

  async function fetchVideos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, subject_id, thumbnail_url, created_at")
      .order("created_at", { ascending: false });
    if (!error) setVideos(data || []);
    setLoading(false);
  }

  function normalizeStoragePath(storagePath) {
    if (!storagePath || typeof storagePath !== "string") return "";
    let path = storagePath.trim();

    if (path.includes("/storage/v1/object/public/videos/")) {
      path = path.split("/storage/v1/object/public/videos/")[1] || "";
    }
    if (path.includes("/storage/v1/object/sign/videos/")) {
      path = path.split("/storage/v1/object/sign/videos/")[1] || "";
      path = path.split("?")[0] || "";
    }
    if (path.startsWith("videos/")) {
      path = path.replace(/^videos\//, "");
    }

    return path.replace(/^\/+/, "");
  }

  async function fetchVideoParts(videoId) {
    setPartsLoading(true);
    setPartError("");

    const { data, error } = await supabase
      .from("video_parts")
      .select("id, title, position, storage_path, created_at")
      .eq("video_id", videoId)
      .order("position", { ascending: true });

    if (error) {
      setPartError(error.message || "Could not load lesson parts.");
      setEditingParts([]);
    } else {
      setEditingParts(
        (data || []).map((part) => ({
          ...part,
          storage_path: normalizeStoragePath(part.storage_path),
        }))
      );
    }

    setPartsLoading(false);
  }

  function startEdit(video) {
    setEditingId(video.id);
    setDraft({ title: video.title || "" });
    setEditingParts([]);
    setNewPartTitle("");
    setNewPartFile(null);
    setPartError("");
    setPartSuccess("");
    fetchVideoParts(video.id);
  }

  function stopEdit() {
    setEditingId(null);
    setEditingParts([]);
    setNewPartTitle("");
    setNewPartFile(null);
    setPartError("");
    setPartSuccess("");
  }

  async function saveEdit(id) {
    const { error } = await supabase.from("videos").update(draft).eq("id", id);
    if (!error) {
      stopEdit();
      fetchVideos();
    }
  }

  async function uploadPart(videoId) {
    setPartError("");
    setPartSuccess("");

    if (!newPartTitle.trim() || !newPartFile) {
      setPartError("Part title and video file are required.");
      return;
    }
    if (!newPartFile.type?.startsWith("video/")) {
      setPartError("Please choose a valid video file.");
      return;
    }

    setPartBusy(true);
    try {
      const fileExt = newPartFile.name.split(".").pop()?.toLowerCase() || "mp4";
      const baseName = newPartTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const storagePath = normalizeStoragePath(`${videoId}/${Date.now()}-${baseName}.${fileExt}`);
      const nextPosition =
        editingParts.reduce((max, part) => Math.max(max, Number(part.position) || 0), 0) + 1;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(storagePath, newPartFile, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("video_parts").insert({
        video_id: videoId,
        title: newPartTitle.trim(),
        storage_path: storagePath,
        position: nextPosition,
      });
      if (insertError) throw insertError;

      setNewPartTitle("");
      setNewPartFile(null);
      setPartSuccess("New lesson part uploaded.");
      fetchVideoParts(videoId);
    } catch (error) {
      setPartError(error?.message || "Failed to upload lesson part.");
    } finally {
      setPartBusy(false);
    }
  }

  async function deletePart(videoId, part) {
    const confirmed = await showConfirm("Delete this lesson part?");
    if (!confirmed) return;

    setPartBusy(true);
    setPartError("");
    setPartSuccess("");

    try {
      await supabase.from("quizzes").delete().eq("video_part_id", part.id);

      const { error: partDeleteError } = await supabase.from("video_parts").delete().eq("id", part.id);
      if (partDeleteError) throw partDeleteError;

      if (part.storage_path) {
        await supabase.storage.from("videos").remove([normalizeStoragePath(part.storage_path)]);
      }

      setEditingParts((prev) => prev.filter((row) => row.id !== part.id));
      setPartSuccess("Lesson part deleted.");
      fetchVideoParts(videoId);
    } catch (error) {
      setPartError(error?.message || "Failed to delete lesson part.");
    } finally {
      setPartBusy(false);
    }
  }

  async function deleteVideo(id, thumbnailPath) {
    const confirmed = await showConfirm("Delete this video and all related lessons?");
    if (!confirmed) return;

    const { data: parts } = await supabase
      .from("video_parts")
      .select("id, storage_path")
      .eq("video_id", id);

    const lessonIds = (parts || []).map((p) => p.id);
    const lessonPaths = (parts || []).map((p) => normalizeStoragePath(p.storage_path)).filter(Boolean);

    if (lessonIds.length) {
      await supabase.from("quizzes").delete().in("video_part_id", lessonIds);
      await supabase.from("video_parts").delete().eq("video_id", id);
    }
    if (lessonPaths.length) {
      await supabase.storage.from("videos").remove(lessonPaths);
    }
    if (thumbnailPath && !String(thumbnailPath).startsWith("http")) {
      await supabase.storage.from("thumbnails").remove([thumbnailPath]);
    }

    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (!error) setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  const processedVideos = [...videos]
    .filter((video) => {
      const subject = subjectsById[String(video.subject_id)] || {};
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      return (
        (video.title || "").toLowerCase().includes(term) ||
        (subject.name || "").toLowerCase().includes(term) ||
        (subject.form || "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const aSubject = subjectsById[String(a.subject_id)] || {};
      const bSubject = subjectsById[String(b.subject_id)] || {};

      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === "title_asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "title_desc") {
        return (b.title || "").localeCompare(a.title || "");
      }
      if (sortBy === "class_asc") {
        return (aSubject.form || "").localeCompare(bSubject.form || "");
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className={`text-3xl font-black mb-6 ${darkMode ? "text-white" : "text-slate-900"}`}>
        Manage Uploaded Videos
      </h1>

      <div className="mb-4 grid md:grid-cols-2 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, subject, or class..."
          className={`w-full rounded-xl px-4 py-3 border ${
            darkMode
              ? "bg-slate-900 border-slate-700 text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`w-full rounded-xl px-4 py-3 border ${
            darkMode
              ? "bg-slate-900 border-slate-700 text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="title_asc">Sort: Title (A-Z)</option>
          <option value="title_desc">Sort: Title (Z-A)</option>
          <option value="class_asc">Sort: Class (A-Z)</option>
        </select>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
        {loading ? (
          <div className={`p-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Loading videos...</div>
        ) : processedVideos.length === 0 ? (
          <div className={`p-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>No uploaded videos yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-50 text-slate-700"}>
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Class</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedVideos.map((video) => (
                  <tr key={video.id} className={darkMode ? "border-t border-slate-700" : "border-t border-slate-100"}>
                    <td className="p-3 min-w-[360px] align-top">
                      {editingId === video.id ? (
                        <div className="space-y-3">
                          <input
                            value={draft.title}
                            onChange={(e) => setDraft({ title: e.target.value })}
                            className={`w-full rounded-lg px-3 py-2 border ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"
                            }`}
                          />

                          <div className={`rounded-xl border p-3 ${darkMode ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"}`}>
                            <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                              Lesson Parts
                            </p>

                            {partError ? <p className="text-xs mb-2 text-rose-500">{partError}</p> : null}
                            {partSuccess ? <p className="text-xs mb-2 text-emerald-500">{partSuccess}</p> : null}

                            {partsLoading ? (
                              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading parts...</p>
                            ) : editingParts.length === 0 ? (
                              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No lesson parts yet.</p>
                            ) : (
                              <div className="space-y-2 mb-3">
                                {editingParts.map((part) => (
                                  <div
                                    key={part.id}
                                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${
                                      darkMode ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"
                                    }`}
                                  >
                                    <span className={`text-xs ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                      {(part.position || 0) > 0 ? `${part.position}. ` : ""}
                                      {part.title || "Untitled part"}
                                    </span>
                                    <button
                                      onClick={() => deletePart(video.id, part)}
                                      disabled={partBusy}
                                      className="p-1 rounded bg-rose-600 text-white disabled:opacity-50"
                                      title="Delete part"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid gap-2">
                              <input
                                type="text"
                                value={newPartTitle}
                                onChange={(e) => setNewPartTitle(e.target.value)}
                                placeholder="New part title"
                                className={`w-full rounded-lg px-3 py-2 text-xs border ${
                                  darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"
                                }`}
                              />
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setNewPartFile(e.target.files?.[0] || null)}
                                className={`w-full text-xs ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                              />
                              <button
                                onClick={() => uploadPart(video.id)}
                                disabled={partBusy}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                              >
                                {partBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                                Upload New Part
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        video.title
                      )}
                    </td>
                    <td className="p-3">{subjectsById[String(video.subject_id)]?.name || video.subject_id || "-"}</td>
                    <td className="p-3">{subjectsById[String(video.subject_id)]?.form || "-"}</td>
                    <td className="p-3">{video.created_at ? new Date(video.created_at).toLocaleDateString() : "-"}</td>
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-2">
                        {editingId === video.id ? (
                          <>
                            <button onClick={() => saveEdit(video.id)} className="p-2 rounded-lg bg-emerald-600 text-white">
                              <Save size={16} />
                            </button>
                            <button onClick={stopEdit} className="p-2 rounded-lg bg-slate-500 text-white">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(video)} className="p-2 rounded-lg bg-indigo-600 text-white">
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteVideo(video.id, video.thumbnail_url)}
                          className="p-2 rounded-lg bg-rose-600 text-white"
                        >
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
