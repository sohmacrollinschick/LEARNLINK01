import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, RefreshCcw } from "lucide-react";
import { supabase } from "../supabaseClient";
import { usePopup } from "./PopupProvider";

const ITEMS_PER_PAGE = 8;

const inferType = (row) => {
  if (row?.type) return row.type;
  if (row?.item_type) return row.item_type;
  const title = String(row?.title || row?.item_title || row?.name || "").toLowerCase();
  if (title.includes("paper")) return "GCE Paper";
  if (title.includes("note")) return "Notes";
  return "Course";
};

const normalizeRows = (rows = [], table) =>
  rows.map((row) => {
    const title = row.title || row.item_title || row.name || "Untitled item";
    const archivedAt = row.archived_at || row.downloaded_at || row.created_at || null;
    const userId = row.user_id || row.owner_id || row.profile_id || "";

    return {
      id: `${table}-${row.id}`,
      recordId: row.id,
      table,
      raw: row,
      title,
      type: inferType(row),
      subject: row.subject || row.category || "",
      userId,
      dateArchived: archivedAt
        ? new Date(archivedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
        : "Unknown",
    };
  });

export default function AdminArchived({ darkMode }) {
  const { showConfirm } = usePopup();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const fetchArchived = async () => {
    setLoading(true);
    setError("");

    const userArchives = await supabase
      .from("user_archives")
      .select("*")
      .order("archived_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (!userArchives.error) {
      const rows = (userArchives.data || []).filter((row) => {
        if ("archived" in row) return row.archived === true;
        if ("is_archived" in row) return row.is_archived === true;
        if ("status" in row) return String(row.status).toLowerCase() === "archived";
        return true;
      });
      setItems(normalizeRows(rows, "user_archives"));
      setLoading(false);
      return;
    }

    const offlineDownloads = await supabase
      .from("offline_downloads")
      .select("id, user_id, lesson_id, title, subject, downloaded_at, archived, archived_at")
      .eq("archived", true)
      .order("archived_at", { ascending: false })
      .order("downloaded_at", { ascending: false });

    if (!offlineDownloads.error) {
      setItems(normalizeRows(offlineDownloads.data || [], "offline_downloads"));
      setLoading(false);
      return;
    }

    setError("Could not load archive from backend tables (user_archives / offline_downloads).");
    setItems([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return items;
    return items.filter((item) =>
      `${item.title} ${item.type} ${item.subject} ${item.userId}`.toLowerCase().includes(query)
    );
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  const handleRestore = async (item) => {
    setBusyId(item.id);
    try {
      if (item.table === "user_archives") {
        const updates = {};
        if ("archived" in (item.raw || {})) updates.archived = false;
        if ("is_archived" in (item.raw || {})) updates.is_archived = false;
        if ("status" in (item.raw || {})) updates.status = "active";
        if ("archived_at" in (item.raw || {})) updates.archived_at = null;

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("user_archives")
            .update(updates)
            .eq("id", item.recordId);
          if (updateError) throw updateError;
        }
      } else {
        const { error: updateError } = await supabase
          .from("offline_downloads")
          .update({ archived: false, archived_at: null })
          .eq("id", item.recordId);
        if (updateError) throw updateError;
      }

      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch {
      alert("Could not restore this item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await showConfirm("Are you sure you want to delete permanently?");
    if (!confirmed) return;

    setBusyId(item.id);
    const { error: deleteError } = await supabase.from(item.table).delete().eq("id", item.recordId);
    if (deleteError) {
      alert("Could not delete this archived item.");
    } else {
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    }
    setBusyId(null);
  };

  return (
    <div className={`p-6 min-h-screen rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className={`text-2xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Archived Items</h1>
        <button
          onClick={fetchArchived}
          className={`px-3 py-2 rounded-xl text-sm font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-100">
          {error}
        </div>
      )}

      <div className="flex items-center mb-4 space-x-3">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search archived items..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              darkMode
                ? "border-slate-700 bg-slate-800 text-slate-100"
                : "border-slate-200 bg-slate-50 text-slate-900"
            }`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Search className={`absolute left-3 top-2.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`} size={18} />
        </div>
      </div>

      <div className={`overflow-x-auto rounded-2xl border ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
        <table className="w-full text-left border-collapse">
          <thead className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
            <tr>
              <th className={`p-3 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Title</th>
              <th className={`p-3 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Type</th>
              <th className={`p-3 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Subject</th>
              <th className={`p-3 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>User</th>
              <th className={`p-3 text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Date Archived</th>
              <th className={`p-3 text-sm font-medium text-center ${darkMode ? "text-slate-200" : "text-slate-700"}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className={`p-4 text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Loading archived items...
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="6" className={`p-4 text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  No archived items found.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <td className={`p-3 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{item.title}</td>
                  <td className={`p-3 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{item.type}</td>
                  <td className={`p-3 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{item.subject || "-"}</td>
                  <td className={`p-3 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{item.userId || "-"}</td>
                  <td className={`p-3 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{item.dateArchived}</td>
                  <td className="p-3 flex justify-center space-x-4">
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={busyId === item.id}
                      className="text-green-600 hover:text-green-800 transition disabled:opacity-50"
                      title="Restore"
                      aria-label="Restore item"
                    >
                      <RefreshCcw size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={busyId === item.id}
                      className="text-red-600 hover:text-red-800 transition disabled:opacity-50"
                      title="Delete Permanently"
                      aria-label="Delete item permanently"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center space-x-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className={`px-3 py-1 rounded-xl disabled:opacity-50 ${
            darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-700"
          }`}
        >
          Prev
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-indigo-600 text-white"
                : darkMode
                ? "bg-slate-700 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className={`px-3 py-1 rounded-xl disabled:opacity-50 ${
            darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
