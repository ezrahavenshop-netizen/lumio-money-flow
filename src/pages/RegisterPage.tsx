import React, { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Fingerprint, Eye, EyeOff, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import LumioLogo from "@/components/LumioLogo";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const genAccountNumber = () => String(Math.floor(10000000 + Math.random() * 90000000));

const fieldBase =
  "w-full px-4 py-3 rounded-lg border text-base bg-white text-foreground transition-all focus:outline-none focus:ring-2";
const fieldOk = `${fieldBase} border-border focus:border-lumio-accent focus:ring-lumio-accent/20`;
const fieldErr = `${fieldBase} border-red-400 focus:border-red-400 focus:ring-red-200`;
const fieldSuccess = `${fieldBase} border-green-400 focus:border-green-400 focus:ring-green-100`;

type StepId = 1 | 2 | 3 | 4;

interface FormState {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  address: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  pin: string[];
  confirm_pin: string[];
}

const initForm = (): FormState => ({
  first_name: "", last_name: "", date_of_birth: "", gender: "",
  marital_status: "", occupation: "", address: "", email: "",
  phone: "", password: "", confirm_password: "",
  pin: ["", "", "", ""],
  confirm_pin: ["", "", "", ""],
});

const STEPS = ["Personal", "Contact", "Security", "Done"] as const;

function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  return { level: score as 0|1|2|3|4, label: labels[score], color: colors[score] };
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser, setBalance, setUserId, setUserStatus, setTransferPin } = useApp();

  const [step, setStep] = useState<StepId>(1);
  const [form, setForm] = useState<FormState>(initForm());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "pin" | "confirm_pin", string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");

  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const confirmPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePinInput = (
    idx: number,
    val: string,
    arr: string[],
    field: "pin" | "confirm_pin",
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...arr];
    next[idx] = val;
    setForm((prev) => ({ ...prev, [field]: next }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (val && idx < 3) refs[idx + 1].current?.focus();
  };

  const handlePinKey = (
    e: React.KeyboardEvent,
    idx: number,
    arr: string[],
    field: "pin" | "confirm_pin",
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (e.key === "Backspace" && !arr[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.marital_status) e.marital_status = "Marital status is required";
    if (!form.occupation.trim()) e.occupation = "Occupation is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = async () => {
    const e: typeof errors = {};
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    } else {
      setEmailChecking(true);
      const { data } = await supabase.from("users").select("id").ilike("email", form.email.trim()).limit(1);
      setEmailChecking(false);
      if (data && data.length > 0) {
        e.email = "An account with this email already exists.";
        setEmailTaken(true);
      } else {
        setEmailTaken(false);
      }
    }
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: typeof errors = {};
    if (!form.password) {
      e.password = "Password is required";
    } else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(form.password)) {
      e.password = "Must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(form.password)) {
      e.password = "Must contain at least one number";
    } else if (!/[^A-Za-z0-9]/.test(form.password)) {
      e.password = "Must contain at least one special character";
    }
    if (!form.confirm_password) {
      e.confirm_password = "Please confirm your password";
    } else if (form.password !== form.confirm_password) {
      e.confirm_password = "Passwords do not match";
    }
    const pinStr = form.pin.join("");
    if (pinStr.length < 4) e.pin = "PIN must be exactly 4 digits";
    const confirmPinStr = form.confirm_pin.join("");
    if (confirmPinStr.length < 4) {
      e.confirm_pin = "Please confirm your PIN";
    } else if (pinStr !== confirmPinStr) {
      e.confirm_pin = "PINs do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) {
      const ok = await validateStep2();
      if (ok) setStep(3);
    } else if (step === 3) {
      const ok = validateStep3();
      if (ok) await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const accNum = genAccountNumber();
    const pin = form.pin.join("");
    const now = new Date().toISOString();

    const { data, error } = await supabase.from("users").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      marital_status: form.marital_status,
      occupation: form.occupation.trim(),
      address: form.address.trim(),
      account_number: accNum,
      account_type: "Lumio Standard",
      balance: 0,
      transfer_pin: pin,
      kyc_status: "pending",
      status: "active",
      created_at: now,
    }).select().single();

    if (error || !data) {
      toast.error("Registration failed. Please try again.");
      setSubmitting(false);
      return;
    }

    const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`;
    await supabase.from("admin_alerts").insert({ type: "user_created", message: `New user registered — ${fullName}` });

    setAccountNumber(accNum);
    setSubmitting(false);
    setStep(4);

    setUser({
      firstName: form.first_name.trim(),
      lastName: form.last_name.trim(),
      fullName,
      initials: `${form.first_name[0] || ""}${form.last_name[0] || ""}`.toUpperCase(),
      avatarUrl: null,
      dateOfBirth: form.date_of_birth,
      gender: form.gender,
      maritalStatus: form.marital_status,
      occupation: form.occupation.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: data.email,
      accountNumber: accNum,
      accountNumberMasked: `**** **** ${accNum.slice(-4)}`,
      accountType: "Lumio Standard",
      memberSince: new Date(now).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      kycVerified: false,
    });
    setBalance(0);
    setUserId(data.id);
    setUserStatus("active");
    setTransferPin(pin);
  };

  const goToDashboard = () => {
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  const strength = getPasswordStrength(form.password);

  const stepPanel = (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={errors.first_name ? fieldErr : fieldOk} />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Last Name <span className="text-red-500">*</span></label>
              <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={errors.last_name ? fieldErr : fieldOk} />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
            <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={errors.date_of_birth ? fieldErr : fieldOk} />
            {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Gender <span className="text-red-500">*</span></label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={errors.gender ? fieldErr : fieldOk}>
              <option value="">Select…</option>
              {["Male", "Female", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Marital Status <span className="text-red-500">*</span></label>
            <select value={form.marital_status} onChange={(e) => set("marital_status", e.target.value)} className={errors.marital_status ? fieldErr : fieldOk}>
              <option value="">Select…</option>
              {["Single", "Married", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.marital_status && <p className="text-xs text-red-500 mt-1">{errors.marital_status}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Occupation <span className="text-red-500">*</span></label>
            <input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className={errors.occupation ? fieldErr : fieldOk} />
            {errors.occupation && <p className="text-xs text-red-500 mt-1">{errors.occupation}</p>}
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Home Address <span className="text-red-500">*</span></label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={errors.address ? fieldErr : fieldOk} />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => { set("email", e.target.value); setEmailTaken(false); }}
              className={errors.email ? fieldErr : emailTaken ? fieldErr : form.email && !errors.email ? fieldSuccess : fieldOk} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number <span className="text-red-500">*</span></label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={errors.phone ? fieldErr : fieldOk} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                className={`${errors.password ? fieldErr : fieldOk} pr-11`} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-gray-200"}`} />
                  ))}
                </div>
                {strength.label && <p className={`text-xs font-medium ${strength.level <= 1 ? "text-red-500" : strength.level === 2 ? "text-yellow-500" : strength.level === 3 ? "text-blue-500" : "text-green-500"}`}>{strength.label}</p>}
              </div>
            )}
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showConfirmPw ? "text" : "password"} value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)}
                className={`${errors.confirm_password ? fieldErr : form.confirm_password && form.password === form.confirm_password ? fieldSuccess : fieldOk} pr-11`} />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
            {!errors.confirm_password && form.confirm_password && form.password === form.confirm_password && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Transfer PIN <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              {form.pin.map((v, i) => (
                <input key={i} ref={pinRefs[i]} type="password" inputMode="numeric" maxLength={1} value={v}
                  onChange={(e) => handlePinInput(i, e.target.value, form.pin, "pin", pinRefs)}
                  onKeyDown={(e) => handlePinKey(e, i, form.pin, "pin", pinRefs)}
                  className={`w-12 h-12 text-center text-xl font-bold rounded-lg border focus:outline-none focus:ring-2 transition-all ${errors.pin ? "border-red-400 focus:ring-red-200" : "border-border focus:border-lumio-accent focus:ring-lumio-accent/20"}`} />
              ))}
            </div>
            {errors.pin && <p className="text-xs text-red-500 mt-1">{errors.pin}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirm PIN <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              {form.confirm_pin.map((v, i) => (
                <input key={i} ref={confirmPinRefs[i]} type="password" inputMode="numeric" maxLength={1} value={v}
                  onChange={(e) => handlePinInput(i, e.target.value, form.confirm_pin, "confirm_pin", confirmPinRefs)}
                  onKeyDown={(e) => handlePinKey(e, i, form.confirm_pin, "confirm_pin", confirmPinRefs)}
                  className={`w-12 h-12 text-center text-xl font-bold rounded-lg border focus:outline-none focus:ring-2 transition-all ${errors.confirm_pin ? "border-red-400 focus:ring-red-200" : form.confirm_pin.join("").length === 4 && form.pin.join("") === form.confirm_pin.join("") ? "border-green-400 focus:ring-green-100" : "border-border focus:border-lumio-accent focus:ring-lumio-accent/20"}`} />
              ))}
            </div>
            {errors.confirm_pin && <p className="text-xs text-red-500 mt-1">{errors.confirm_pin}</p>}
            {!errors.confirm_pin && form.confirm_pin.join("").length === 4 && form.pin.join("") === form.confirm_pin.join("") && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> PINs match</p>
            )}
          </div>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={40} className="text-green-500" />
          </motion.div>
          <h3 className="font-serif text-2xl text-foreground mb-2">Welcome to Lumio</h3>
          <p className="text-muted-foreground text-sm mb-6">Your account has been created successfully.</p>
          <div className="bg-lumio-accent/8 border border-lumio-accent/20 rounded-xl px-6 py-4 mb-8 text-left">
            <p className="text-xs text-muted-foreground mb-1">Your Account Number</p>
            <p className="font-mono text-lg text-foreground font-semibold tracking-widest">{accountNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">Please save this for your records</p>
          </div>
          <button onClick={goToDashboard} className="w-full py-3.5 rounded-lg bg-lumio-accent text-white font-medium text-base hover:bg-lumio-accent-light transition-all gold-glow-hover flex items-center justify-center gap-2">
            Go to Dashboard <ChevronRight size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col items-center justify-center p-12" style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 animate-diagonal" style={{ background: "linear-gradient(135deg, rgba(27,58,107,0.5) 0%, transparent 50%, rgba(201,150,58,0.08) 100%)", backgroundSize: "200% 200%" }} />
        <div className="absolute" style={{ top: "18%", right: "18%", width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <div className="absolute" style={{ top: "22%", right: "22%", width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <div className="absolute" style={{ bottom: "20%", left: "14%", width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <div className="absolute" style={{ bottom: "26%", left: "20%", width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(201,150,58,0.08)" }} />
        <motion.div className="relative z-10 text-center max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <LumioLogo variant="light" size="lg" />
          <h1 className="font-serif text-[44px] leading-tight text-white mt-10 mb-4 tracking-tight">Join Lumio today.</h1>
          <p className="text-white/50 text-base mb-12">Open a fully regulated UK bank account in minutes.</p>
          <div className="flex justify-center gap-8 text-[12px] text-white/40">
            <span className="flex items-center gap-1.5"><Lock size={12} /> 256-bit SSL</span>
            <span className="flex items-center gap-1.5"><Shield size={12} /> FCA Regulated</span>
            <span className="flex items-center gap-1.5"><Fingerprint size={12} /> FSCS Protected</span>
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 lg:p-10 bg-white overflow-y-auto">
        <motion.div className="w-full max-w-lg py-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
          <div className="lg:hidden mb-6"><LumioLogo variant="dark" size="lg" /></div>
          <div className="hidden lg:block mb-6"><LumioLogo variant="dark" size="sm" /></div>

          {step < 4 && (
            <>
              <h2 className="font-serif text-2xl text-foreground mb-1">Open an Account</h2>
              <p className="text-muted-foreground text-sm mb-6">Step {step} of 3 — {STEPS[step - 1]}</p>

              {/* Progress stepper */}
              <div className="flex items-center mb-8">
                {[1, 2, 3].map((s, idx) => (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step > s ? "bg-green-500 text-white" : step === s ? "bg-lumio-accent text-white" : "bg-gray-100 text-gray-400"}`}>
                        {step > s ? <CheckCircle size={14} /> : s}
                      </div>
                      <span className={`text-[10px] font-medium ${step === s ? "text-lumio-accent" : "text-gray-400"}`}>{STEPS[idx]}</span>
                    </div>
                    {idx < 2 && <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${step > s ? "bg-green-400" : "bg-gray-200"}`} />}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {stepPanel}

          {step < 4 && (
            <div className={`flex mt-6 gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <button onClick={() => setStep((s) => (s - 1) as StepId)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={submitting || emailChecking}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-lumio-accent text-white text-sm font-medium hover:bg-lumio-accent-light transition-all gold-glow-hover disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : emailChecking ? (
                  "Checking…"
                ) : step === 3 ? (
                  <>Create My Account <ChevronRight size={16} /></>
                ) : (
                  <>Continue <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-lumio-accent hover:text-lumio-accent-light transition-colors font-medium">Sign In →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
