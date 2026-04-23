import React, { useState } from "react";
import background from "./assets/image/business-education-concept-smiling-young-600nw-2122524395.jpg";
import { supabase } from "./supabaseClient";
import { useUser } from "./components/UserContext";
import { Eye, EyeOff, User, ArrowLeft } from "lucide-react";

export default function Login({ onLogin }) {
  const { setUser } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [parentId, setParentId] = useState(null);

  const [formData, setFormData] = useState({
    parentFullName: "",
    parentEmail: "",
    parentPassword: "",
    studentFullName: "",
    studentEmail: "",
    studentPassword: "",
  });

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* ======================= LOGIN LOGIC ======================= */
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Auth session
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: formData.parentEmail,
        password: formData.parentPassword,
      });

      if (authErr) throw authErr;
      const userId = authData.user.id;

     
      const { data: admin, error: adminErr } = await supabase
        .from("admins")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (adminErr) throw adminErr;

      if (admin) {
        
        setUser({ ...admin, role: "admin" });
        onLogin("/"); 
        return;
      }

      // 3️⃣ Check Profiles Table (Parents/Students only)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) throw new Error("Account verified, but no profile details found.");

      setUser(profile);
      onLogin("/"); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* =================== SIGNUP LOGIC (PARENT) =================== */
  async function handleParentSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.parentEmail,
        password: formData.parentPassword,
        options: {
          data: { full_name: formData.parentFullName, role: "parent" },
        },
      });

      if (error) throw error;
      setParentId(data.user.id);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* =================== SIGNUP LOGIC (STUDENT) =================== */
  async function handleStudentSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.studentEmail,
        password: formData.studentPassword,
        options: {
          data: {
            full_name: formData.studentFullName,
            role: "student",
            parent_id: parentId,
          },
        },
      });

      if (error) throw error;
      
      
      await new Promise((res) => setTimeout(res, 1000));

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      setUser(profile || { id: data.user.id, role: "student", full_name: formData.studentFullName });
      onLogin("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      <div className="hidden md:flex w-1/2 bg-cover bg-center relative" style={{ backgroundImage: `url(${background})` }}>
        <div className="absolute inset-0 bg-blue-700/80 flex flex-col justify-center px-16 text-white text-center">
          <h1 className="text-5xl font-bold mb-6 italic underline decoration-blue-400">LearnLink</h1>
          <p className="text-xl opacity-90"> Synchronizing home and school for academic excellence</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">{error}</div>}

          <div className="mb-8">
            {isSignup && step === 2 && (
              <button onClick={() => setStep(1)} className="flex items-center text-sm text-blue-600 mb-2">
                <ArrowLeft size={16} className="mr-1" /> Back
              </button>
            )}
            <h2 className="text-3xl font-bold text-gray-800">
              {!isSignup ? "Login" : step === 1 ? "Parent Signup" : "Student Details"}
            </h2>
          </div>

          <form onSubmit={!isSignup ? handleLogin : step === 1 ? handleParentSignup : handleStudentSignup} className="space-y-5">
            {(!isSignup || step === 1) && (
              <>
                {isSignup && (
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input name="parentFullName" placeholder="Parent Full Name" className="w-full pl-10 p-3.5 border rounded-xl" onChange={handleChange} required />
                  </div>
                )}
                <input name="parentEmail" type="email" placeholder="Email Address" className="w-full p-3.5 border rounded-xl" onChange={handleChange} required />
                <div className="relative">
                  <input name="parentPassword" type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-3.5 border rounded-xl" onChange={handleChange} required />
                  <button type="button" className="absolute right-3 top-3.5 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </>
            )}

            {isSignup && step === 2 && (
              <div className="space-y-4">
                <input name="studentFullName" placeholder="Student Full Name" className="w-full p-3.5 border rounded-xl" onChange={handleChange} required />
                <input name="studentEmail" type="email" placeholder="Student Email" className="w-full p-3.5 border rounded-xl" onChange={handleChange} required />
                <input name="studentPassword" type="password" placeholder="Student Password" className="w-full p-3.5 border rounded-xl" onChange={handleChange} required />
              </div>
            )}

            <button disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all">
              {loading ? "Logging in..." : !isSignup ? "Sign In" : step === 1 ? "Create student account" : "Create Accounts"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button onClick={() => { setIsSignup(!isSignup); setStep(1); }} className="text-blue-600 font-bold">
              {!isSignup ? "New User? Register Now" : "Back to Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}