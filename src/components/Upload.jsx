import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { usePopup } from "./PopupProvider";

const CLASSES = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

const SUBJECTS_BY_FORM = {
  "Form 1": ["Biology", "Mathematics", "English", "Geography", "History"],
  "Form 2": ["Biology", "Mathematics", "English", "Geography", "History"],
  "Form 3": ["Biology", "Mathematics", "English", "Geography", "History"],
  "Form 4": ["Biology", "Mathematics", "Physics", "Chemistry"],
  "Form 5": ["Biology", "Mathematics", "Physics", "Chemistry"]
};

export default function AdminUploadPage() {
  const { showConfirm } = usePopup();
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [status, setStatus] = useState("draft");

  const [videoId, setVideoId] = useState(null);

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonFile, setNewLessonFile] = useState(null);

  const [loading, setLoading] = useState(false);

  /* ================= LOAD SUBJECTS ================= */
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }

    // 1️⃣ Try backend first
    supabase
      .from("subjects")
      .select("id, name")
      .eq("form", selectedClass)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSubjects(data);
        } else {
          // 2️⃣ Fallback to frontend subjects
          const fallback = SUBJECTS_BY_FORM[selectedClass].map(name => ({
            id: name,
            name
          }));
          setSubjects(fallback);
        }
      });
  }, [selectedClass]);

  /* ================= LOAD COURSES ================= */
  useEffect(() => {
    if (!selectedSubject) return;

    supabase
      .from("videos")
      .select("*")
      .eq("subject_id", selectedSubject)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCourses(data || []));
  }, [selectedSubject]);

  /* ================= LOAD LESSONS ================= */
  useEffect(() => {
    if (!videoId) return;

    supabase
      .from("video_parts")
      .select("*")
      .eq("video_id", videoId)
      .order("position")
      .then(({ data }) => setLessons(data || []));
  }, [videoId]);

  /* ================= PREPARE COURSE ================= */
  const prepareCourse = async () => {
    if (!selectedSubject) return alert("Select subject");

    if (selectedCourseId) {
      setVideoId(selectedCourseId);
      return;
    }

    if (!courseTitle) return alert("Enter course title");

    setLoading(true);

    let thumbnailPath = null;
    if (thumbnail) {
      thumbnailPath = `thumb-${Date.now()}-${thumbnail.name}`;
      await supabase.storage.from("thumbnails").upload(thumbnailPath, thumbnail);
    }

    const { data, error } = await supabase
      .from("videos")
      .insert({
        title: courseTitle,
        subject_id: selectedSubject,
        thumbnail_url: thumbnailPath,
        status
      })
      .select()
      .single();

    setLoading(false);

    if (error) return alert(error.message);
    setVideoId(data.id);
  };

  /* ================= ADD LESSON ================= */
  const addLesson = async () => {
    if (!newLessonTitle || !newLessonFile) {
      return alert("Lesson title and file required");
    }

    const storagePath = `${videoId}/${Date.now()}-${newLessonFile.name}`;
    await supabase.storage.from("videos").upload(storagePath, newLessonFile);

    await supabase.from("video_parts").insert({
      video_id: videoId,
      title: newLessonTitle,
      storage_path: storagePath,
      position: lessons.length + 1
    });

    setNewLessonTitle("");
    setNewLessonFile(null);

    const { data } = await supabase
      .from("video_parts")
      .select("*")
      .eq("video_id", videoId)
      .order("position");

    setLessons(data || []);
  };

  /* ================= DELETE LESSON ================= */
  const deleteLesson = async (id) => {
    const confirmed = await showConfirm("Delete lesson?");
    if (!confirmed) return;
    await supabase.from("video_parts").delete().eq("id", id);
    setLessons(lessons.filter(l => l.id !== id));
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-black">Upload Lessons</h1>

      {!videoId && (
        <div className="border p-6 rounded-xl space-y-4">
          {/* CLASS */}
          <select
            className="w-full p-3 border rounded"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">Select Class</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* SUBJECT */}
          <select
            className="w-full p-3 border rounded"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* COURSE */}
          {courses.length > 0 && (
            <select
              className="w-full p-3 border rounded"
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              <option value="">Select Existing Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}

          {!selectedCourseId && (
            <>
              <input
                className="w-full p-3 border rounded"
                placeholder="New course title"
                value={courseTitle}
                onChange={e => setCourseTitle(e.target.value)}
              />

              <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0])} />

              <select
                className="w-full p-3 border rounded"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </>
          )}

          <button
            onClick={prepareCourse}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded font-bold"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Continue"}
          </button>
        </div>
      )}

      {videoId && (
        <>
          <h2 className="text-xl font-bold">Lessons</h2>

          {lessons.map(l => (
            <div key={l.id} className="border p-4 rounded flex justify-between">
              <span>{l.title}</span>
              <button onClick={() => deleteLesson(l.id)}>
                <Trash2 className="text-red-500" />
              </button>
            </div>
          ))}

          <div className="border p-4 rounded space-y-3">
            <input
              className="w-full p-2 border rounded"
              placeholder="Lesson title"
              value={newLessonTitle}
              onChange={e => setNewLessonTitle(e.target.value)}
            />
            <input type="file" onChange={e => setNewLessonFile(e.target.files[0])} />
            <button
              onClick={addLesson}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Add Lesson
            </button>
          </div>
        </>
      )}
    </div>
  );
}
