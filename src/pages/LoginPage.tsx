import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, Fingerprint } from "lucide-react";
import LumioLogo from "@/components/LumioLogo";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

function useTawkWidget() {
  useEffect(() => {
    if (document.getElementById("tawk-script")) return;
    const s1 = document.createElement("script");
    s1.id = "tawk-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/6a3aa832452f781d473b573b/1jrqi2264";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    document.body.appendChild(s1);
  }, []);
}

const ADMIN_EMAIL = "admin@lumiobank.co.uk";
// Accept the password in any case variation
const isAdminPassword = (p: string) =>
  p.trim().toLowerCase() === "lumio@admin2019";

const LoginPage: React.FC = () => {
  useTawkWidget();
  const navigate = useNavigate();
  const { setIsLoggedIn, setIsAdmin, setUser, setBalance, setUserId, setUserStatus, setTransferPin } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuspended(false);

    const emailLower = email.trim().toLowerCase();

    // Admin login — case-insensitive password match
    if (emailLower === ADMIN_EMAIL.toLowerCase() && isAdminPassword(password)) {
      setLoading(true);
      setTimeout(() => {
        setIsAdmin(true);
        navigate("/admin");
      }, 1500);
      return;
    }

    setLoading(true);

    try {
      const { data: dbUsers, error: dbError } = await supabase
        .from("users")
        .select("*")
        .ilike("email", emailLower)
        .eq("password", password)
        .limit(1);

      if (dbError) {
        console.error("Supabase login error:", dbError);
        setLoading(false);
        setError("Unable to reach the database. Please try again later.");
        return;
      }

      if (dbUsers === null) {
        setLoading(false);
        setError("Unable to reach the database. Please try again later.");
        return;
      }

      if (dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        if (dbUser.status === "suspended") {
          setLoading(false);
          setSuspended(true);
          return;
        }
        const fullName = `${dbUser.first_name} ${dbUser.last_name}`;
        setUser({
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          fullName,
          initials: `${dbUser.first_name?.[0] || ""}${dbUser.last_name?.[0] || ""}`.toUpperCase(),
          avatarUrl: dbUser.avatar_url || null,
          dateOfBirth: dbUser.date_of_birth || "",
          gender: dbUser.gender || "",
          maritalStatus: dbUser.marital_status || "",
          occupation: dbUser.occupation || "",
          address: dbUser.address || "",
          phone: dbUser.phone || "",
          email: dbUser.email,
          accountNumber: dbUser.account_number || "",
          accountNumberMasked: dbUser.account_number ? `**** **** ${dbUser.account_number.slice(-4)}` : "",
          accountType: dbUser.account_type || "Lumio Premier",
          memberSince: new Date(dbUser.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
          kycVerified: dbUser.kyc_status === "verified",
        });
        setBalance(Number(dbUser.balance) || 0);
        setUserId(dbUser.id);
        setUserStatus(dbUser.status || "active");
        setTransferPin(dbUser.transfer_pin || "");

        // Log login alert (non-blocking)
        supabase.from("admin_alerts").insert({ type: "user_login", message: `User ${fullName} logged in` });

        setTimeout(() => {
          setIsLoggedIn(true);
          navigate("/dashboard");
        }, 800);
        return;
      }

      setLoading(false);
      setError("Invalid email or password. Please try again.");
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      setError("Unable to reach the database. Please check your connection or contact support.");
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-lg border text-base transition-all bg-white text-foreground focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-400 ring-red-200 focus:border-red-400 focus:ring-red-200"
        : "border-border focus-gold"
    }`;

  return (
    <div className="flex" style={{ height: "100svh", maxHeight: "100svh", overflow: "hidden" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: "#0A1628" }}>

        <div className="absolute inset-0 animate-diagonal"
          style={{
            background: "linear-gradient(135deg, rgba(27,58,107,0.5) 0%, transparent 50%, rgba(201,150,58,0.08) 100%)",
            backgroundSize: "200% 200%",
          }}
        />

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
      <div className="flex-1 flex items-start justify-center p-6 pt-16 lg:p-12 lg:items-center bg-white overflow-y-auto">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lg:hidden mb-8">
            <LumioLogo variant="dark" size="lg" />
          </div>
          <div className="hidden lg:block mb-8">
            <LumioLogo variant="dark" size="sm" />
          </div>

          <h2 className="font-serif text-2xl text-foreground mb-8">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); setSuspended(false); }}
                placeholder=""
                autoComplete="email"
                className={fieldClass(!!error || suspended)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); setSuspended(false); }}
                  autoComplete="current-password"
                  className={`${fieldClass(!!error || suspended)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 font-medium"
              >
                {error}
              </motion.p>
            )}

            {suspended && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm"
              >
                <p className="font-semibold text-red-700 mb-1">Account Suspended</p>
                <p className="text-red-600">
                  Your account has been suspended please kindly contact customer support for more info.
                </p>
              </motion.div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border accent-lumio-accent"
                />
                Remember this device
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-lumio-accent hover:text-lumio-accent-light transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              data-testid="button-sign-in"
              type="submit"
              disabled={loading || suspended}
              className="w-full py-3.5 rounded-lg bg-lumio-accent text-white font-medium text-base transition-all hover:bg-lumio-accent-light gold-glow-hover disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-lumio-accent hover:text-lumio-accent-light transition-colors font-medium">
              Register →
            </Link>
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default LoginPage;
