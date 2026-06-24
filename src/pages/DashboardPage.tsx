import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  Clock,
  UserCircle,
  Headphones,
  TrendingUp,
  Home,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const stagger = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const CountUp: React.FC<{ target: number; duration?: number }> = ({ target, duration = 1500 }) => {
  const [value, setValue] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return <>{formatCurrency(value)}</>;
};

const openTidio = () => {
  if (typeof window !== "undefined" && (window as any).tidioChatApi) {
    (window as any).tidioChatApi.open();
  }
};

const quickActions = [
  { label: "Send Money", Icon: ArrowRightLeft, path: "/transfer" },
  { label: "Transaction History", Icon: Clock, path: "/history" },
  { label: "My Profile", Icon: UserCircle, path: "/profile" },
  { label: "Support", Icon: Headphones, path: null, action: openTidio },
];

const cardQuickActionVariants = {
  initial: { opacity: 0, y: 16 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const txRowVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const stripVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.35, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const categoryIcon = (category: string) => {
  if (category === "income" || category === "admin credit") return { Icon: TrendingUp, bg: "bg-green-100", icon: "text-green-600" };
  if (category === "housing") return { Icon: Home, bg: "bg-amber-100", icon: "text-amber-600" };
  return { Icon: ArrowRightLeft, bg: "bg-lumio-primary/10", icon: "text-lumio-primary" };
};

interface TxRow {
  id: string;
  created_at: string;
  type: "credit" | "debit";
  amount: number;
  status: string;
  reference: string;
  category: string;
}

// ── Dashboard Sparkline ────────────────────────────────────────────────────────
function DashSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const width = 340; const height = 44;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height * 0.7) - height * 0.15;
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" overflow="visible">
      <defs>
        <linearGradient id="dsg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9A85C" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C9A85C" stopOpacity="1" />
        </linearGradient>
        <filter id="dglow"><feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke="url(#dsg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#C9A85C" filter="url(#dglow)" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="#fff" />
    </svg>
  );
}

