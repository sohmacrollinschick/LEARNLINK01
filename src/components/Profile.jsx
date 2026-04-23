import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  User,
  GraduationCap,
  Crown,
  Loader2,
  Save,
  Camera
} from "lucide-react";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    class_level: "",
    subscription: "Free",
    points: 0,
    avatar_url: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setUserData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .update({
        full_name: userData.full_name,
        class_level: userData.class_level
      })
      .eq("id", user.id);

    setSaving(false);
    alert("Profile updated!");
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();

    const filePath = `${user.id}-${Date.now()}`;

    await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    const { data } = supabase
      .storage
      .from("avatars")
      .getPublicUrl(filePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);

    setUserData(prev => ({ ...prev, avatar_url: data.publicUrl }));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">

      <h1 className="text-3xl font-black mb-10">
        My Profile
      </h1>

      <div className="grid md:grid-cols-3 gap-8">

        {/* LEFT CARD */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">

          <div className="relative w-28 h-28 mx-auto">

            {userData.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt="avatar"
                className="w-28 h-28 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {userData.full_name?.charAt(0)}
              </div>
            )}

            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow cursor-pointer">
              <Camera size={16} />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <h2 className="mt-6 text-xl font-bold">
            {userData.full_name}
          </h2>

          <p className="text-gray-500 text-sm">
            {userData.email}
          </p>

          <div className="mt-6">
            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${
              userData.subscription === "Premium"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-gray-200 text-gray-600"
            }`}>
              {userData.subscription === "Premium" && <Crown size={14} className="inline mr-1" />}
              {userData.subscription}
            </span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="md:col-span-2 space-y-8">

          {/* STATS */}
          <div className="bg-white rounded-3xl shadow-xl p-8 grid md:grid-cols-2 gap-6">

            <div className="bg-slate-100 rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-blue-600">
                {userData.points}
              </p>
              <p className="text-xs uppercase font-bold text-gray-400">
                Total Points
              </p>
            </div>

            <div className="bg-slate-100 rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-green-600">
                {userData.class_level}
              </p>
              <p className="text-xs uppercase font-bold text-gray-400">
                Class Level
              </p>
            </div>

          </div>

          {/* EDIT FORM */}
          <div className="bg-white rounded-3xl shadow-xl p-8">

            <h3 className="text-lg font-bold mb-6">
              Edit Profile
            </h3>

            <form onSubmit={updateProfile} className="space-y-6">

              <input
                value={userData.full_name}
                onChange={(e) =>
                  setUserData({ ...userData, full_name: e.target.value })
                }
                className="w-full p-4 rounded-2xl border"
                placeholder="Full Name"
              />

              <input
                value={userData.class_level}
                onChange={(e) =>
                  setUserData({ ...userData, class_level: e.target.value })
                }
                className="w-full p-4 rounded-2xl border"
                placeholder="Class Level"
              />

              <button
                disabled={saving}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
}