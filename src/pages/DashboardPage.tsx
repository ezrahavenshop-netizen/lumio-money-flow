import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  Wifi,
  ArrowRightLeft,
  Clock,
  CreditCard,
  UserCircle,
  TrendingUp,
  Home,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";

const sparkData = [
  { v: 2800000 }, { v: 3100000 }, { v: 2950000 }, { v: 3400000 }, { v: 3600000 }, { v: 3750000 },
];

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

const quickActions = [
  { label: "Send Money", Icon: ArrowRightLeft, path: "/transfer" },
  { label: "Transaction History", Icon: Clock, path: "/history" },
  { label: "My Cards", Icon: CreditCard, path: "/dashboard/cards" },
  { label: "My Profile", Icon: UserCircle, path: "/profile" },
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
  if (category === "income") return { Icon: TrendingUp, bg: "bg-green-100", icon: "text-green-600" };
  if (category === "housing") return { Icon: Home, bg: "bg-amber-100", icon: "text-amber-600" };
  return { Icon: ArrowRightLeft, bg: "bg-lumio-primary/10", icon: "text-lumio-primary" };
};

const DashboardPage: React.FC = () => {
  const { user, balance, transactions } = useApp();
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });

  const recentTxns = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

      {/* Row 1 — Premier Card */}
      <motion.div variants={fadeUp}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative overflow-hidden rounded-2xl p-8 aspect-[1.586/1] max-h-[280px] w-full"
          style={{
            background: "linear-gradient(135deg, #1B3A6B 0%, #0A1628 50%, #1B3A6B 100%)",
            transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-lumio-accent to-lumio-accent-light opacity-80" />
              <span className="font-serif text-lumio-accent text-sm">Lumio Premier</span>
            </div>
            <div>
              <p className="text-primary-foreground/90 font-serif text-lg mb-1">{user.fullName}</p>
              <p className="text-primary-foreground/50 text-sm font-mono tracking-[0.2em] mb-3">{user.accountNumberMasked}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-primary-foreground/40 text-[10px] uppercase tracking-wider mb-0.5">Valid Thru</p>
                  <p className="text-primary-foreground/70 text-sm">03/29</p>
                </div>
                <p className="text-primary-foreground font-serif text-2xl md:text-3xl">
                  <CountUp target={balance} />
                </p>
              </div>
            </div>
            <div className="absolute bottom-6 right-8">
              <Wifi size={20} className="text-primary-foreground/30 rotate-90" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Row 2 — Balance + Sparkline */}
      <motion.div variants={fadeUp} className="glass-card-light p-8 border-t-2 border-t-lumio-accent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="label-uppercase text-muted-foreground mb-2">Available Balance</p>
            <p className="font-serif text-4xl md:text-5xl text-lumio-primary tabular-nums">
              <CountUp target={balance} />
            </p>
            <p className="text-muted-foreground text-[13px] mt-1">Last updated: Today, 14:32 GMT</p>
          </div>
          <div className="w-48 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke="#C9963A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Row 3 — Quick Actions */}
      <div>
        <p className="label-uppercase text-muted-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(({ label, Icon, path }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={cardQuickActionVariants}
              initial="initial"
              animate="animate"
              data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => navigate(path)}
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
                const formattedDate = format(new Date(tx.date), "d MMM yyyy");
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

          {/* Account Number */}
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

          {/* Account Type */}
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

          {/* Member Since */}
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