const DashboardPage: React.FC = () => {
  const { user, userId, balance } = useApp();
  const navigate = useNavigate();
  const [masked, setMasked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [recentTxns, setRecentTxns] = useState<TxRow[]>([]);
  const [sparkData, setSparkData] = useState<{ v: number }[]>([{ v: 0 }]);

  useEffect(() => {
    if (!userId) return;

    const fetchTxns = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, created_at, type, amount, status, reference, category")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentTxns(data as TxRow[]);
    };

    fetchTxns();

    const channel = supabase
      .channel(`dashboard-txns-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, fetchTxns)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Build spark data from balance and recent transactions
  useEffect(() => {
    if (balance > 0) {
      setSparkData([
        { v: balance * 0.74 },
        { v: balance * 0.82 },
        { v: balance * 0.79 },
        { v: balance * 0.91 },
        { v: balance * 0.97 },
        { v: balance },
      ]);
    }
  }, [balance]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(user.accountNumber);
    toast("Account number copied");
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* Greeting */}
      {!dismissed && (
        <motion.div variants={fadeUp} className="bg-lumio-accent/10 border border-lumio-accent/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-foreground text-sm">Good morning, {user.firstName} 👋 — Here's your financial overview for today.</p>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
        </motion.div>
      )}

      {/* Row 1 — Premium Card */}
      <motion.div variants={fadeUp}>
        <div style={{
          background: "linear-gradient(135deg, #162035 0%, #1E3054 50%, #0F2345 100%)",
          borderRadius: 24,
          padding: "24px",
          border: "1px solid rgba(201,168,92,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(201,168,92,0.12)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Shimmer */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none",
            background: "repeating-linear-gradient(115deg, transparent 0%, transparent 48%, rgba(201,168,92,0.03) 49%, rgba(201,168,92,0.03) 51%, transparent 52%)",
          }} />

          {/* Card header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 28, background: "linear-gradient(135deg, #C9A85C 0%, #A8841A 100%)", borderRadius: 5, boxShadow: "0 2px 8px rgba(201,168,92,0.4)" }} />
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.15), transparent)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#C9A85C", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>{user.accountType}</p>
              <p style={{ fontSize: 10, color: "#B0BCCF", margin: "2px 0 0", letterSpacing: "0.06em" }}>PRIVATE BANKING</p>
            </div>
          </div>

          {/* Balance */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: "#B0BCCF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>Available Balance</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#C9A85C", alignSelf: "flex-start", marginTop: 6, fontFamily: "monospace" }}>£</span>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {masked ? "••••••" : <CountUp target={balance} />}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5EC48A", boxShadow: "0 0 0 3px rgba(94,196,138,0.25)", animation: "dashPulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: "#B0BCCF" }}>Live · updated in real time</span>
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ marginBottom: 16 }}>
            <DashSparkline data={sparkData.map(d => d.v)} />
          </div>

          {/* Card footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(201,168,92,0.12)", paddingTop: 14 }}>
            <div>
              <p style={{ fontSize: 9, color: "#B0BCCF", margin: "0 0 3px", letterSpacing: "0.08em" }}>CARDHOLDER</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{user.fullName}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 9, color: "#B0BCCF", margin: "0 0 3px", letterSpacing: "0.08em" }}>ACCOUNT NUMBER</p>
                <p style={{ fontSize: 13, color: "#B0BCCF", fontFamily: "monospace", margin: 0, letterSpacing: "0.12em" }}>
                  {masked ? "•••• ••••" : user.accountNumberMasked}
                </p>
              </div>
              <button onClick={() => setMasked(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#B0BCCF" }}>
                {masked ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes dashPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </motion.div>

      {/* Row 3 — Quick Actions */}
      <div>
        <p className="label-uppercase text-muted-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(({ label, Icon, path, action }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={cardQuickActionVariants}
              initial="initial"
              animate="animate"
              data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => action ? action() : navigate(path!)}
              className="group bg-white rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer"
              style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
                borderRadius: "12px",
                border: "1px solid transparent",
                transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
              }}
              whileHover={{
                y: -3,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                borderColor: "#C9963A",
              }}
              whileTap={{ scale: 0.97 }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "rgba(201,150,58,0.12)" }}
              >
                <Icon size={20} className="text-lumio-accent" />
              </div>
              <span className="text-[14px] font-medium text-lumio-primary text-center leading-tight font-sans">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Row 4 — Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-[20px] text-lumio-primary">Recent Transactions</h2>
          <button
            data-testid="link-view-all-transactions"
            onClick={() => navigate("/history")}
            className="text-lumio-accent text-[13px] hover:underline cursor-pointer"
          >
            View All →
          </button>
        </div>
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)", borderRadius: "12px" }}>
          {recentTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Clock size={28} className="opacity-40" />
              <span className="text-sm">No transactions yet</span>
            </div>
          ) : (
            <div>
              {recentTxns.map((tx, i) => {
                const { Icon, bg, icon } = categoryIcon(tx.category);
                const isCredit = tx.type === "credit";
                const formattedDate = format(new Date(tx.created_at), "d MMM yyyy");
                return (
                  <motion.div
                    key={tx.id}
                    custom={i}
                    variants={txRowVariants}
                    initial="initial"
                    animate="animate"
                    data-testid={`transaction-row-${tx.id}`}
                    onClick={() => navigate("/history")}
                    className="flex items-center gap-4 py-4 cursor-pointer rounded-lg px-2 -mx-2 transition-colors hover:bg-lumio-accent/[0.04]"
                    style={i < recentTxns.length - 1 ? { borderBottom: "1px solid #E5E7EB" } : {}}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon size={16} className={icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-lumio-primary truncate">{tx.reference}</p>
                      <p className="text-[12px] text-muted-foreground">{formattedDate}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[15px] font-bold ${isCredit ? "text-lumio-success" : "text-lumio-error"}`}>
                        {isCredit ? "▲" : "▼"} £{tx.amount.toLocaleString("en-GB")}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                          tx.status === "successful"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {tx.status === "successful" ? "Successful" : "Pending"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 5 — Account Summary Strip */}
      <motion.div
        variants={stripVariants}
        initial="initial"
        animate="animate"
        className="rounded-xl p-6"
        style={{ background: "#F7F8FA", borderRadius: "12px" }}
      >
        <div className="flex flex-col md:flex-row md:divide-x md:divide-gray-200 gap-6 md:gap-0">
          <div className="flex-1 md:pr-6">
            <p className="label-uppercase text-muted-foreground mb-1">Account Number</p>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-lumio-primary font-mono">{user.accountNumberMasked}</span>
              <button
                data-testid="button-copy-account-number"
                onClick={handleCopyAccount}
                className="text-lumio-accent hover:text-lumio-accent-light transition-colors"
                title="Copy account number"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          <div className="flex-1 md:px-6">
            <p className="label-uppercase text-muted-foreground mb-1">Account Type</p>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-lumio-primary">{user.accountType}</span>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(201,150,58,0.12)", color: "#C9963A" }}
              >
                ● Active
              </span>
            </div>
          </div>

          <div className="flex-1 md:pl-6">
            <p className="label-uppercase text-muted-foreground mb-1">Member Since</p>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-lumio-primary">{user.memberSince}</span>
              {user.kycVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 size={9} /> KYC Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default DashboardPage;
