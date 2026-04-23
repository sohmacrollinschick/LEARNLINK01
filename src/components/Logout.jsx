import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Logout({ darkMode, onCancel }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const bg = darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const btnPrimary = darkMode
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";
  const btnSecondary = darkMode
    ? "bg-gray-700 hover:bg-gray-600 text-white"
    : "bg-gray-300 hover:bg-gray-400 text-gray-900";

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      navigate("/login"); // Redirect after successful logout
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={`min-h-screen flex flex-col items-center justify-center px-6 ${bg} transition-colors duration-300`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-9xl mb-6 select-none"
        aria-label="Crying emoji"
      >
        😢
      </motion.div>

      <h1 className="text-3xl font-bold mb-4 text-center">
        Are you sure you want to log out?
      </h1>
      <p className="max-w-md text-center mb-8 text-gray-600 dark:text-gray-300">
        We'll miss you! 😔 Logging out means you'll have to sign in again to
        continue learning. Are you really ready to leave?
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!showConfirm ? (
        <div className="flex gap-6">
          <button
            onClick={() => setShowConfirm(true)}
            className={`px-6 py-3 rounded-md font-semibold transition ${btnPrimary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400`}
          >
            Yes, Log me out
          </button>
          <button
            onClick={onCancel}
            className={`px-6 py-3 rounded-md font-semibold transition ${btnSecondary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`}
          >
            No, Stay logged in
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <p className="mb-6 text-lg">
              We just want to make sure you really want to log out. Press confirm if you’re sure.
            </p>
            <div className="flex gap-6 justify-center">
              <button
                onClick={handleLogout}
                disabled={loading}
                className={`px-6 py-3 rounded-md font-semibold transition ${btnPrimary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400`}
              >
                {loading ? "Logging out..." : "Confirm Logout"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className={`px-6 py-3 rounded-md font-semibold transition ${btnSecondary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
