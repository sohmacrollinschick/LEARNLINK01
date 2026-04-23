
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { offlineManager } from "../offlineStore";
import { useUser } from "./Usercontext";
import { FileText, Search, Loader2, Eye, GraduationCap, Download } from "lucide-react";

const StudentNotes = () => {
  const { user } = useUser();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [downloadingId, setDownloadingId] = useState(null);

  const cameroonClasses = [
    "All Classes",
    "Form 1",
    "Form 2",
    "Form 3",
    "Form 4",
    "Form 5",
    
  ];

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("study_notes")
          .select("*")
          .order("id", { ascending: false }); // use created_at if you have it

        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        console.error("Fetch notes error:", error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const resolveNoteUrl = async (note) => {
    const raw = String(note?.file_url || "").trim();
    if (!raw) {
      throw new Error("Missing file URL for this note.");
    }

    if (raw.includes("drive.google.com")) {
      throw new Error("This note still uses a Google Drive link. Ask admin to re-upload it to Supabase.");
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    const rawPath = raw.replace(/^\/+/, "");
    const bucket = rawPath.startsWith("GCE-PAPERS/") ? "GCE-PAPERS" : "lesson-notes";
    const objectPath = rawPath.replace(/^GCE-PAPERS\//, "").replace(/^lesson-notes\//, "");

    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60 * 60);

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (!publicData?.publicUrl) {
      throw new Error("Unable to resolve note URL.");
    }

    return publicData.publicUrl;
  };

  const openNote = async (note) => {
    try {
      const url = await resolveNoteUrl(note);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(error?.message || "Failed to open this note.");
    }
  };

  const saveNoteOffline = async (note) => {
    if (!user?.id) {
      alert("Please sign in to save notes offline.");
      return;
    }

    try {
      setDownloadingId(note.id);
      const url = await resolveNoteUrl(note);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to download note: ${res.status}`);

      const blob = await res.blob();
      await offlineManager.saveItem(
        "offline_docs",
        {
          sourceId: note.id,
          title: note.title || "Untitled Note",
          subject: note.subject || "General",
          topic: note.topic || "",
          class_level: note.class_level || "General",
          file_url: note.file_url || "",
        },
        blob,
        user.id
      );

      alert("Saved offline.");
    } catch (error) {
      alert(error?.message || "Failed to save note offline.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return notes.filter((note) => {
      const title = (note.title || "").toLowerCase();
      const subject = (note.subject || "").toLowerCase();
      const topic = (note.topic || "").toLowerCase();

      const matchesSearch =
        !term || title.includes(term) || subject.includes(term) || topic.includes(term);

      const matchesClass =
        selectedClass === "All Classes" ||
        (note.class_level || "").toLowerCase() === selectedClass.toLowerCase();

      return matchesSearch && matchesClass;
    });
  }, [notes, searchTerm, selectedClass]);

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen dark:bg-slate-950 transition-colors duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">
          LearnLink Library
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Secondary Education Resources (Cameroon)
        </p>
      </div>

      {/* Class Selector Scrollbar */}
      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
        {cameroonClasses.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all
              ${
                selectedClass === cls
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500"
              }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            value={searchTerm}
            placeholder={`Search ${selectedClass} notes...`}
            className="w-full pl-12 pr-4 py-4 rounded-3xl border-none bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none dark:text-white"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-20 opacity-60">
              <FileText className="mx-auto mb-4" size={48} />
              <p className="font-bold text-slate-700 dark:text-slate-200">No notes found.</p>
              <p className="text-sm text-slate-500 mt-2">
                Try another class level or different keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                      <FileText size={24} />
                    </div>

                    {/* show subject as badge (instead of year since study_notes has no year) */}
                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[9px] font-black px-2 py-1 rounded-md uppercase">
                      {note.subject || "General"}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <GraduationCap size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {note.class_level || "General"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {note.title || "Untitled Note"}
                    </h3>

                    {note.topic ? (
                      <p className="text-xs text-slate-500 mt-2">Topic: {note.topic}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openNote(note)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl text-xs font-black uppercase hover:bg-blue-700 transition-all"
                    >
                      <Eye size={14} /> View Note
                    </button>
                    <button
                      onClick={() => saveNoteOffline(note)}
                      disabled={downloadingId === note.id}
                      className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3 px-4 rounded-2xl text-xs font-black uppercase hover:bg-slate-800 transition-all disabled:opacity-60"
                    >
                      <Download size={14} />
                      {downloadingId === note.id ? "..." : "Offline"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentNotes;
