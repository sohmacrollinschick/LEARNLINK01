import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { offlineManager } from "../offlineStore";
import { SYNC_ACTIONS, flushPendingSync, queueSyncAction } from "../syncEngine";
import { useUser } from "./Usercontext";
import {
  Download,
  BookOpen,
  Dna,
  Calculator,
  Atom,
  FlaskConical,
  WifiOff,
  Rewind,
  FastForward,
} from "lucide-react";
import logoImage from "../assets/image/learn.png";

const CLASSES = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

const subjectIcons = {
  biology: Dna,
  mathematics: Calculator,
  physics: Atom,
  chemistry: FlaskConical,
  default: BookOpen,
};

export default function Home({ darkMode }) {
  const { user } = useUser();

  const [selectedClass, setSelectedClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizPassed, setQuizPassed] = useState(false);

  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [offlineItems, setOfflineItems] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);

  const blobUrlRef = useRef(null);
  const videoRef = useRef(null);

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";
  const cardBg = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

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

  const cleanupBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const getPlayableVideoUrl = async (rawStoragePath) => {
    const storagePath = normalizeStoragePath(rawStoragePath);

    console.log("raw storage_path:", rawStoragePath);
    console.log("normalized storage_path:", storagePath);

    if (!storagePath) {
      throw new Error("Missing storage path for this lesson.");
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("videos")
      .createSignedUrl(storagePath, 60 * 60);

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }

    const { data } = supabase.storage.from("videos").getPublicUrl(storagePath);

    if (!data?.publicUrl) {
      throw new Error(signedError?.message || "Could not resolve video URL.");
    }

    return data.publicUrl;
  };

  const getVideoAsBlobUrl = async (rawStoragePath) => {
    const url = await getPlayableVideoUrl(rawStoragePath);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video file: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    blobUrlRef.current = objectUrl;
    return objectUrl;
  };

  const fetchWithOfflineCache = async ({ cacheKey, fetcher, fallback = [] }) => {
    if (navigator.onLine) {
      try {
        const fresh = await fetcher();
        await offlineManager.setCache(cacheKey, fresh, user?.id ?? null);
        return fresh;
      } catch (error) {
        console.error(`Online fetch failed for ${cacheKey}:`, error);
      }
    }

    const cached = await offlineManager.getCache(cacheKey, user?.id ?? null);
    return Array.isArray(cached) || cached ? cached : fallback;
  };

  const markLessonCompleted = async (lesson) => {
    if (!user?.id || !lesson?.video_id) return;

    const watchedKey = "watched_lessons";
    const existing = (await offlineManager.getCache(watchedKey, user.id)) || [];
    const next = [
      {
        lessonId: lesson.id,
        courseId: lesson.video_id,
        title: lesson.title,
        watchedAt: new Date().toISOString(),
      },
      ...existing.filter((item) => item.lessonId !== lesson.id),
    ].slice(0, 200);

    await offlineManager.setCache(watchedKey, next, user.id);

    await queueSyncAction(
      SYNC_ACTIONS.UPSERT_COURSE_PROGRESS,
      {
        video_id: lesson.video_id,
        completed_parts: 1,
        total_parts: 1,
        progress_percentage: 100,
      },
      user.id,
    );

    if (navigator.onLine) {
      await flushPendingSync(user.id);
    }
  };

  const ensureLessonCachedForOffline = async (lesson) => {
    if (!user?.id || !lesson?.id || !lesson?.storage_path || !navigator.onLine) return;

    const alreadySaved = await offlineManager.getVideoByLesson(user.id, lesson.id);
    if (alreadySaved?.blob) return;

    try {
      const url = await getPlayableVideoUrl(lesson.storage_path);
      const res = await fetch(url);
      if (!res.ok) return;

      const blob = await res.blob();
      await offlineManager.saveItem(
        "offline_videos",
        {
          lessonId: lesson.id,
          title: lesson.title,
          position: lesson.position,
          subject: selectedSubject?.name ?? null,
          storage_path: normalizeStoragePath(lesson.storage_path),
          archived: false,
        },
        blob,
        user.id
      );

      await queueSyncAction(
        SYNC_ACTIONS.UPSERT_OFFLINE_DOWNLOAD,
        {
          lesson_id: lesson.id,
          storage_path: normalizeStoragePath(lesson.storage_path),
          title: lesson.title,
          subject: selectedSubject?.name ?? null,
          archived: true,
          archived_at: new Date().toISOString(),
          downloaded_at: new Date().toISOString(),
        },
        user.id
      );

      await flushPendingSync(user.id);
    } catch (error) {
      console.error("Auto-cache for watched lesson failed:", error);
    }
  };

  useEffect(() => {
    const onUp = () => setOfflineMode(false);
    const onDown = () => setOfflineMode(true);

    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);

    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  useEffect(() => {
    return () => cleanupBlobUrl();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    setLoading(true);

    (async () => {
      const data = await fetchWithOfflineCache({
        cacheKey: `subjects:${selectedClass}`,
        fetcher: async () => {
          const { data: rows, error } = await supabase
            .from("subjects")
            .select("id, name")
            .eq("form", selectedClass)
            .order("name");

          if (error) throw error;
          return rows || [];
        },
      });

      setSubjects(data || []);
      setLoading(false);
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSubject) return;

    setLoading(true);

    (async () => {
      const data = await fetchWithOfflineCache({
        cacheKey: `videos:${selectedSubject.id}`,
        fetcher: async () => {
          const { data: rows, error } = await supabase
            .from("videos")
            .select("*")
            .eq("subject_id", selectedSubject.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          return rows || [];
        },
      });

      setCourses(data || []);
      setLoading(false);
    })();
  }, [selectedSubject]);

  const openCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
    setQuizPassed(false);
    setVideoUrl(null);
    setVideoError("");
    cleanupBlobUrl();

    const data = await fetchWithOfflineCache({
      cacheKey: `video_parts:${course.id}`,
      fetcher: async () => {
        const { data: rows, error } = await supabase
          .from("video_parts")
          .select("*")
          .eq("video_id", course.id)
          .order("position");

        if (error) throw error;
        return rows || [];
      },
    });

    setLessons(data || []);
  };

  const openLesson = async (lesson) => {
    setSelectedLesson(lesson);
    setQuizPassed(!lesson.requires_quiz);
    setAnswers({});
    setQuizzes([]);
    setVideoUrl(null);
    setVideoError("");
    setPlaybackRate(1);
    cleanupBlobUrl();

    try {
      if (offlineMode) {
        const saved = await offlineManager.getVideoByLesson(user?.id ?? null, lesson.id);
        if (!saved?.blob) {
          alert("Lesson not downloaded for offline use.");
          return;
        }

        const objectUrl = URL.createObjectURL(saved.blob);
        blobUrlRef.current = objectUrl;
        setVideoUrl(objectUrl);
      } else {
        if (!lesson.storage_path) {
          throw new Error("This lesson has no storage_path in the database.");
        }

        const url = await getPlayableVideoUrl(lesson.storage_path);
        console.log("resolved video url:", url);
        setVideoUrl(url);
        ensureLessonCachedForOffline(lesson);
      }

      if (lesson.requires_quiz) {
        const quizRows = await fetchWithOfflineCache({
          cacheKey: `quizzes:${lesson.id}`,
          fetcher: async () => {
            const { data: rows, error } = await supabase
              .from("quizzes")
              .select("*")
              .eq("video_part_id", lesson.id);

            if (error) throw error;
            return rows || [];
          },
        });
        setQuizzes(quizRows || []);
      }
    } catch (err) {
      console.error("Video playback URL error:", err);
      setVideoError("Unable to load this lesson video right now.");
    }
  };

  const handleVideoError = async () => {
    if (!selectedLesson || offlineMode) return;

    try {
      setVideoError("Trying alternative video loading...");
      cleanupBlobUrl();

      const blobUrl = await getVideoAsBlobUrl(selectedLesson.storage_path);
      setVideoUrl(blobUrl);
      setVideoError("");
    } catch (err) {
      console.error("Fallback blob playback failed:", err);
      setVideoError("Unable to play this uploaded video.");
    }
  };

  const seekVideoBy = (seconds) => {
    const node = videoRef.current;
    if (!node || !Number.isFinite(node.duration)) return;
    const nextTime = Math.min(Math.max((node.currentTime || 0) + seconds, 0), node.duration);
    node.currentTime = nextTime;
  };

  const handlePlaybackRateChange = (value) => {
    const rate = Number(value) || 1;
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const submitQuiz = () => {
    let score = 0;

    quizzes.forEach((q) => {
      if (answers[q.id] === q.correct_index) score++;
    });

    if (score === quizzes.length) {
      setQuizPassed(true);
      alert("✅ Quiz passed");
    } else {
      alert("❌ Try again");
    }
  };

  const downloadLesson = async (lesson) => {
    if (offlineMode) return alert("Go online to download");
    if (!user?.id) return alert("Please sign in to save offline content.");

    try {
      setDownloading(true);

      const url = await getPlayableVideoUrl(lesson.storage_path);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to download video: ${res.status}`);
      }

      const blob = await res.blob();

      await offlineManager.saveItem(
        "offline_videos",
        {
          lessonId: lesson.id,
          title: lesson.title,
          position: lesson.position,
          subject: selectedSubject?.name ?? null,
          storage_path: normalizeStoragePath(lesson.storage_path),
          archived: false,
        },
        blob,
        user.id
      );

      const downloadPayload = {
        lesson_id: lesson.id,
        storage_path: normalizeStoragePath(lesson.storage_path),
        title: lesson.title,
        subject: selectedSubject?.name ?? null,
        archived: true,
        archived_at: new Date().toISOString(),
        downloaded_at: new Date().toISOString(),
      };

      await queueSyncAction(SYNC_ACTIONS.UPSERT_OFFLINE_DOWNLOAD, downloadPayload, user.id);
      if (navigator.onLine) {
        await flushPendingSync(user.id);
      }

      alert("Saved for offline");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to save lesson offline.");
    } finally {
      setDownloading(false);
    }
  };

  const openOfflineLibrary = async () => {
    setOfflineItems(await offlineManager.getAll("offline_videos", user?.id ?? null));
  };

  return (
    <div className={bg}>
      <header className="py-10 bg-blue-700 text-white text-center relative">
        <img
          src={logoImage}
          alt="LearnLink logo"
          className="w-16 h-16 rounded-2xl object-cover border border-white/30 mx-auto mb-3"
        />
        <h1 className="text-4xl font-black">LearnLink</h1>
        <p className="font-bold">Cameroon Curriculum</p>

        {offlineMode && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl">
            <WifiOff size={18} /> Offline
          </div>
        )}
      </header>

      {!selectedClass && (
        <section className="p-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className="bg-blue-600 text-white py-4 rounded-2xl font-black"
            >
              {cls}
            </button>
          ))}
        </section>
      )}

      {selectedClass && !selectedSubject && (
        <section className="p-8">
          <button onClick={() => setSelectedClass(null)} className="mb-4 text-blue-600 font-bold">
            ← Back
          </button>

          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((s) => {
              const key = s.name.toLowerCase();
              const Icon =
                subjectIcons[Object.keys(subjectIcons).find((k) => key.includes(k))] ||
                subjectIcons.default;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSubject(s)}
                  className={`${cardBg} p-6 rounded-2xl border cursor-pointer flex gap-4`}
                >
                  <Icon />
                  <span className="font-black">{s.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedSubject && !selectedCourse && (
        <section className="p-8">
          <button onClick={() => setSelectedSubject(null)} className="mb-4 text-blue-600 font-bold">
            ← Back
          </button>

          <div className="grid md:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                onClick={() => openCourse(c)}
                className={`${cardBg} p-6 rounded-2xl border cursor-pointer`}
              >
                <h3 className="font-black">{c.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedCourse && !selectedLesson && (
        <section className="p-8">
          <button onClick={() => setSelectedCourse(null)} className="mb-4 text-blue-600 font-bold">
            ← Back
          </button>

          {lessons.map((l) => (
            <div key={l.id} className={`${cardBg} p-4 rounded-2xl border mb-2 flex justify-between`}>
              <span>{l.position}. {l.title}</span>
              <button onClick={() => openLesson(l)} className="bg-blue-600 text-white px-3 py-1 rounded">
                Open
              </button>
            </div>
          ))}
        </section>
      )}

      <AnimatePresence>
        {selectedLesson && (
          <motion.div className="fixed inset-0 bg-black/80 p-6 z-50">
            <div className="max-w-4xl mx-auto bg-black rounded-2xl overflow-hidden">
              {videoUrl && (
                <video
                  ref={videoRef}
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full"
                  onError={handleVideoError}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = playbackRate;
                    }
                  }}
                  onEnded={() => markLessonCompleted(selectedLesson)}
                />
              )}

              {videoUrl && (
                <div className="px-6 py-3 border-t border-white/10 bg-black/70 text-white flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => seekVideoBy(-10)}
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                    title="Back 10 seconds"
                  >
                    <Rewind size={16} />
                    -10s
                  </button>
                  <button
                    onClick={() => seekVideoBy(10)}
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                    title="Forward 10 seconds"
                  >
                    <FastForward size={16} />
                    +10s
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <label htmlFor="playback-rate" className="text-sm text-slate-300">
                      Speed
                    </label>
                    <select
                      id="playback-rate"
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                </div>
              )}

              {!videoUrl && videoError && (
                <div className="p-6 text-red-300 text-sm">{videoError}</div>
              )}

              {videoUrl && videoError && (
                <div className="p-4 text-yellow-300 text-sm">{videoError}</div>
              )}

              <div className="p-6 text-white space-y-4">
                <button
                  onClick={() => {
                    cleanupBlobUrl();
                    setSelectedLesson(null);
                    setVideoUrl(null);
                    setVideoError("");
                    setPlaybackRate(1);
                  }}
                  className="text-blue-400 font-bold"
                >
                  ← Back
                </button>

                {!offlineMode && (
                  <button
                    onClick={() => downloadLesson(selectedLesson)}
                    className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2"
                    disabled={downloading}
                  >
                    <Download size={16} />
                    {downloading ? "Downloading..." : "Download Offline"}
                  </button>
                )}

                {selectedLesson.requires_quiz && !quizPassed && (
                  <div>
                    {quizzes.map((q) => (
                      <div key={q.id}>
                        <p className="font-bold">{q.question}</p>
                        {q.options.map((o, i) => (
                          <label key={i} className="block">
                            <input
                              type="radio"
                              checked={answers[q.id] === i}
                              onChange={() => setAnswers({ ...answers, [q.id]: i })}
                            />{" "}
                            {o}
                          </label>
                        ))}
                      </div>
                    ))}

                    <button onClick={submitQuiz} className="bg-green-600 px-4 py-2 rounded">
                      Submit Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
