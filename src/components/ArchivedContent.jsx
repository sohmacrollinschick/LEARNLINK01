import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from "../supabaseClient";
import { offlineManager } from "../offlineStore";
import { useUser } from "./Usercontext";
import { usePopup } from "./PopupProvider";
import { 
  Archive, 
  Search, 
  BookOpen, 
  RotateCcw, 
  Trash2, 
  FileText,
  Clock,
  ChevronRight
} from 'lucide-react';

const ArchivedContent = () => {
  const { user } = useUser();
  const { showConfirm } = usePopup();
  const [searchQuery, setSearchQuery] = useState("");
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTone, setErrorTone] = useState("error");
  const [supportsArchiveColumns, setSupportsArchiveColumns] = useState(true);
  const [archiveBackend, setArchiveBackend] = useState("offline_downloads");

  const inferType = (title = "") => {
    const normalized = title.toLowerCase();
    if (normalized.includes("paper")) return "GCE Paper";
    if (normalized.includes("note")) return "Notes";
    return "Course";
  };

  const getIcon = (title = "") => {
    const normalized = title.toLowerCase();
    if (normalized.includes("paper") || normalized.includes("note")) {
      return <FileText className="text-emerald-500" />;
    }
    return <BookOpen className="text-blue-500" />;
  };

  const formatArchivedDate = (row) => {
    const raw = row.archived_at || row.downloaded_at;
    if (!raw) return "Archived recently";
    const d = new Date(raw);
    return `Archived on ${d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}`;
  };

  const normalizeRows = (rows = [], cloudTable = "offline_downloads") =>
    rows.map((row) => ({
      id: `cloud-${cloudTable}-${row.id}`,
      recordId: row.id,
      lessonId: row.lesson_id,
      title: row.title || row.item_title || row.name || "Untitled lesson",
      type: row.type || row.item_type || inferType(row.title || row.item_title || row.name),
      subject: row.subject || row.category || "",
      date: formatArchivedDate(row),
      icon: getIcon(row.title || row.item_title || row.name),
      source: "cloud",
      cloudTable,
      raw: row,
    }));

  const normalizeLocalRows = (docs = [], videos = []) => {
    const normalizedDocs = docs.map((row) => ({
      id: `local-doc-${row.localId}`,
      recordId: row.localId,
      lessonId: row.lessonId ?? null,
      title: row.title || "Offline note",
      type: "Notes",
      subject: row.subject || "",
      date: row.savedAt
        ? `Saved on ${new Date(row.savedAt).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}`
        : "Saved offline",
      icon: <FileText className="text-emerald-500" />,
      source: "local",
      localStore: "offline_docs",
      blob: row.blob ?? null,
    }));

    const normalizedVideos = videos.map((row) => ({
      id: `local-video-${row.localId}`,
      recordId: row.localId,
      lessonId: row.lessonId ?? null,
      title: row.title || "Offline lesson",
      type: "Course",
      subject: row.subject || "",
      date: row.savedAt
        ? `Saved on ${new Date(row.savedAt).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}`
        : "Saved offline",
      icon: <BookOpen className="text-blue-500" />,
      source: "local",
      localStore: "offline_videos",
      blob: row.blob ?? null,
    }));

    return [...normalizedDocs, ...normalizedVideos];
  };

  const loadLocalFallback = async () => {
    const [docs, videos] = await Promise.all([
      offlineManager.getAll("offline_docs", user?.id ?? null),
      offlineManager.getAll("offline_videos", user?.id ?? null),
    ]);
    return normalizeLocalRows(docs || [], videos || []);
  };

  const loadArchivedItems = async () => {
    if (!user?.id) return;
    setLoading(true);
    setErrorMessage("");
    setErrorTone("error");

    // Preferred backend source
    const userArchivesResult = await supabase
      .from("user_archives")
      .select("*")
      .eq("user_id", user.id)
      .order("archived_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (!userArchivesResult.error) {
      const archiveRows = (userArchivesResult.data || []).filter((row) => {
        if ("archived" in row) return row.archived === true;
        if ("is_archived" in row) return row.is_archived === true;
        if ("status" in row) return String(row.status).toLowerCase() === "archived";
        return true;
      });

      setArchiveBackend("user_archives");
      setSupportsArchiveColumns(true);
      setArchivedItems(normalizeRows(archiveRows, "user_archives"));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("offline_downloads")
      .select("id, lesson_id, title, subject, downloaded_at, archived, archived_at")
      .eq("user_id", user.id)
      .eq("archived", true)
      .order("archived_at", { ascending: false })
      .order("downloaded_at", { ascending: false });

    if (!error) {
      setArchiveBackend("offline_downloads");
      setSupportsArchiveColumns(true);
      setArchivedItems(normalizeRows(data || [], "offline_downloads"));
      setLoading(false);
      return;
    }

    const columnMissing = error.message?.toLowerCase().includes("archived");
    if (!columnMissing) {
      const localOnly = await loadLocalFallback();
      if (localOnly.length > 0) {
        setSupportsArchiveColumns(false);
        setArchivedItems(localOnly);
        setErrorMessage("Cloud archive unavailable. Showing local offline archive.");
        setErrorTone("info");
      } else {
        setErrorMessage("Could not load archived items. Please refresh.");
        setErrorTone("error");
      }
      setLoading(false);
      return;
    }

    const fallback = await supabase
      .from("offline_downloads")
      .select("id, lesson_id, title, subject, downloaded_at")
      .eq("user_id", user.id)
      .order("downloaded_at", { ascending: false });

    if (fallback.error) {
      const localOnly = await loadLocalFallback();
      if (localOnly.length > 0) {
        setSupportsArchiveColumns(false);
        setArchivedItems(localOnly);
        setErrorMessage("Cloud archive unavailable. Showing local offline archive.");
        setErrorTone("info");
      } else {
        setErrorMessage("Could not load archived items. Please refresh.");
        setErrorTone("error");
      }
      setLoading(false);
      return;
    }

    setSupportsArchiveColumns(false);
    setArchiveBackend("offline_downloads");
    setArchivedItems(normalizeRows(fallback.data || [], "offline_downloads"));
    setLoading(false);
  };

  useEffect(() => {
    loadArchivedItems();
  }, [user?.id]);

  const filteredItems = useMemo(() => archivedItems.filter((item) =>
    `${item.title} ${item.subject}`.toLowerCase().includes(searchQuery.toLowerCase())
  ), [archivedItems, searchQuery]);

  const restoreItem = async (id) => {
    const item = archivedItems.find((row) => row.id === id);
    if (item?.source === "local") {
      alert("Local offline files can be removed, but not restored to cloud archive.");
      return;
    }

    if (!supportsArchiveColumns) {
      alert("Database archive columns are missing. Run your latest migration to enable restore.");
      return;
    }

    setBusyId(id);
    let error = null;
    if (item.cloudTable === "user_archives") {
      const updates = {};
      if ("archived" in (item.raw || {})) updates.archived = false;
      if ("is_archived" in (item.raw || {})) updates.is_archived = false;
      if ("status" in (item.raw || {})) updates.status = "active";
      if ("archived_at" in (item.raw || {})) updates.archived_at = null;

      if (Object.keys(updates).length === 0) {
        setArchivedItems((prev) => prev.filter((row) => row.id !== id));
        setBusyId(null);
        return;
      }

      const result = await supabase.from("user_archives").update(updates).eq("id", item.recordId);
      error = result.error;
    } else {
      const result = await supabase
        .from("offline_downloads")
        .update({ archived: false, archived_at: null })
        .eq("id", item.recordId);
      error = result.error;
    }

    if (error) {
      alert("Could not restore this item.");
    } else {
      setArchivedItems((prev) => prev.filter((item) => item.id !== id));
    }
    setBusyId(null);
  };

  const deleteItem = async (id) => {
    const shouldDelete = await showConfirm("Delete this archived item permanently?");
    if (!shouldDelete) return;

    const item = archivedItems.find((row) => row.id === id);
    if (!item) return;

    setBusyId(id);
    if (item.source === "local" && item.localStore) {
      await offlineManager.deleteItem(item.localStore, item.recordId);
      setArchivedItems((prev) => prev.filter((row) => row.id !== id));
      setBusyId(null);
      return;
    }

    const tableName = item.cloudTable || archiveBackend || "offline_downloads";
    const { error } = await supabase.from(tableName).delete().eq("id", item.recordId);

    if (error) {
      alert("Could not delete this item from cloud archive.");
    } else {
      setArchivedItems((prev) => prev.filter((row) => row.id !== id));
    }
    setBusyId(null);
  };

  const viewItem = (item) => {
    if (item.source === "local" && item.blob) {
      const objectUrl = URL.createObjectURL(item.blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      return;
    }
    alert("This item is tracked in archive history. Open it from the original module.");
  };

  if (!user?.id) {
    return (
      <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Please sign in to view archived content.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading archived content...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <Archive className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Archived Content
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Review your completed courses and saved resources from previous terms.
        </p>
      </div>

      {errorMessage && (
        <div
          className={`mb-4 text-sm font-semibold rounded-xl px-4 py-3 border ${
            errorTone === "info"
              ? "text-blue-700 bg-blue-50 border-blue-100"
              : "text-red-600 bg-red-50 border-red-100"
          }`}
        >
          {errorMessage}
        </div>
      )}

      {!supportsArchiveColumns && (
        <div className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Archive columns are not present yet in your database. Showing downloaded history as fallback.
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search your archive..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex gap-2">
                <button
                  title="Restore to Dashboard"
                  onClick={() => restoreItem(item.id)}
                  disabled={busyId === item.id}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  title="Delete Permanently"
                  onClick={() => deleteItem(item.id)}
                  disabled={busyId === item.id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                {item.type}
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">
                {item.title}
              </h3>
              {item.subject && (
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.subject}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={14} />
                <span className="text-[11px] font-bold">{item.date}</span>
              </div>
              <button
                onClick={() => viewItem(item)}
                className="flex items-center gap-1 text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 hover:gap-2 transition-all"
              >
                View <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No archived items found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedContent;
