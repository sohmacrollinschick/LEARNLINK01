import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const UserContext = createContext();
const roleCacheKey = (id) => `learnlink_role_${id}`;

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUser = (nextUser) => {
    setUserState((prev) => {
      const value = typeof nextUser === "function" ? nextUser(prev) : nextUser;
      if (value?.id && value?.role) {
        localStorage.setItem(roleCacheKey(value.id), value.role);
      }
      return value;
    });
  };

  const patchRoleFromDatabase = async (authUser) => {
    if (!authUser?.id) return;

    const { data: admin, error: adminErr } = await supabase
      .from("admins")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!adminErr && admin) {
      const nextUser = { ...authUser, role: "admin" };
      setUser(nextUser);
      return;
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!profileErr && profile?.role) {
      setUser({ ...authUser, role: profile.role });
    }
  };

  // 1. Initial Session Check
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cachedRole =
        localStorage.getItem(roleCacheKey(authUser.id)) ||
        authUser.user_metadata?.role ||
        null;

      setUser(cachedRole ? { ...authUser, role: cachedRole } : authUser);
      setLoading(false);
      if (!cachedRole) patchRoleFromDatabase(authUser);
    };
    getSession();

    // 2. Listen for Auth Changes (This triggers on SignOut)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cachedRole =
        localStorage.getItem(roleCacheKey(authUser.id)) ||
        authUser.user_metadata?.role ||
        null;

      setUser(cachedRole ? { ...authUser, role: cachedRole } : authUser);
      setLoading(false);
      if (!cachedRole) patchRoleFromDatabase(authUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. THE LOGOUT FUNCTION (The most important part)
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Force local state to null immediately
      if (user?.id) {
        localStorage.removeItem(roleCacheKey(user.id));
      }
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
