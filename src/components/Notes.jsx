import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineManager } from '../offlineStore';
import { useUser } from './Usercontext';
import { 
  WifiOff, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Search, 
  Inbox,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePopup } from "./PopupProvider";

const OfflineLibrary = () => {
  const { user } = useUser();
  const { showConfirm } = usePopup();
  const [offlineNotes, setOfflineNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOfflineData();
  }, [user?.id]);

  const loadOfflineData = async () => {
    setLoading(true);
    try {
      // Pulling directly from the browser's IndexedDB
      const data = await offlineManager.getAll('offline_docs', user?.id ?? null);
      setOfflineNotes(data || []);
    } catch (err) {
      console.error("Failed to load offline storage", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFromOffline = async (id) => {
    const confirmed = await showConfirm("Remove this document from offline storage?");
    if (!confirmed) return;
    await offlineManager.deleteItem('offline_docs', id);
    setOfflineNotes(prev => prev.filter(note => note.localId !== id));
  };

  const openDocument = (blob) => {
    // Creates a temporary local URL for the PDF/Doc stored in the browser
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const filtered = offlineNotes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-4 hover:gap-3 transition-all"
            >
              <ArrowLeft size={16} /> Back to Vault
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                <WifiOff size={24} />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
                Offline Library
              </h1>
            </div>
            <p className="text-slate-500 font-bold ml-1">No Internet? No Problem. Your saved documents are ready.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search offline files..."
              className="pl-12 pr-6 py-4 w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid Display */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((note) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={note.localId}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                >
                  {/* Decorative Background Icon */}
                  <FileText className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 dark:text-slate-800/50 group-hover:text-blue-500/5 transition-colors" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-4 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {note.subject}
                      </div>
                      <button 
                        onClick={() => deleteFromOffline(note.localId)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight uppercase italic">
                      {note.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                      Topic: {note.topic || "General"} • {note.class_level}
                    </p>

                    <button 
                      onClick={() => openDocument(note.blob || note.fileBlob)}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"
                    >
                      <ExternalLink size={16} /> Open Document
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
            <Inbox className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={64} />
            <h2 className="text-xl font-black text-slate-400 uppercase italic">Your library is empty</h2>
            <p className="text-slate-400 text-sm font-bold">Go to the Study Vault to save notes for offline use.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineLibrary;
