import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, Fingerprint } from "lucide-react";
import LumioLogo from "@/components/LumioLogo";
import { useApp } from "@/context/AppContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useApp();
  const [email, setEmail] = useState("Kyuminlee@hotmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-lumio-dark relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-lumio-primary/20 via-transparent to-lumio-accent/5 animate-diagonal" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full border border-lumio-accent/8" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full border border-lumio-accent/8" />

        <motion.div className="relative z-10 text-center max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <LumioLogo variant="light" size="lg" />
          <h1 className="font-serif text-4xl md:text-5xl text-primary-foreground mt-8 mb-4 tracking-tight">Welcome back.</h1>
          <p className="text-primary-foreground/50 text-base mb-10">Log in to access your Lumio account securely.</p>
          <div className="flex justify-center gap-6 text-[12px] text-primary-foreground/40">
            <span className="flex items-center gap-1.5"><Lock size={12} /> 256-bit SSL</span>
            <span className="flex items-center gap-1.5"><Shield size={12} /> FCA Regulated</span>
            <span className="flex items-center gap-1.5"><Fingerprint size={12} /> 2FA Ready</span>
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-card">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="lg:hidden mb-8">
            <LumioLogo variant="dark" size="lg" />
          </div>

          <h2 className="font-serif text-2xl text-foreground mb-8">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus-gold transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus-gold transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                Remember this device
              </label>
              <a href="#" className="text-lumio-accent hover:text-lumio-accent-light transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-lumio-accent text-accent-foreground font-medium text-base transition-all hover:bg-lumio-accent-light gold-glow-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-xs">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Google</button>
            <button className="py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Apple</button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to Lumio? <Link to="/" className="text-lumio-accent hover:text-lumio-accent-light transition-colors">Open an account →</Link>
          </p>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-4">Demo mode — any password will grant access</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
