import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Wifi } from "lucide-react";
import { useApp } from "@/context/AppContext";

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

const DashboardPage: React.FC = () => {
  const { user, balance } = useApp();
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

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-8">
      {/* Greeting */}
      {!dismissed && (
        <motion.div variants={fadeUp} className="bg-lumio-accent/10 border border-lumio-accent/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-foreground text-sm">Good morning, {user.firstName} 👋 — Here's your financial overview for today.</p>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
        </motion.div>
      )}

      {/* Premier Card */}
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
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              {/* Gold chip */}
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

      {/* Balance + Sparkline */}
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
    </motion.div>
  );
};

export default DashboardPage;
