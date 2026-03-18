import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, Fingerprint } from "lucide-react";
import LumioLogo from "@/components/LumioLogo";
import { useApp } from "@/context/AppContext";

const VALID_EMAIL = "Kyuminlee@hotmail.com";
const VALID_PASSWORD = "Limitless2019$";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    const emailMatch = email.trim().toLowerCase() === VALID_EMAIL.toLowerCase();
    const passwordMatch = password === VALID_PASSWORD;

    if (!emailMatch || !passwordMatch) {
      setError(true);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      navigate("/dashboard");
    }, 1500);
  };

  const fieldClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-lg border text-sm transition-all bg-white text-foreground focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-400 ring-red-200 focus:border-red-400 focus:ring-red-200"
        : "border-border focus-gold"
    }`;

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: "#0A1628" }}>

        {/* Diagonal gradient animation */}
        <div className="absolute inset-0 animate-diagonal"
          style={{
            background: "linear-gradient(135deg, rgba(27,58,107,0.5) 0%, transparent 50%, rgba(201,150,58,0.08) 100%)",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Decorative gold circles */}
        <div className="absolute" style={{ top: "18%", right: "18%", width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <div className="absolute" style={{ top: "22%", right: "22%", width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <div className="absolute" style={{ bottom: "20%", left: "14%", width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <div className="absolute" style={{ bottom: "26%", left: "20%", width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />

        <motion.div
          className="relative z-10 text-center max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <LumioLogo variant="light" size="lg" />

          <h1 className="font-serif text-[48px] leading-tight text-white mt-10 mb-4 tracking-tight">
            Welcome back.
          </h1>
          <p className="text-white/50 text-base mb-12">
            Log in to access your Lumio account securely.
          </p>

          <div className="flex justify-center gap-8 text-[12px] text-white/40">
            <span className="flex items-center gap-1.5">
              <Lock size={12} /> 256-bit SSL
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={12} /> FCA Regulated
            </span>
            <span className="flex items-center gap-1.5">
              <Fingerprint size={12} /> 2FA Ready
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <LumioLogo variant="dark" size="lg" />
          </div>

          {/* Desktop compact logo */}
          <div className="hidden lg:block mb-8">
            <LumioLogo variant="dark" size="sm" />
          </div>

          <h2 className="font-serif text-2xl text-foreground mb-8">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                placeholder=""
                autoComplete="email"
                className={fieldClass(error)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  autoComplete="current-password"
                  className={`${fieldClass(error)} pr-11`}
                />
                <button
                  type="button"
                  data-testid="button-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                data-testid="text-login-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 font-medium"
              >
                Invalid email or password. Please try again.
              </motion.p>
            )}

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                <input
                  data-testid="input-remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border accent-lumio-accent"
                />
                Remember this device
              </label>
              <a
                href="#"
                data-testid="link-forgot-password"
                onClick={(e) => e.preventDefault()}
                className="text-lumio-accent hover:text-lumio-accent-light transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              data-testid="button-sign-in"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-lumio-accent text-white font-medium text-base transition-all hover:bg-lumio-accent-light gold-glow-hover disabled:opacity-60 flex items-center justify-center gap-2 h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            New to Lumio?{" "}
            <Link to="/" className="text-lumio-accent hover:text-lumio-accent-light transition-colors">
              Open an account →
            </Link>
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default LoginPage;
