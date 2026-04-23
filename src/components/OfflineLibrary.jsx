import React, { useEffect, useState } from "react";
import { offlineManager } from "/src/offlineStore";
import { useUser } from "./Usercontext";
import { 
  WifiOff, 
  Trash2, 
  FileText, 
  Play, 
  BookOpen,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "./PopupProvider";

export default function OfflineLibrary({ darkMode }) {
  const { user } = useUser();
  const { showConfirm } = usePopup();
  const [savedDocs, setSavedDocs] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOfflineData();
  }, [user?.id]);

  const loadOfflineData = async () => {
    setLoading(true);
    try {
      const docs = await offlineManager.getAll('offline_docs', user?.id ?? null);
      const videos = await offlineManager.getAll('offline_videos', user?.id ?? null);
      setSavedDocs(docs);
      setSavedVideos(videos);
    } catch (err) {
      console.error("Failed to load offline data", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = async (store, id) => {
    const confirmed = await showConfirm("Remove this file from offline storage?");
    if (!confirmed) return;
    await offlineManager.removeItem(store, id);
    loadOfflineData(); // Refresh list
  };

  const openBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Important: revoke the URL after some time to free up memory
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "text-white bg-slate-950" : "text-slate-900 bg-slate-50"}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 font-bold mb-8 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Online
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-500/30">
            <WifiOff size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight italic">Offline Library</h1>
            <p className="text-slate-500 font-medium">Your saved study materials (Stored in Browser)</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 font-black animate-pulse">Scanning Local Storage...</div>
        ) : (
          <div className="space-y-12">
            
            {/* SAVED DOCUMENTS (Notes & Papers) */}
            <section>
              <h3 className="flex items-center gap-3 text-xl font-black mb-6 px-2">
                <FileText className="text-blue-500" /> Documents & Papers
                <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">{savedDocs.length}</span>
              </h3>
              
              {savedDocs.length === 0 ? (
                <div className="p-10 border-2 border-dashed rounded-[2rem] text-center opacity-40">
                  <p className="font-bold italic">No documents saved for offline use yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedDocs.map((doc) => (
                    <div key={doc.localId} className={`p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                           <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-600 px-3 py-1 rounded-full uppercase italic">
                             {doc.year || doc.class_level}
                           </span>
                           <button onClick={() => removeFile('offline_docs', doc.localId)} className="text-slate-400 hover:text-red-500 transition-colors">
                             <Trash2 size={18} />
                           </button>
                        </div>
                        <h4 className="text-lg font-black mb-1 leading-tight">{doc.subject}</h4>
                        <p className="text-xs text-slate-500 font-medium mb-6 truncate">{doc.title}</p>
                      </div>

                      <button 
                        onClick={() => openBlob(doc.blob || doc.fileBlob)}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <BookOpen size={16} /> READ OFFLINE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SAVED VIDEOS */}
            <section className="pb-20">
              <h3 className="flex items-center gap-3 text-xl font-black mb-6 px-2">
                <Play className="text-red-500" /> Lesson Videos
                <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">{savedVideos.length}</span>
              </h3>

              {savedVideos.length === 0 ? (
                <div className="p-10 border-2 border-dashed rounded-[2rem] text-center opacity-40">
                  <p className="font-bold italic">No videos saved offline.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {savedVideos.map((video) => (
                    <div key={video.localId} className={`group overflow-hidden rounded-[2.5rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                      <video 
                        className="w-full aspect-video bg-black" 
                        src={URL.createObjectURL(video.blob)} 
                        controls 
                      />
                      <div className="p-6 flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-lg">{video.title}</h4>
                          <p className="text-xs text-slate-500 font-bold">{video.subject}</p>
                        </div>
                        <button onClick={() => removeFile('offline_videos', video.localId)} className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
