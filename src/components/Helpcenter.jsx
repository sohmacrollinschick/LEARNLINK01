import React, { useState } from "react";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Loader2,
} from "lucide-react";

const HelpCenter = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I upgrade to Premium?",
      answer:
        "Go to the Subscription page, choose MTN or Orange Money, fill in your details and confirm payment.",
    },
    {
      question: "How do I join a community?",
      answer:
        "Navigate to the Community page, select an existing community and click join.",
    },
    {
      question: "How does the leaderboard work?",
      answer:
        "Leaderboard rankings are based on quiz performance and activity points.",
    },
    {
      question: "Why can't I download offline notes?",
      answer:
        "Google Drive links may block CORS. Use Supabase public storage links for best performance.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      alert("Support request sent successfully!");
      setLoading(false);
      setFormData({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <HelpCircle className="text-blue-600" />
          Help Center
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Find answers or contact support
        </p>
      </div>

      <div className="max-w-4xl space-y-10">

        {/* SEARCH BAR */}
        <div className="relative">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-5 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-600 outline-none dark:text-white"
          />
        </div>

        {/* FAQ SECTION */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-slate-200 dark:border-slate-800 last:border-none"
            >
              <button
                onClick={() =>
                  setActiveIndex(activeIndex === index ? null : index)
                }
                className="w-full flex justify-between items-center px-8 py-6 text-left"
              >
                <span className="font-bold text-slate-900 dark:text-white">
                  {faq.question}
                </span>

                {activeIndex === index ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {activeIndex === index && (
                <div className="px-8 pb-6 text-slate-600 dark:text-slate-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-bold">
              No matching help articles found.
            </div>
          )}
        </div>

        {/* CONTACT SUPPORT */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800">

          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Mail size={18} />
            Contact Support
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              required
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />

            <input
              required
              type="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />

            <textarea
              required
              rows="4"
              placeholder="Describe your issue..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none resize-none"
            />

            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black uppercase transition-all shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;