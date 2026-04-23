import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    if (!activePopup && queue.length > 0) {
      setActivePopup(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [activePopup, queue]);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message) => {
      enqueueAlert(String(message ?? ""));
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  function enqueueAlert(message, title = "Notice") {
    return new Promise((resolve) => {
      setQueue((prev) => [
        ...prev,
        { type: "alert", title, message, resolve },
      ]);
    });
  }

  function enqueueConfirm(message, title = "Confirm Action") {
    return new Promise((resolve) => {
      setQueue((prev) => [
        ...prev,
        { type: "confirm", title, message, resolve },
      ]);
    });
  }

  function closePopup(value) {
    if (!activePopup) return;
    activePopup.resolve(value);
    setActivePopup(null);
  }

  const value = useMemo(
    () => ({
      showAlert: enqueueAlert,
      showConfirm: enqueueConfirm,
    }),
    [],
  );

  return (
    <PopupContext.Provider value={value}>
      {children}

      {activePopup && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {activePopup.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {activePopup.message}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              {activePopup.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => closePopup(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => closePopup(true)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                {activePopup.type === "confirm" ? "Continue" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return ctx;
}
