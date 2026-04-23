// src/components/ManageCourses.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Search, Trash2, Edit2, Play } from "lucide-react";

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [subjectsById, setSubjectsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from("subjects").select("id, name");
    if (error) {
      console.error("Error fetching subjects:", error.message);
      return;
    }

    const map = {};
    (data || []).forEach((subject) => {
      map[String(subject.id)] = subject.name;
    });
    setSubjectsById(map);
  };

  // Fetch uploaded courses (videos table)
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, subject_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
      setTotalCourses((data || []).length);
    } catch (err) {
      console.error("Error fetching uploaded videos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const subjectName = subjectsById[String(course.subject_id)] || String(course.subject_id || "");
    const haystack = `${course.title || ""} ${subjectName}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  // Real-time subscription (Supabase v2 syntax)
  useEffect(() => {
    fetchSubjects();
    fetchCourses();

    const channel = supabase
      .channel("videos-changes-manage-courses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "videos" },
        () => {
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Delete uploaded video + linked records
  const handleDelete = async (id) => {
    try {
      const { data: parts } = await supabase
        .from("video_parts")
        .select("id, storage_path")
        .eq("video_id", id);

      const lessonIds = (parts || []).map((p) => p.id);
      const lessonPaths = (parts || []).map((p) => p.storage_path).filter(Boolean);

      if (lessonIds.length) {
        await supabase.from("quizzes").delete().in("video_part_id", lessonIds);
        await supabase.from("video_parts").delete().eq("video_id", id);
      }

      if (lessonPaths.length) {
        await supabase.storage.from("videos").remove(lessonPaths);
      }

      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
      fetchCourses();
    } catch (err) {
      console.error("Error deleting uploaded video:", err.message);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Courses</h1>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
          {totalCourses} Total Courses
        </span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <Search className="text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search courses..."
          className="border rounded px-3 py-1 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <p className="p-4">Loading...</p>
        ) : filteredCourses.length === 0 ? (
          <p className="p-4 text-gray-500">No courses found.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id} className="border-t">
                  <td className="p-3">{course.title}</td>
                  <td className="p-3">
                    {subjectsById[String(course.subject_id)] || course.subject_id || "-"}
                  </td>
                  <td className="p-3">
                    {course.created_at ? new Date(course.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-3 flex gap-3">
                    <button className="text-green-600 hover:text-green-800">
                      <Play size={18} />
                    </button>
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
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
