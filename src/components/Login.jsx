// src/pages/Login.jsx
import React from 'react';

function Login() {
  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-900 text-gray-800 dark:text-white">
      <div className="bg-white dark:bg-slate-800 p-8 rounded shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login to LearnLink</h2>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
