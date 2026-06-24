import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle, ArrowRight, Star, Menu, X, Smartphone, TrendingUp, Clock, Headphones, CreditCard, PiggyBank, Eye, EyeOff } from "lucide-react";
import LumioLogo from "@/components/LumioLogo";

// ── Sparkline ──────────────────────────────────────────────────────────────────
const sparkData = [412000, 418500, 410200, 425000, 430100, 440800, 438000, 450732];
function Sparkline({ data, width = 280, height = 44 }: { data: number[]; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * (height * 0.7) - height * 0.15;
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C9A85C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C9A85C" stopOpacity="1" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke="url(#sg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#C9A85C" filter="url(#glow)" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="#ffffff" />
    </svg>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────────
function Counter({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val.toLocaleString("en-GB")}</>;
}

// ── Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      padding: "8px 14px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(201,168,92,0.18)",
      borderRadius: 10,
      minWidth: 90,
    }}>
      <span style={{ fontSize: 10, color: "#B0BCCF", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: positive ? "#5EC48A" : "#E07070", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-card/95 backdrop-blur-md shadow-md border-b border-border" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <LumioLogo variant={scrolled ? "dark" : "light"} />
        <div className="hidden md:flex items-center gap-8">
          {["Personal", "Business", "Wealth", "About", "Contact"].map((item) =>
          <a key={item} href="#" className={`text-sm font-sans font-medium transition-colors ${scrolled ? "text-foreground/70 hover:text-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}>
              {item}
            </a>
          )}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className={`text-[11px] ${scrolled ? "text-muted-foreground" : "text-primary-foreground/50"} flex items-center gap-1`}>
            <Lock size={10} /> FCA Authorised
          </span>
          <Link to="/login" className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all ${scrolled ? "border-lumio-primary text-lumio-primary hover:bg-lumio-primary hover:text-primary-foreground" : "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"}`}>
            Log In
          </Link>
          <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-lg bg-lumio-accent text-accent-foreground hover:bg-lumio-accent-light transition-all gold-glow-hover">
            Open Account
          </Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          {mobileOpen ? <X className={scrolled ? "text-foreground" : "text-primary-foreground"} /> : <Menu className={scrolled ? "text-foreground" : "text-primary-foreground"} />}
        </button>
      </div>
      {mobileOpen &&
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-lumio-dark/98 backdrop-blur-xl fixed inset-0 top-16 z-50 flex flex-col items-center justify-center gap-6">
          {["Personal", "Business", "Wealth", "About", "Contact"].map((item) =>
        <a key={item} href="#" className="text-primary-foreground text-xl font-serif">{item}</a>
        )}
          <Link to="/login" className="text-lg px-6 py-3 rounded-lg bg-lumio-accent text-accent-foreground" onClick={() => setMobileOpen(false)}>Log In</Link>
        </motion.div>
      }
    </nav>);

};

const HeroSection = () => {
  const [masked, setMasked] = useState(false);
  return (
    <section className="relative min-h-screen bg-lumio-dark flex items-center overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-lumio-accent/10 blur-[200px] animate-gold-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-5 gap-12 items-center">
        {/* ── Left: text ── */}
        <motion.div className="lg:col-span-3" variants={stagger} initial="initial" animate="animate">
          <motion.p variants={fadeUp} className="label-uppercase text-lumio-accent mb-6">
            Trusted by 50,000+ customers across the UK
          </motion.p>
          <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-6xl lg:text-[64px] text-primary-foreground leading-[1.1] tracking-tight mb-6" style={{ textWrap: "balance" } as React.CSSProperties}>
            The smarter way to bank — anytime, anywhere.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-base text-primary-foreground/60 max-w-[520px] mb-8 leading-relaxed">
            Lumio gives you full control of your finances with instant transfers, real-time notifications, and the security of a fully regulated UK bank.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 mb-10">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-lumio-accent text-accent-foreground font-medium text-base transition-all hover:bg-lumio-accent-light gold-glow-hover">
              Open an Account
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium transition-colors">
              See How It Works <ArrowRight size={16} />
            </a>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-6 text-[13px] text-primary-foreground/50">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-lumio-accent" /> FCA Regulated</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-lumio-accent" /> FSCS Protected up to £85,000</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-lumio-accent" /> 256-bit SSL</span>
          </motion.div>
        </motion.div>

        {/* ── Right: premium card ── */}
        <motion.div
          className="lg:col-span-2 flex justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="animate-float w-full max-w-[340px]" style={{
            background: "linear-gradient(135deg, #162035 0%, #1E3054 50%, #0F2345 100%)",
            borderRadius: 24,
            padding: "24px",
            border: "1px solid rgba(201,168,92,0.25)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(201,168,92,0.12)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Shimmer lines */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none",
              background: "repeating-linear-gradient(115deg, transparent 0%, transparent 48%, rgba(201,168,92,0.03) 49%, rgba(201,168,92,0.03) 51%, transparent 52%)",
            }} />

            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Chip */}
                <div style={{ width: 36, height: 28, background: "linear-gradient(135deg, #C9A85C 0%, #A8841A 100%)", borderRadius: 5, boxShadow: "0 2px 8px rgba(201,168,92,0.4)" }} />
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.15), transparent)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#C9A85C", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>Lumio Premier</p>
                <p style={{ fontSize: 10, color: "#B0BCCF", margin: "2px 0 0", letterSpacing: "0.06em" }}>PRIVATE BANKING</p>
              </div>
            </div>

            {/* Balance */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: "#B0BCCF", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>Available Balance</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#C9A85C", alignSelf: "flex-start", marginTop: 8, fontFamily: "monospace" }}>£</span>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {masked ? "••••••" : <Counter target={450732} duration={1400} />}
                </span>
                <span style={{ fontSize: 17, fontWeight: 400, color: "#B0BCCF", marginBottom: 4 }}>.00</span>
              </div>
              {/* Live dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5EC48A", boxShadow: "0 0 0 3px rgba(94,196,138,0.25)", animation: "heroPulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, color: "#B0BCCF" }}>Live · updated in real time</span>
              </div>
            </div>

            {/* Sparkline */}
            <div style={{ marginBottom: 16, marginLeft: -4 }}>
              <Sparkline data={sparkData} width={300} height={44} />
            </div>

            {/* Stat pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
              <StatPill label="Month gain" value="+£9,732" positive={true} />
              <StatPill label="Spent today" value="−£1,240" positive={false} />
              <StatPill label="Saved" value="+£3,400" positive={true} />
            </div>

            {/* Card footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(201,168,92,0.12)", paddingTop: 14 }}>
              <div>
                <p style={{ fontSize: 9, color: "#B0BCCF", margin: "0 0 3px", letterSpacing: "0.08em" }}>CARDHOLDER</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>Lumio Client</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 9, color: "#B0BCCF", margin: "0 0 3px", letterSpacing: "0.08em" }}>CARD NUMBER</p>
                  <p style={{ fontSize: 13, color: "#B0BCCF", fontFamily: "monospace", margin: 0, letterSpacing: "0.12em" }}>
                    {masked ? "•••• •••• ••••" : "**** **** 8812"}
                  </p>
                </div>
                <button
                  onClick={() => setMasked(m => !m)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#B0BCCF" }}
                  title={masked ? "Show balance" : "Hide balance"}
                >
                  {masked ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
};

const features = [
{ icon: ArrowRight, title: "Instant Transfers", desc: "Send money to any UK or global bank in seconds" },
{ icon: CreditCard, title: "Smart Cards", desc: "Virtual and physical cards with real-time controls" },
{ icon: PiggyBank, title: "Savings Vaults", desc: "Separate pots for your goals with interest" },
{ icon: TrendingUp, title: "Investment Hub", desc: "Grow your wealth with curated portfolios" },
{ icon: Headphones, title: "24/7 Support", desc: "Live chat and phone support around the clock" },
{ icon: Shield, title: "Business Accounts", desc: "Dedicated tools for directors and teams" }];


const FeaturesSection = () =>
<section id="features" className="bg-lumio-surface py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div className="text-center mb-16" initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        <motion.p variants={fadeUp} className="label-uppercase text-lumio-accent mb-3">What We Offer</motion.p>
        <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">Everything you need. Nothing you don't.</motion.h2>
      </motion.div>
      <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        {features.map((f) =>
      <motion.div key={f.title} variants={fadeUp} className="glass-card-light p-8 group hover:-translate-y-0.5 transition-all duration-200 hover:border-l-2 hover:border-l-lumio-accent">
            <f.icon className="text-lumio-accent mb-4" size={28} />
            <h3 className="font-serif text-xl text-foreground mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
      )}
      </motion.div>
    </div>
  </section>;


const HowItWorks = () =>
<section className="bg-card py-24 lg:py-32">
    <div className="max-w-5xl mx-auto px-6">
      <motion.div className="text-center mb-16" initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">Up and running in minutes.</motion.h2>
      </motion.div>
      <motion.div className="grid md:grid-cols-3 gap-12 relative" initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        <div className="hidden md:block absolute top-8 left-[16.7%] right-[16.7%] h-0.5 border-t-2 border-dashed border-lumio-accent/30" />
        {[
      { n: 1, title: "Create your account", desc: "ID verified online in 2 minutes" },
      { n: 2, title: "Fund your account", desc: "Deposit from any UK bank instantly" },
      { n: 3, title: "Start banking", desc: "Transfer, save, invest — all in one place" }].
      map((s) =>
      <motion.div key={s.n} variants={fadeUp} className="text-center relative">
            <div className="w-14 h-14 rounded-full bg-lumio-accent text-accent-foreground font-serif text-xl flex items-center justify-center mx-auto mb-4 relative z-10">{s.n}</div>
            <h3 className="font-serif text-xl text-foreground mb-2">{s.title}</h3>
            <p className="text-muted-foreground text-sm">{s.desc}</p>
          </motion.div>
      )}
      </motion.div>
    </div>
  </section>;


const SecuritySection = () =>
<section className="bg-lumio-dark py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
      <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        <motion.p variants={fadeUp} className="label-uppercase text-lumio-accent mb-3">Bank-Grade Security</motion.p>
        <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-primary-foreground tracking-tight mb-6">Your money is protected. Always.</motion.h2>
        <motion.p variants={fadeUp} className="text-primary-foreground/60 mb-8 leading-relaxed">
          Your data is encrypted with 256-bit SSL. We use two-factor authentication, biometric verification, and FSCS protection up to £85,000 per eligible depositor.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
          {["256-bit Encryption", "Two-Factor Auth", "FSCS Protected"].map((b) =>
        <div key={b} className="flex items-center gap-2 glass-card px-4 py-3">
              <Shield size={16} className="text-lumio-accent" />
              <span className="text-primary-foreground text-sm">{b}</span>
            </div>
        )}
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <div className="absolute inset-0 rounded-2xl border-2 border-lumio-accent/20 rotate-12" />
          <div className="absolute inset-4 rounded-2xl border-2 border-lumio-accent/30 -rotate-6" />
          <div className="absolute inset-8 rounded-2xl bg-lumio-accent/10 flex items-center justify-center">
            <Lock size={48} className="text-lumio-accent" />
          </div>
        </div>
      </motion.div>
    </div>
  </section>;


const testimonials = [
{ quote: "Switching to Lumio was the best financial decision I've made. Transfers are instant and the dashboard is genuinely beautiful.", name: "Sarah M.", role: "Freelance Designer, London", initials: "SM" },
{ quote: "As a director managing business and personal accounts, Lumio gives me exactly the oversight I need.", name: "David K.", role: "Operations Director, Manchester", initials: "DK" },
{ quote: "FSCS protection plus a slick app? This is what banking should have always been.", name: "Priya T.", role: "Senior Analyst, Birmingham", initials: "PT" }];


const TestimonialsSection = () =>
<section className="bg-lumio-surface py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6">
      <motion.h2 initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeUp} className="font-serif text-3xl md:text-4xl text-foreground text-center mb-16 tracking-tight">Trusted by thousands.</motion.h2>
      <motion.div className="grid md:grid-cols-3 gap-6" initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        {testimonials.map((t) =>
      <motion.div key={t.name} variants={fadeUp} className="glass-card-light p-8">
            <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-lumio-accent fill-lumio-accent" />)}</div>
            <p className="text-foreground text-sm leading-relaxed mb-6">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lumio-primary flex items-center justify-center font-serif text-sm text-primary-foreground">{t.initials}</div>
              <div>
                <p className="text-foreground text-sm font-medium">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.role}</p>
              </div>
            </div>
          </motion.div>
      )}
      </motion.div>
    </div>
  </section>;


const AppDownload = () =>
<section className="bg-gradient-to-b from-lumio-primary to-lumio-dark py-24 lg:py-32">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
        <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-primary-foreground tracking-tight mb-4">Take Lumio everywhere.</motion.h2>
        <motion.p variants={fadeUp} className="text-primary-foreground/60 mb-8">Download the app and manage your finances on the go.</motion.p>
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary-foreground/20 transition-colors">
            <Smartphone size={18} /> App Store
          </button>
          <button className="px-6 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary-foreground/20 transition-colors">
            <Smartphone size={18} /> Google Play
          </button>
        </motion.div>
      </motion.div>
    </div>
  </section>;


const Footer = () =>
<footer className="bg-lumio-dark py-16 border-t border-primary-foreground/5">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div>
          <LumioLogo variant="light" size="lg" />
          <p className="text-primary-foreground/40 text-sm mt-3 leading-relaxed">The smarter way to bank — anytime, anywhere.</p>
        </div>
        {[
      { title: "Products", links: ["Personal", "Business", "Wealth", "Cards"] },
      { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
      { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Complaints"] }].
      map((col) =>
      <div key={col.title}>
            <h4 className="text-primary-foreground text-sm font-medium mb-4">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((l) =>
          <li key={l}><a href="#" className="text-primary-foreground/40 hover:text-primary-foreground/70 text-sm transition-colors">{l}</a></li>
          )}
            </ul>
          </div>
      )}
      </div>
      <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-primary-foreground/30 text-xs">© 2025 Lumio Ltd. FCA Authorised. FSCS Protected. Registered in England & Wales.</p>
        <div className="flex gap-4 text-primary-foreground/30">
          {["LinkedIn", "X", "Instagram"].map((s) =>
        <a key={s} href="#" className="text-xs hover:text-primary-foreground/60 transition-colors">{s}</a>
        )}
        </div>
      </div>
    </div>
  </footer>;


const LandingPage: React.FC = () =>
<motion.div variants={pageVariants} initial="initial" animate="animate">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <HowItWorks />
    <SecuritySection />
    <TestimonialsSection />
    <AppDownload />
    <Footer />
  </motion.div>;


export default LandingPage;