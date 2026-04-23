import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { usePopup } from "./PopupProvider";
import {
  User,
  Flame,
  GaugeCircle,
  Bell,
  Trophy,
  Clock3,
  CalendarClock,
  MessageSquareText,
} from "lucide-react";

export default function ManageCourses({ darkMode }) {
  const { showConfirm } = usePopup();
  const bg = darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const card = darkMode ? "bg-gray-800" : "bg-white";
  const textSubtle = darkMode ? "text-gray-400" : "text-gray-500";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // For add/edit form
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    title: "",
    author: "",
    rating: "",
    price: "",
    videoFile: null,
    video_url: "",
  });
  const [uploading, setUploading] = useState(false);

  // Load courses from Supabase
  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase.from("courses").select("*").order("title");
    if (error) {
      alert("Error loading courses: " + error.message);
      setLoading(false);
      return;
    }
    setCourses(data);
    setLoading(false);
  }

  // Filter courses by title
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle input changes
  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "videoFile") {
      setForm((prev) => ({ ...prev, videoFile: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  // Upload video to Supabase Storage and return public URL
  async function uploadVideo(file) {
    if (!file) return "";

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("course-videos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Video upload failed: " + uploadError.message);
      setUploading(false);
      return "";
    }

    const { data: publicData } = supabase.storage
      .from("course-videos")
      .getPublicUrl(filePath);

    setUploading(false);
    return publicData?.publicUrl || "";
  }

  // Save new or update existing course
  async function onSubmit(e) {
    e.preventDefault();

    if (!form.title || !form.author || !form.price) {
      alert("Please fill in Title, Author, and Price");
      return;
    }

    setUploading(true);
    let videoUrl = form.video_url;

    // If new video file selected, upload it
    if (form.videoFile) {
      const url = await uploadVideo(form.videoFile);
      if (!url) {
        setUploading(false);
        return;
      }
      videoUrl = url;
    }

    try {
      if (editingCourse) {
        // Update
        const { error } = await supabase
          .from("courses")
          .update({
            title: form.title,
            author: form.author,
            rating: form.rating,
            price: form.price,
            video_url: videoUrl,
          })
          .eq("id", editingCourse.id);

        if (error) throw error;

        alert("Course updated!");
      } else {
        // Insert new
        const { error } = await supabase.from("courses").insert([
          {
            title: form.title,
            author: form.author,
            rating: form.rating,
            price: form.price,
            video_url: videoUrl,
          },
        ]);

        if (error) throw error;

        alert("Course added!");
      }

      // Refresh course list and reset form
      await fetchCourses();
      resetForm();
    } catch (error) {
      alert("Failed to save course: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setForm({
      title: "",
      author: "",
      rating: "",
      price: "",
      videoFile: null,
      video_url: "",
    });
    setEditingCourse(null);
  }

  // Edit a course (populate form)
  function editCourse(course) {
    setEditingCourse(course);
    setForm({
      title: course.title,
      author: course.author,
      rating: course.rating,
      price: course.price,
      videoFile: null,
      video_url: course.video_url || "",
    });
  }

  // Delete course
  async function deleteCourse(courseId) {
    const confirmed = await showConfirm("Are you sure you want to delete this course?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
      alert("Course deleted");
      fetchCourses();
    } catch (error) {
      alert("Failed to delete course: " + error.message);
    }
  }

  return (
    <div className={`p-6 min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-6 ${bg}`}>
      {/* === LEFT SIDE: Courses List and Form === */}
      <div className="col-span-2 space-y-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search course by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />

        {/* Courses List */}
        <section>
          <h2 className="text-xl font-bold mb-4">
            {editingCourse ? "Edit Course" : "Available Courses"} ({filteredCourses.length})
          </h2>

          {loading ? (
            <p>Loading courses...</p>
          ) : filteredCourses.length === 0 ? (
            <p className="text-sm italic text-red-400">No courses found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className={`rounded-lg overflow-hidden shadow ${card}`}>
                  {course.video_url && (
                    <video src={course.video_url} className="w-full h-40 object-cover" controls />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className={`${textSubtle} text-sm`}>{course.author}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>⭐ {course.rating || "N/A"}</span>
                      <span>{course.price}</span>
                    </div>
                    <div className="flex justify-end mt-3 space-x-2">
                      <button
                        onClick={() => editCourse(course)}
                        className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add/Edit Form */}
        <section className={`p-4 rounded-lg shadow ${card}`}>
          <h2 className="text-xl font-bold mb-4">{editingCourse ? "Edit Course" : "Add New Course"}</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label>
                Title*:
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Author*:
                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Rating:
                <input
                  type="text"
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  placeholder="e.g. 4.7 (32)"
                  className="w-full p-2 border rounded"
                />
              </label>
            </div>
            <div>
              <label>
                Price*:
                <input
                  type="text"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Video File (upload to storage):
                <input type="file" name="videoFile" onChange={handleChange} accept="video/*" />
              </label>
              {uploading && <p>Uploading video...</p>}
              {!uploading && form.video_url && (
                <video
                  src={form.video_url}
                  controls
                  className="mt-2 w-full h-40 object-cover rounded"
                />
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                {editingCourse ? "Update Course" : "Add Course"}
              </button>
              {editingCourse && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* === RIGHT SIDE: Stats & Profile === */}
      <aside className="space-y-6">
        {/* Profile */}
        <div className={`p-4 rounded-xl shadow ${card}`}>
          <div className="flex items-center space-x-4">
            <User className="w-10 h-10 text-orange-500" />
            <div>
              <h3 className="font-semibold text-lg">Admin</h3>
              <p className={`${textSubtle} text-sm`}>Manage Courses</p>
            </div>
          </div>
        </div>

        {/* Daily Streak */}
        <div className={`p-4 rounded-xl shadow ${card} flex items-center justify-between`}>
          <div>
            <h4 className="font-semibold">Daily Streak</h4>
            <p className={`${textSubtle} text-sm`}>Keep the streak alive!</p>
          </div>
          <Flame className="w-8 h-8 text-orange-500" />
        </div>

        {/* Stats */}
        <div className={`p-4 rounded-xl shadow ${card} space-y-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h5 className="font-semibold">Learning Hours</h5>
              <p className={`${textSubtle} text-sm`}>15 this week</p>
            </div>
            <Clock3 className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h5 className="font-semibold">Achievements</h5>
              <p className={`${textSubtle} text-sm`}>3 unlocked</p>
            </div>
            <Trophy className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h5 className="font-semibold">Engagement</h5>
              <p className={`${textSubtle} text-sm`}>80%</p>
            </div>
            <GaugeCircle className="w-6 h-6 text-orange-500" />
          </div>
        </div>

        {/* Notifications */}
        <div className={`p-4 rounded-xl shadow ${card} flex items-center justify-between`}>
          <div>
            <h4 className="font-semibold">Notifications</h4>
            <p className={`${textSubtle} text-sm`}>2 new alerts</p>
          </div>
          <Bell className="w-6 h-6 text-orange-500" />
        </div>

        {/* Additional Widgets */}
        <div className={`p-4 rounded-xl shadow ${card} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Upcoming Exams</h4>
            <CalendarClock className="w-6 h-6 text-orange-500" />
          </div>
          <p className={`${textSubtle} text-sm`}>Maths - July 25</p>
          <p className={`${textSubtle} text-sm`}>Physics - July 28</p>
        </div>

        <div className={`p-4 rounded-xl shadow ${card} flex items-center justify-between`}>
          <div>
            <h4 className="font-semibold">Messages</h4>
            <p className={`${textSubtle} text-sm`}>5 unread</p>
          </div>
          <MessageSquareText className="w-6 h-6 text-orange-500" />
        </div>
      </aside>
    </div>
  );
}
