import React, { useState } from "react";
import { CreditCard, Smartphone, Loader2 } from "lucide-react";

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState("Premium");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    amount: 5000,
  });

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      alert(
        `Subscription request sent via ${paymentMethod}.\n\nName: ${formData.fullName}\nPhone: ${formData.phone}\nAmount: ${formData.amount} FCFA`
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">

      {/* PAGE HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">
          Upgrade Your Subscription
        </h1>
        <p className="text-slate-500 mt-2">
          Unlock premium features on LearnLink
        </p>
      </div>

      <div className="max-w-4xl space-y-8">

        {/* PLAN CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800">

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Premium Plan
          </h2>

          <p className="text-slate-500 mb-6">
            Access unlimited lessons, quizzes, and leaderboard rankings.
          </p>

          <div className="text-4xl font-black text-blue-600">
            5,000 FCFA
          </div>

        </div>

        {/* PAYMENT METHODS */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800">

          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
            Choose Payment Method
          </h3>

          <div className="flex gap-6">

            <button
              onClick={() => setPaymentMethod("MTN Mobile Money")}
              className={`flex-1 p-6 rounded-3xl border transition-all ${
                paymentMethod === "MTN Mobile Money"
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <Smartphone className="mx-auto text-yellow-500 mb-2" />
              <p className="font-bold text-center">MTN Mobile Money</p>
            </button>

            <button
              onClick={() => setPaymentMethod("Orange Money")}
              className={`flex-1 p-6 rounded-3xl border transition-all ${
                paymentMethod === "Orange Money"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <Smartphone className="mx-auto text-orange-500 mb-2" />
              <p className="font-bold text-center">Orange Money</p>
            </button>

          </div>
        </div>

        {/* PAYMENT FORM */}
        {paymentMethod && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800">

            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
              Complete Payment via {paymentMethod}
            </h3>

            <form onSubmit={handlePayment} className="space-y-6">

              <input
                required
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
              />

              <input
                required
                placeholder="Mobile Number (e.g. 677123456)"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
              />

              <input
                disabled
                value={`${formData.amount} FCFA`}
                className="w-full px-6 py-4 rounded-3xl bg-slate-200 dark:bg-slate-700"
              />

              <button
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black uppercase transition-all shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Confirm Payment
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;