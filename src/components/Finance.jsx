import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  CalendarDays,
  DollarSign,
  Clock4,
  AlertTriangle,
  CheckCircle,
  Lock,
  Smartphone,
  ArrowUpRight,
  X,
  RefreshCcw
} from "lucide-react";

/* ===================== STORAGE KEYS ===================== */
const SUB_KEY = "learnlink_subscription";
const REDIRECT_KEY = "force_finance_redirect";

/* ===================== PLANS ===================== */
const PLAN_PRICES = {
  Free: 0,
  Basic: 2000,
  Pro: 5000,
  Premium: 8000
};

const PLAN_FEATURES = {
  Free: ["Limited access"],
  Basic: ["O-Level Notes", "Limited GCE"],
  Pro: ["O-Level + A-Level Notes", "GCE Past Questions", "Unlimited Downloads"],
  Premium: ["All Content", "GCE + MOCH", "Unlimited Downloads"]
};

/* ===================== HELPERS ===================== */
const fcfa = n => `${Number(n).toLocaleString()} FCFA`;

const createDefaultSub = () => {
  const now = new Date();
  const exp = new Date();
  exp.setDate(exp.getDate() + 30);
  return {
    plan: "Free",
    status: "Active",
    startDate: now.toISOString(),
    expiresAt: exp.toISOString(),
    autoRenew: false,
    lastMethod: null,
    phone: ""
  };
};

export default function Finance() {
  /* ===================== STATE ===================== */
  const [sub, setSub] = useState(() => {
    const saved = localStorage.getItem(SUB_KEY);
    return saved ? JSON.parse(saved) : createDefaultSub();
  });

  const [showPay, setShowPay] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(sub.plan);
  const [method, setMethod] = useState("MTN MoMo");
  const [phone, setPhone] = useState(sub.phone || "");
  const [loading, setLoading] = useState(false);

  /* ===================== DATE LOGIC ===================== */
  const now = new Date();
  const expiry = new Date(sub.expiresAt);
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  const expired = expiry < now;
  const expiringSoon = !expired && daysLeft <= 5;

  /* ===================== AUTO-REDIRECT FLAG ===================== */
  useEffect(() => {
    if (expired) {
      localStorage.setItem(REDIRECT_KEY, "true");
      setSub(p => ({ ...p, status: "Expired" }));
    }
  }, [expired]);

  /* ===================== AUTO-RENEW ===================== */
  useEffect(() => {
    if (expired && sub.autoRenew && sub.plan !== "Free") {
      extendSubscription(sub.plan, sub.lastMethod || "MTN MoMo", true);
    }
  }, [expired]);

  /* ===================== PERSIST ===================== */
  useEffect(() => {
    localStorage.setItem(SUB_KEY, JSON.stringify(sub));
  }, [sub]);

  /* ===================== CORE EXTENSION LOGIC ===================== */
  const extendSubscription = (plan, paymentMethod, silent = false) => {
    const base = expiry > now ? expiry : now;
    const newExp = new Date(base);
    newExp.setDate(newExp.getDate() + 30);

    setSub({
      ...sub,
      plan,
      status: "Active",
      expiresAt: newExp.toISOString(),
      startDate: new Date().toISOString(),
      lastMethod: paymentMethod,
      phone
    });

    localStorage.removeItem(REDIRECT_KEY);

    if (!silent) setShowPay(false);
  };

  /* ===================== PAYMENT PLACEHOLDER ===================== */
  const initiatePayment = async () => {
    /**
     * 🔌 REAL INTEGRATION GOES HERE
     * - MTN MoMo API
     * - Orange Money API
     * - Paystack / Flutterwave
     *
     * Expected result:
     *   success === true
     */

    await new Promise(r => setTimeout(r, 900));
    return { success: true };
  };

  const handlePayNow = async () => {
    if (!phone) return alert("Enter phone number");
    if (selectedPlan === "Free") return alert("Select a paid plan");

    setLoading(true);

    const res = await initiatePayment();

    if (res.success) {
      extendSubscription(selectedPlan, method);
    }

    setLoading(false);
  };

  /* ===================== UI ===================== */
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Subscription & Billing</h2>

      {/* ALERTS */}
      {expired && (
        <Alert text="Your plan has expired. Payment required to restore access." color="red" />
      )}
      {expiringSoon && (
        <Alert text={`Plan expires in ${daysLeft} day(s). Renew early to avoid downtime.`} color="yellow" />
      )}

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card icon={<CreditCard />} label="Plan" value={sub.plan} />
        <Card icon={<CalendarDays />} label="Expiry" value={expiry.toDateString()} />
        <Card icon={<DollarSign />} label="Monthly Cost" value={fcfa(PLAN_PRICES[sub.plan])} />
        <Card icon={<Clock4 />} label="Status" value={sub.status} />
      </div>

      {/* AUTO RENEW */}
      <div className="bg-white p-5 rounded-xl shadow mb-8 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Auto-Renew</h3>
          <p className="text-sm text-gray-500">
            Automatically renew every 30 days (no interruption)
          </p>
        </div>
        <button
          onClick={() => setSub(p => ({ ...p, autoRenew: !p.autoRenew }))}
          className={`px-4 py-2 rounded-lg font-semibold ${
            sub.autoRenew ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          {sub.autoRenew ? "ON" : "OFF"}
        </button>
      </div>

      {/* FEATURES */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="font-semibold mb-4">Your Plan Unlocks</h3>
        {PLAN_FEATURES[sub.plan].map((f, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-500" size={18} /> {f}
          </div>
        ))}
        {sub.plan !== "Premium" && (
          <div className="mt-3 text-yellow-600 flex items-center gap-2">
            <Lock size={16} /> Some content locked
          </div>
        )}
      </div>

      {/* UPGRADE / RENEW BUTTON */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-6 rounded-xl shadow flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">
            {expired ? "Renew Required" : "Upgrade or Renew"}
          </h3>
          <p className="text-sm">
            Upgrade anytime or renew early with no downtime
          </p>
        </div>
        <button
          onClick={() => setShowPay(true)}
          className="bg-white text-indigo-600 px-5 py-2 rounded-xl font-semibold flex items-center gap-2"
        >
          {expired ? "Pay Now" : "Upgrade / Renew"} <ArrowUpRight size={16} />
        </button>
      </div>

      {/* PAYMENT MODAL */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Complete Payment</h3>
              <button onClick={() => setShowPay(false)}><X /></button>
            </div>

            <select
              className="w-full p-3 border rounded mb-3"
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value)}
            >
              {Object.keys(PLAN_PRICES).map(p => (
                <option key={p}>
                  {p} — {fcfa(PLAN_PRICES[p])}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {["MTN MoMo", "Orange Money"].map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`p-2 rounded border flex items-center justify-center gap-2 ${
                    method === m ? "bg-indigo-600 text-white" : ""
                  }`}
                >
                  <Smartphone size={16} /> {m}
                </button>
              ))}
            </div>

            <input
              className="w-full p-3 border rounded mb-4"
              placeholder="Phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />

            <button
              onClick={handlePayNow}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== SMALL UI ===================== */
const Card = ({ icon, label, value }) => (
  <div className="bg-white p-5 rounded-xl shadow flex gap-4 items-center">
    <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);

const Alert = ({ text, color }) => (
  <div
    className={`mb-6 p-4 rounded-xl border ${
      color === "red"
        ? "bg-red-50 border-red-200 text-red-700"
        : "bg-yellow-50 border-yellow-200 text-yellow-700"
    }`}
  >
    <AlertTriangle size={16} className="inline mr-2" />
    {text}
  </div>
);
