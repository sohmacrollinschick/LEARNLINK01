import React, { useEffect, useState } from "react";
import { usePopup } from "./PopupProvider";
import {
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  GraduationCap,
} from "lucide-react";
import supabase from "../supabaseClient"; 

function ManageStudents() {
  const { showConfirm } = usePopup();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ========================================
  // FETCH STUDENTS FROM SUPABASE
  // ========================================
  const fetchStudents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (!error) {
      setStudents(data);
      setFiltered(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ========================================
  // SEARCH FUNCTION
  // ========================================
  const handleSearch = (value) => {
    setSearchTerm(value);

    const lower = value.toLowerCase();

    setFiltered(
      students.filter((student) => {
        return (
          student.full_name?.toLowerCase().includes(lower) ||
          student.email?.toLowerCase().includes(lower) ||
          student.class_name?.toLowerCase().includes(lower) ||
          student.phone?.toLowerCase().includes(lower)
        );
      })
    );
  };

  // ========================================
  // DELETE STUDENT
  // ========================================
  const deleteStudent = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to remove this student?");
    if (!confirmed) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setFiltered((prev) => prev.filter((s) => s.id !== id));
      alert("Student deleted successfully.");
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Manage Students
        </h1>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
          text-white rounded-lg shadow"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search students by name, email, class, or phone..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg 
            text-slate-700 dark:text-white outline-none"
          />
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 
          rounded-lg text-slate-800 dark:text-white"
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-slate-500 dark:text-slate-400">
            Loading students...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-slate-500 dark:text-slate-400">
            No students found.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-sm text-slate-600 dark:text-slate-300 border-b">
                <th className="py-3 text-left">Name</th>
                <th className="text-left">Email</th>
                <th className="text-left">Class</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Date Joined</th>
                <th className="text-right"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className="border-b hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <td className="py-3">{student.full_name}</td>
                  <td>{student.email}</td>
                  <td>{student.class_name || "—"}</td>
                  <td>{student.phone || "—"}</td>
                  <td>{new Date(student.created_at).toLocaleDateString()}</td>

                  {/* ACTIONS */}
                  <td className="text-right relative">
                    <button
                      onClick={() =>
                        setSelectedStudent(
                          selectedStudent === student.id ? null : student.id
                        )
                      }
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown */}
                    {selectedStudent === student.id && (
                      <div
                        className="absolute right-0 mt-2 bg-white dark:bg-slate-700 shadow-lg 
                      rounded-lg w-36 overflow-hidden z-20"
                      >
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600"
                        >
                          <Eye size={16} /> View
                        </Link>

                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-left"
                        >
                          <Edit size={16} /> Edit
                        </button>

                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-red-500 
                          hover:bg-red-100 dark:hover:bg-red-600 dark:hover:text-white text-left"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManageStudents;
