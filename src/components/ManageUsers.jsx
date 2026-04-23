import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { ArrowUpDown, Search, Trash2 } from "lucide-react";
import { usePopup } from "./PopupProvider";

export default function ManageUsers({ darkMode }) {
  const { showConfirm } = usePopup();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState({ column: "created_at", ascending: false });
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [sortBy]);

  function normalizeUser(row) {
    return {
      ...row,
      id: row.id,
      full_name: row.full_name || row.name || "",
      email: row.email || "",
      role: row.role || "student",
      source_table: "profiles",
      has_profile: true,
    };
  }

  async function fetchUsers() {
    setLoading(true);

    const { data: profilesData, error: profilesError } = await supabase.rpc("admin_list_profiles");

    if (profilesError) {
      showToast("Error fetching users from profiles.");
      setUsers([]);
      setLoading(false);
      return;
    }

    const merged = (profilesData || []).map((row) => normalizeUser(row)).sort((a, b) => {
      if (sortBy.column === "full_name") {
        const aName = (a.full_name || "").toLowerCase();
        const bName = (b.full_name || "").toLowerCase();
        if (aName < bName) return sortBy.ascending ? -1 : 1;
        if (aName > bName) return sortBy.ascending ? 1 : -1;
        return 0;
      }

      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortBy.ascending ? aDate - bDate : bDate - aDate;
    });

    setUsers(merged);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = users;

    if (roleFilter !== "all") {
      result = result.filter((u) => (u.role || "student") === roleFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (u) =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          String(u.id || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, roleFilter, query]);

  async function updateUserRole(row, role) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser?.id === row.id && role === "archived") {
      return showToast("You cannot archive yourself.");
    }

    const { error } = await supabase.from("profiles").update({ role }).eq("id", row.id);
    if (error) return showToast("Role update failed.");

    showToast("Role updated.");
    fetchUsers();
  }

  async function deleteProfile(row) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser?.id === row.id) {
      return showToast("You cannot delete your own profile.");
    }

    const role = String(row.role || "").toLowerCase();
    const isLinkedRole = role === "student" || role === "parent";
    const confirmed = await showConfirm(
      isLinkedRole
        ? "Delete this account and the linked parent/student account together?"
        : "Delete this admin account?"
    );
    if (!confirmed) return;

    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { targetUserId: row.id },
    });

    if (error) {
      let message = error.message || "Delete failed.";
      const context = error.context;
      if (context && typeof context.text === "function") {
        try {
          const raw = await context.text();
          if (raw) {
            try {
              const details = JSON.parse(raw);
              message = details?.error || message;
            } catch {
              message = raw.slice(0, 300);
            }
          }
        } catch {
          // Keep fallback message if function response body is unreadable.
        }
      }
      return showToast(message);
    }

    const deletedCount = Array.isArray(data?.deletedIds) ? data.deletedIds.length : 0;
    if (deletedCount > 1) {
      showToast("Linked parent and student accounts deleted.");
    } else {
      showToast("User account deleted.");
    }
    fetchUsers();
  }

  async function archiveSelected() {
    if (selected.size === 0) return showToast("No users selected.");

    const selectedRows = filtered.filter((u) => selected.has(u.id));
    const ids = selectedRows.map((u) => u.id);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (ids.includes(currentUser?.id)) {
      return showToast("You cannot archive yourself.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role: "archived" })
      .in("id", ids);

    if (error) return showToast("Archive failed.");

    showToast("Selected users archived.");
    setSelected(new Set());
    fetchUsers();
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
        User Management
      </h2>

      <div className="flex flex-wrap gap-4 items-center">
        <div
          className={`flex items-center rounded-xl p-2 border ${
            darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <Search size={18} />
          <input
            placeholder="Search name, email or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none ml-2 w-64"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`border rounded-xl px-3 py-2 ${
            darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="archived">Archived</option>
        </select>

        <button onClick={archiveSelected} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">
          Archive Selected
        </button>
      </div>

      <div
        className={`rounded-2xl border shadow-sm overflow-x-auto ${
          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <table className="w-full table-auto">
          <thead>
            <tr
              className={`border-b text-left ${
                darkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <th className="p-3"></th>
              <th
                className="p-3 cursor-pointer"
                onClick={() =>
                  setSortBy((s) => ({
                    column: "full_name",
                    ascending: s.column === "full_name" ? !s.ascending : true,
                  }))
                }
              >
                Name <ArrowUpDown size={14} className="inline" />
              </th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th
                className="p-3 cursor-pointer"
                onClick={() =>
                  setSortBy((s) => ({
                    column: "created_at",
                    ascending: s.column === "created_at" ? !s.ascending : true,
                  }))
                }
              >
                Joined <ArrowUpDown size={14} className="inline" />
              </th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={`p-6 text-center ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className={`p-6 text-center ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className={`border-t ${
                    darkMode ? "border-slate-700 hover:bg-slate-800 text-slate-200" : "border-slate-100 hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td className="p-3 font-medium">{u.full_name || "-"}</td>
                  <td className="p-3">{u.email || "-"}</td>
                  <td className="p-3 capitalize">{u.role || "student"}</td>
                  <td className="p-3">{u.created_at ? new Date(u.created_at).toLocaleString() : "-"}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => deleteProfile(u)}
                        className="bg-rose-600 text-white px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2 rounded-xl shadow-lg border border-slate-700">
          {toast}
        </div>
      )}
    </div>
  );
}


