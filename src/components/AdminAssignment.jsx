import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { usePopup } from "./PopupProvider";
import { useUser } from "./Usercontext";

const CLASSES = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];
const SUBJECTS_BY_FORM = {
  "Form 1": ["Biology", "Mathematics", "English", "Geography", "History"],
  "Form 2": ["Biology", "Mathematics", "English", "Geography", "History"],
  "Form 3": ["Biology", "Mathematics", "English", "Geography", "History"],
  "Form 4": ["Biology", "Mathematics", "Physics", "Chemistry"],
  "Form 5": ["Biology", "Mathematics", "Physics", "Chemistry"],
};

export default function AdminUploadPage() {
  const { showConfirm } = usePopup();
  const { user } = useUser();

  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [videoId, setVideoId] = useState(null);

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonFile, setNewLessonFile] = useState(null);
  const [requiresQuiz, setRequiresQuiz] = useState(true);
  const [quizTopic, setQuizTopic] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const lessonFileRef = useRef(null);

  const normalizeStoragePath = (storagePath) => {
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

    path = path.replace(/^\/+/, "");
    return path;
  };

  const canWrite = isAdmin && !loading;
  const selectedSubjectName = useMemo(
    () => subjects.find((s) => String(s.id) === String(selectedSubject))?.name || "",
    [subjects, selectedSubject]
  );
  const currentCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(videoId)) || null,
    [courses, videoId]
  );

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      setInitializing(true);
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!active) return;

      if (!authUser?.id) {
        setIsAdmin(false);
        setErrorMessage("Sign in again. No active authenticated user found.");
        setInitializing(false);
        return;
      }

      const { data: isAdminResult, error: isAdminRpcError } = await supabase.rpc("is_admin", {
        candidate: authUser.id,
      });

      let adminRow = null;
      let error = isAdminRpcError;

      if (!isAdminRpcError && typeof isAdminResult === "boolean") {
        adminRow = isAdminResult ? { id: authUser.id } : null;
        error = null;
      } else {
        const legacy = await supabase
          .from("admins")
          .select("id")
          .eq("id", authUser.id)
          .maybeSingle();
        adminRow = legacy.data;
        error = legacy.error;
      }

      if (!active) return;

      if (error || !adminRow) {
        setIsAdmin(false);
        setErrorMessage(
          "This account is not allowed to upload. Add this user to the admins table, then refresh."
        );
      } else {
        setIsAdmin(true);
        setErrorMessage("");
      }

      setInitializing(false);
    };

    checkAdmin();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const fetchSubjectsForClass = async (className) => {
    if (!className) {
      setSubjects([]);
      return;
    }

    const { data: existing, error } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("form", className)
      .order("name");

    if (!error && existing && existing.length > 0) {
      setSubjects(existing);
      return;
    }

    const fallbackNames = SUBJECTS_BY_FORM[className] || [];
    if (!fallbackNames.length) {
      setSubjects([]);
      return;
    }

    const { data: alreadyThere } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("form", className)
      .in("name", fallbackNames);

    const existingNames = new Set((alreadyThere || []).map((s) => s.name));
    const missingNames = fallbackNames.filter((name) => !existingNames.has(name));

    if (missingNames.length > 0) {
      await supabase.from("subjects").insert(
        missingNames.map((name) => ({
          name,
          form: className,
        }))
      );
    }

    const { data: refreshed } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("form", className)
      .order("name");

    setSubjects(refreshed || []);
  };

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedSubject("");
      setCourses([]);
      setSelectedCourseId("");
      setVideoId(null);
      setLessons([]);
      return;
    }

    setSelectedSubject("");
    setCourses([]);
    setSelectedCourseId("");
    setVideoId(null);
    setLessons([]);
    fetchSubjectsForClass(selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSubject) {
      setCourses([]);
      setSelectedCourseId("");
      setVideoId(null);
      setLessons([]);
      return;
    }

    setSelectedCourseId("");
    setVideoId(null);
    setLessons([]);

    supabase
      .from("videos")
      .select("id, title, created_at")
      .eq("subject_id", selectedSubject)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCourses(data || []));
  }, [selectedSubject]);

  useEffect(() => {
    if (!videoId) {
      setLessons([]);
      return;
    }

    supabase
      .from("video_parts")
      .select("*")
      .eq("video_id", videoId)
      .order("position")
      .then(async ({ data }) => {
        const rows = data || [];
        const normalizedRows = rows.map((row) => ({
          ...row,
          storage_path: normalizeStoragePath(row.storage_path),
        }));

        setLessons(normalizedRows);

        const updates = normalizedRows.filter(
          (row, i) => row.storage_path && row.storage_path !== rows[i]?.storage_path
        );

        if (updates.length > 0) {
          await Promise.all(
            updates.map((row) =>
              supabase.from("video_parts").update({ storage_path: row.storage_path }).eq("id", row.id)
            )
          );
        }
      });
  }, [videoId]);

  const prepareCourse = async () => {
    if (!isAdmin) return;
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedSubject) {
      setErrorMessage("Select a subject first.");
      return;
    }

    if (selectedCourseId) {
      setVideoId(selectedCourseId);
      return;
    }

    if (!courseTitle.trim()) {
      setErrorMessage("Enter a course title.");
      return;
    }

    setLoading(true);
    try {
      let thumbPath = null;
      if (thumbnail) {
        thumbPath = `thumb-${Date.now()}-${thumbnail.name}`;
        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbPath, thumbnail, { cacheControl: "3600", upsert: false });
        if (thumbError) throw thumbError;
      }

      const { data, error } = await supabase
        .from("videos")
        .insert({
          title: courseTitle.trim(),
          subject_id: selectedSubject,
          thumbnail_url: thumbPath,
        })
        .select()
        .single();

      if (error) throw error;

      setVideoId(data.id);
      setSelectedCourseId(String(data.id));
      setSuccessMessage("Course ready. You can now add lessons.");
    } catch (e) {
      setErrorMessage(e?.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  const addQuizBlock = () => {
    setQuizQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const updateQuiz = (qi, field, value) => {
    const copy = [...quizQuestions];
    copy[qi][field] = value;
    setQuizQuestions(copy);
  };

  const updateOption = (qi, oi, value) => {
    const copy = [...quizQuestions];
    copy[qi].options[oi] = value;
    setQuizQuestions(copy);
  };

  const removeQuizBlock = (index) => {
    if (quizQuestions.length === 1) return;
    setQuizQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const generateQuizWithAi = async () => {
    if (!requiresQuiz) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!quizTopic.trim()) {
      setErrorMessage("Enter a topic for AI generation.");
      return;
    }

    if (!newLessonTitle.trim()) {
      setErrorMessage("Enter the lesson title (part) before generating quiz.");
      return;
    }

    setGeneratingQuiz(true);
    try {
      const questionCount = Math.min(Math.max(Number(aiQuestionCount) || 5, 1), 10);
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          topic: quizTopic.trim(),
          part: newLessonTitle.trim(),
          questionCount,
          subject: selectedSubjectName,
          classLevel: selectedClass,
        },
      });

      if (error) {
        let message = error.message || "Failed to call quiz generation function.";
        const context = error.context;
        if (context && typeof context.text === "function") {
          try {
            const raw = await context.text();
            if (raw) {
              try {
                const details = JSON.parse(raw);
                if (details?.error) {
                  message = `${message}: ${details.error}`;
                }
                if (details?.details) {
                  message = `${message} (${details.details})`;
                }
              } catch {
                message = `${message}: ${raw.slice(0, 400)}`;
              }
            }
          } catch {
            // Keep fallback when context body cannot be read.
          }
        }
        throw new Error(message);
      }

      const generatedQuestions = Array.isArray(data?.questions)
        ? data.questions
            .map((q) => ({
              question: String(q?.question || "").trim(),
              options: Array.isArray(q?.options)
                ? q.options.map((o) => String(o || "").trim()).slice(0, 4)
                : [],
              correctIndex: Number.isInteger(q?.correctIndex) ? Number(q.correctIndex) : 0,
            }))
            .filter((q) => q.question && q.options.length === 4)
        : [];

      if (!generatedQuestions.length) {
        setErrorMessage("AI did not return valid questions. Try again with a clearer topic.");
        return;
      }

      setQuizQuestions(generatedQuestions);
      setSuccessMessage(`Generated ${generatedQuestions.length} quiz question(s).`);
    } catch (e) {
      setErrorMessage(e?.message || "Failed to generate quiz with AI.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const addLesson = async () => {
    if (!isAdmin) return;
    setErrorMessage("");
    setSuccessMessage("");

    if (!videoId) {
      setErrorMessage("Course not ready yet.");
      return;
    }
    if (!newLessonTitle.trim() || !newLessonFile) {
      setErrorMessage("Lesson title and video file are required.");
      return;
    }
    if (!newLessonFile.type?.startsWith("video/")) {
      setErrorMessage("Please choose a valid video file.");
      return;
    }
    const shouldAutoGenerateFromVideo = requiresQuiz && Boolean(quizTopic.trim());
    if (requiresQuiz && !shouldAutoGenerateFromVideo) {
      for (const q of quizQuestions) {
        if (!q.question.trim()) {
          setErrorMessage("Fill all quiz questions.");
          return;
        }
        if (q.options.some((o) => !o.trim())) {
          setErrorMessage("Fill all quiz options.");
          return;
        }
      }
    }

    setLoading(true);
    let failedStep = "lesson upload";
    try {
      const fileExt = newLessonFile.name.split(".").pop()?.toLowerCase() || "mp4";
      const baseName = newLessonTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const storagePath = normalizeStoragePath(`${videoId}/${Date.now()}-${baseName}.${fileExt}`);
      const nextPosition =
        lessons.reduce((max, lesson) => Math.max(max, Number(lesson.position) || 0), 0) + 1;

      failedStep = "video file upload";
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(storagePath, newLessonFile, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      failedStep = "lesson row insert";
      const { data: lesson, error: lessonError } = await supabase
        .from("video_parts")
        .insert({
          video_id: videoId,
          title: newLessonTitle.trim(),
          storage_path: storagePath,
          position: nextPosition,
          requires_quiz: requiresQuiz,
        })
        .select()
        .single();
      if (lessonError) throw lessonError;

      if (requiresQuiz) {
        failedStep = "quiz insert";
        let questionsToInsert = quizQuestions;

        if (shouldAutoGenerateFromVideo) {
          const questionCount = Math.min(Math.max(Number(aiQuestionCount) || 5, 1), 10);
          const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-quiz", {
            body: {
              topic: quizTopic.trim(),
              part: newLessonTitle.trim(),
              questionCount,
              subject: selectedSubjectName,
              classLevel: selectedClass,
              videoPartId: lesson.id,
            },
          });

          if (aiError) {
            let message = aiError.message || "Failed to generate quiz from uploaded video.";
            const context = aiError.context;
            if (context && typeof context.text === "function") {
              try {
                const raw = await context.text();
                if (raw) {
                  try {
                    const details = JSON.parse(raw);
                    if (details?.error) message = `${message}: ${details.error}`;
                    if (details?.details) message = `${message} (${details.details})`;
                  } catch {
                    message = `${message}: ${raw.slice(0, 400)}`;
                  }
                }
              } catch {
                // Keep fallback message when context body cannot be read.
              }
            }
            throw new Error(message);
          }

          const generatedQuestions = Array.isArray(aiData?.questions)
            ? aiData.questions
                .map((q) => ({
                  question: String(q?.question || "").trim(),
                  options: Array.isArray(q?.options)
                    ? q.options.map((o) => String(o || "").trim()).slice(0, 4)
                    : [],
                  correctIndex: Number.isInteger(q?.correctIndex) ? Number(q.correctIndex) : 0,
                }))
                .filter((q) => q.question && q.options.length === 4)
            : [];

          if (!generatedQuestions.length) {
            throw new Error("AI could not generate valid questions from the uploaded video.");
          }

          questionsToInsert = generatedQuestions;
          setQuizQuestions(generatedQuestions);
        }

        const { error: quizError } = await supabase.from("quizzes").insert(
          questionsToInsert.map((q) => ({
            video_part_id: lesson.id,
            question: q.question,
            options: q.options,
            correct_index: q.correctIndex,
          }))
        );
        if (quizError) throw quizError;
      }

      setNewLessonTitle("");
      setNewLessonFile(null);
      setRequiresQuiz(true);
      setQuizTopic("");
      setAiQuestionCount(5);
      setQuizQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      if (lessonFileRef.current) lessonFileRef.current.value = "";

      const { data } = await supabase
        .from("video_parts")
        .select("*")
        .eq("video_id", videoId)
        .order("position");
      setLessons(data || []);
      setSuccessMessage(
        shouldAutoGenerateFromVideo
          ? "Lesson uploaded and quiz generated from video successfully."
          : "Lesson uploaded successfully."
      );
    } catch (e) {
      const raw = e?.message || "Unknown upload error";
      const rlsHint = raw.toLowerCase().includes("row-level security")
        ? ` Apply the latest RLS migration and ensure this user exists in public.admins. Current user id: ${user?.id || "unknown"}.`
        : "";
      setErrorMessage(`Failed at ${failedStep}: ${raw}.${rlsHint}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (lesson) => {
    const confirmed = await showConfirm("Delete lesson?");
    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    const { error: partError } = await supabase.from("video_parts").delete().eq("id", lesson.id);
    if (partError) {
      setErrorMessage(partError.message);
      return;
    }
    const normalizedPath = normalizeStoragePath(lesson.storage_path);
    if (normalizedPath) {
      await supabase.storage.from("videos").remove([normalizedPath]);
    }
    setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    setSuccessMessage("Lesson deleted.");
  };

  if (initializing) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-4 sm:py-8 px-3 sm:px-5">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Upload Lessons
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Create course lessons and quizzes (mobile-friendly)
          </p>
        </div>

        {!isAdmin && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex gap-3">
            <ShieldAlert className="mt-0.5" size={18} />
            <p className="text-sm">
              Upload is blocked for this account. Add this user ID to <code>public.admins</code> to
              allow lesson upload.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 text-sm">
            {successMessage}
          </div>
        )}

        {!videoId && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Course Setup</h2>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                <option value="">Select Class</option>
                {CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedSubject}
                disabled={!selectedClass}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800 outline-none disabled:opacity-40"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {courses.length > 0 && (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800 outline-none md:col-span-2"
                >
                  <option value="">Create New Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}

              {!selectedCourseId && (
                <input
                  placeholder="Course Title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800 outline-none md:col-span-2"
                />
              )}

              {!selectedCourseId && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800 md:col-span-2"
                />
              )}
            </div>

            <button
              onClick={prepareCourse}
              disabled={!canWrite}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Continue to Add Lessons"}
            </button>
          </div>
        )}

        {videoId && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Lesson Videos</h2>
              <p className="text-slate-500 text-sm mt-1">
                {currentCourse ? `Course: ${currentCourse.title}` : "Add lesson videos and quizzes"}
              </p>
            </div>

            {lessons.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                {lessons.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl"
                  >
                    <span className="font-semibold text-sm sm:text-base break-words">
                      {l.position}. {l.title}
                    </span>
                    <Trash2
                      onClick={() => deleteLesson(l)}
                      className="text-red-500 cursor-pointer hover:scale-110 transition shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add New Lesson</h3>

              <input
                placeholder="Lesson Title"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />

              <input
                ref={lessonFileRef}
                type="file"
                accept="video/*"
                onChange={(e) => setNewLessonFile(e.target.files?.[0] || null)}
                className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 dark:bg-slate-800"
              />

              <label className="flex items-center gap-2 sm:gap-3 font-medium text-sm sm:text-base">
                <input
                  type="checkbox"
                  checked={requiresQuiz}
                  onChange={(e) => setRequiresQuiz(e.target.checked)}
                />
                Require Quiz After Video
              </label>

              {requiresQuiz && (
                <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    AI Quiz Generator
                  </p>
                  <p className="text-xs text-slate-500">
                    Enter a topic if you want AI to generate quiz questions from the uploaded lesson video.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      placeholder="Quiz Topic (e.g. Cell Division)"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900 sm:col-span-2"
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={aiQuestionCount}
                      onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateQuizWithAi}
                    disabled={!canWrite || generatingQuiz}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-sm"
                  >
                    {generatingQuiz ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate Topic Draft
                      </>
                    )}
                  </button>
                </div>
              )}

              {requiresQuiz &&
                quizQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-5 rounded-xl sm:rounded-2xl space-y-3 border"
                  >
                    <input
                      placeholder={`Question ${i + 1}`}
                      value={q.question}
                      onChange={(e) => updateQuiz(i, "question", e.target.value)}
                      className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900"
                    />

                    {q.options.map((o, oi) => (
                      <input
                        key={oi}
                        placeholder={`Option ${oi + 1}`}
                        value={o}
                        onChange={(e) => updateOption(i, oi, e.target.value)}
                        className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900"
                      />
                    ))}

                    <select
                      value={q.correctIndex}
                      onChange={(e) => updateQuiz(i, "correctIndex", Number(e.target.value))}
                      className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900"
                    >
                      <option value={0}>Correct: Option 1</option>
                      <option value={1}>Correct: Option 2</option>
                      <option value={2}>Correct: Option 3</option>
                      <option value={3}>Correct: Option 4</option>
                    </select>

                    <button onClick={() => removeQuizBlock(i)} className="text-red-500 text-sm font-bold">
                      Remove Question
                    </button>
                  </div>
                ))}

              {requiresQuiz && (
                <button onClick={addQuizBlock} className="text-blue-600 font-bold text-sm sm:text-base">
                  + Add Another Question
                </button>
              )}

              <button
                onClick={addLesson}
                disabled={!canWrite}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all"
              >
                {loading ? "Uploading..." : "Add Lesson"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
