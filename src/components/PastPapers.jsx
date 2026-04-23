import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { offlineManager } from "../offlineStore";
import { useUser } from "./Usercontext";
import { FileText, Search, Loader2, Eye, GraduationCap, Download } from "lucide-react";

const CLASS_OPTIONS = ["All Classes", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

const isPastPaper = (row) => String(row?.file_url || "").toLowerCase().includes("gce-papers");

export default function PastPapers() {
  const { user } = useUser();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("study_notes")
          .select("*")
          .ilike("file_url", "%gce-papers%")
          .order("id", { ascending: false });

        if (error) throw error;
        setPapers((data || []).filter(isPastPaper));
      } catch {
        setPapers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, []);

  const openPaper = async (paper) => {
    const url = String(paper?.file_url || "").trim();
    if (!url) {
      alert("Missing file URL for this paper.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const savePaperOffline = async (paper) => {
    if (!user?.id) {
      alert("Please sign in to save papers offline.");
      return;
    }

    try {
      setDownloadingId(paper.id);
      const fileUrl = String(paper.file_url || "").trim();
      if (!fileUrl) throw new Error("Missing file URL.");

      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`Failed to download paper: ${res.status}`);

      const blob = await res.blob();
      await offlineManager.saveItem(
        "offline_docs",
        {
          sourceId: paper.id,
          title: paper.title || "Untitled Past Paper",
          subject: paper.subject || "General",
          topic: paper.topic || "",
          class_level: paper.class_level || "General",
          file_url: paper.file_url || "",
        },
        blob,
        user.id
      );
      alert("Past paper saved offline.");
    } catch (error) {
      alert(error?.message || "Failed to save paper offline.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return papers.filter((paper) => {
      const title = String(paper.title || "").toLowerCase();
      const subject = String(paper.subject || "").toLowerCase();
      const topic = String(paper.topic || "").toLowerCase();
      const bySearch = !term || title.includes(term) || subject.includes(term) || topic.includes(term);
      const byClass =
        selectedClass === "All Classes" ||
        String(paper.class_level || "").toLowerCase() === selectedClass.toLowerCase();
      return bySearch && byClass;
    });
  }, [papers, searchTerm, selectedClass]);

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen dark:bg-slate-950 transition-colors duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">GCE Past Papers</h1>
        <p className="text-slate-500 mt-2 font-medium">Browse and download past papers by class.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
        {CLASS_OPTIONS.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              selectedClass === cls
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500"
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      <div className="relative flex-1 mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchTerm}
          placeholder={`Search ${selectedClass} past papers...`}
          className="w-full pl-12 pr-4 py-4 rounded-3xl border-none bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none dark:text-white"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 opacity-60">
          <FileText className="mx-auto mb-4" size={48} />
          <p className="font-bold text-slate-700 dark:text-slate-200">No past papers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((paper) => (
            <div
              key={paper.id}
              className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                  <FileText size={24} />
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[9px] font-black px-2 py-1 rounded-md uppercase">
                  {paper.subject || "General"}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <GraduationCap size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {paper.class_level || "General"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {paper.title || "Untitled Past Paper"}
                </h3>
                {paper.topic ? <p className="text-xs text-slate-500 mt-2">Topic: {paper.topic}</p> : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPaper(paper)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl text-xs font-black uppercase hover:bg-blue-700 transition-all"
                >
                  <Eye size={14} /> View Paper
                </button>
                <button
                  onClick={() => savePaperOffline(paper)}
                  disabled={downloadingId === paper.id}
                  className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3 px-4 rounded-2xl text-xs font-black uppercase hover:bg-slate-800 transition-all disabled:opacity-60"
                >
                  <Download size={14} />
                  {downloadingId === paper.id ? "..." : "Offline"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
