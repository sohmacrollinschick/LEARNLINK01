import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Users,
  Plus,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";

const CommunityHub = () => {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newCommunity, setNewCommunity] = useState("");
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    setCommunities(data || []);
  };

  const fetchPosts = async (communityId) => {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  const createCommunity = async () => {
    if (!newCommunity.trim()) return;

    setLoading(true);

    await supabase.from("communities").insert([
      { name: newCommunity },
    ]);

    setNewCommunity("");
    fetchCommunities();
    setLoading(false);
  };

  const createPost = async () => {
    if (!newPost.trim() || !selectedCommunity) return;

    await supabase.from("community_posts").insert([
      {
        community_id: selectedCommunity.id,
        content: newPost,
        likes: 0,
      },
    ]);

    setNewPost("");
    fetchPosts(selectedCommunity.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">

      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-blue-600" />
          Communities
        </h1>
        <p className="text-slate-500 mt-2">
          Join or create your own learning group
        </p>
      </div>

      {!selectedCommunity ? (
        <div className="max-w-4xl space-y-8">

          {/* CREATE COMMUNITY */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h2 className="text-xl font-bold">Create Community</h2>

            <div className="flex gap-4">
              <input
                placeholder="Community name (e.g. Form 5 Maths)"
                value={newCommunity}
                onChange={(e) => setNewCommunity(e.target.value)}
                className="flex-1 px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
              />

              <button
                onClick={createCommunity}
                className="px-6 py-4 rounded-3xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* COMMUNITY LIST */}
          <div className="grid md:grid-cols-2 gap-6">
            {communities.map((community) => (
              <div
                key={community.id}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => {
                  setSelectedCommunity(community);
                  fetchPosts(community.id);
                }}
              >
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {community.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Click to join & view posts
                </p>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="max-w-3xl space-y-8">

          {/* BACK BUTTON */}
          <button
            onClick={() => setSelectedCommunity(null)}
            className="text-blue-600 font-bold"
          >
            ← Back to communities
          </button>

          {/* COMMUNITY TITLE */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedCommunity.name}
            </h2>
          </div>

          {/* CREATE POST */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <textarea
              placeholder="Share something..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none resize-none"
            />
            <button
              onClick={createPost}
              className="mt-4 w-full py-4 rounded-3xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all"
            >
              <Send size={18} className="inline mr-2" />
              Post
            </button>
          </div>

          {/* POSTS */}
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <p className="text-slate-700 dark:text-slate-300">
                {post.content}
              </p>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default CommunityHub;