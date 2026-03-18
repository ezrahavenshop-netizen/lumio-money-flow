import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Download, Mail, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const genRef = () => "LUM-" + Math.random().toString(36).substring(2, 10).toUpperCase();

const OTP_EMAIL = "crissimon44@gmail.com";
const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  return "*".repeat(local.length) + "@" + domain;
};
const OTP_TTL = 120; // seconds

// ── OTP Step component ──────────────────────────────────────────────────────
const OtpStep: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_TTL);
  const [expired, setExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setTimeLeft(OTP_TTL);
    setExpired(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      startTimer();
      setOtp(["", "", "", "", "", ""]);
      setOtpError(false);
      inputRefs.current[0]?.focus();
    } catch (e: any) {
      toast.error(e.message || "Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    sendOtp();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    setOtpError(false);
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    if (expired) {
      setOtpError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("invalid");
      setOtpSuccess(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(onSuccess, 700);
    } catch {
      setOtpError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSuccess(false);
    sendOtp();
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(1, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const allFilled = otp.every((d) => d !== "");

  const inputClass = (i: number) => {
    const base = "w-12 h-12 text-center text-xl rounded-lg border-2 font-semibold transition-all bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-lumio-accent/30";
    if (otpSuccess) return `${base} border-lumio-success text-lumio-success`;
    if (otpError) return `${base} border-lumio-error`;
    if (otp[i]) return `${base} border-lumio-accent`;
    return `${base} border-border`;
  };

  return (
    <motion.div key="step3" {...fadeUp} className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-lumio-accent/10 flex items-center justify-center mx-auto mb-6">
        <Mail size={28} className="text-lumio-accent" />
      </div>

      <h2 className="font-serif text-2xl text-foreground mb-2">Verify Your Transfer</h2>
      <p className="text-muted-foreground text-sm mb-8">
        A 6-digit verification code has been sent to<br />
        <span className="font-medium text-foreground">{maskEmail(OTP_EMAIL)}</span>
      </p>

      {/* OTP inputs */}
      <div className={`flex justify-center gap-2 mb-4 ${shaking ? "animate-shake" : ""}`}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={otpSuccess || verifying}
            className={inputClass(i)}
            data-testid={`otp-input-${i}`}
          />
        ))}
      </div>

      {/* Error / success messages */}
      <AnimatePresence mode="wait">
        {otpError && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-lumio-error text-sm mb-3 flex items-center justify-center gap-1"
          >
            <AlertTriangle size={14} /> Incorrect or expired code. Please try again.
          </motion.p>
        )}
        {otpSuccess && (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-lumio-success text-sm mb-3 flex items-center justify-center gap-1"
          >
            <CheckCircle size={14} /> Verified! Proceeding…
          </motion.p>
        )}
      </AnimatePresence>

      {/* Timer / expired */}
      <div className="mb-6 text-sm">
        {sending ? (
          <span className="text-muted-foreground">Sending code…</span>
        ) : expired ? (
          <span className="text-lumio-error font-medium">Code expired.</span>
        ) : (
          <span className="text-muted-foreground">
            Code expires in <span className="font-semibold tabular-nums text-foreground">{mins}:{secs}</span>
          </span>
        )}
        {(expired || (!sending && timeLeft < OTP_TTL)) && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="ml-3 text-lumio-accent text-sm hover:underline disabled:opacity-50 inline-flex items-center gap-1"
          >
            <RotateCcw size={12} /> Resend Code
          </button>
        )}
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={!allFilled || verifying || otpSuccess || expired}
        className="w-full py-3.5 rounded-lg bg-lumio-accent text-white font-medium text-base transition-all gold-glow-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
      >
        {verifying ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>Verify Code <ArrowRight size={16} /></>
        )}
      </button>

      <button
        onClick={onCancel}
        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
      >
        Cancel Transfer
      </button>
    </motion.div>
  );
};

// ── Main TransferPage ───────────────────────────────────────────────────────
const TransferPage: React.FC = () => {
  const { balance, setBalance, addTransaction } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [transfersEnabled, setTransfersEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    supabase.from("admin_settings").select("transfers_enabled").limit(1).single().then(({ data }) => {
      if (data) setTransfersEnabled(data.transfers_enabled);
      setSettingsLoaded(true);
    });
    const channel = supabase
      .channel("transfer-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_settings" }, (payload) => {
        if (payload.new && typeof payload.new.transfers_enabled === "boolean") {
          setTransfersEnabled(payload.new.transfers_enabled);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const [recipientName, setRecipientName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [processing, setProcessing] = useState(false);
  const [txnRef, setTxnRef] = useState("");

  const amountNum = parseFloat(amount) || 0;
  const isOverBalance = amountNum > balance;
  const isAmountValid = amountNum > 0 && !isOverBalance;
  const isPinCorrect = pin.join("") === "1962";

  const canContinue =
    recipientName.length >= 2 &&
    /^\d{8,12}$/.test(accountNumber) &&
    bankName.length >= 3 &&
    isAmountValid &&
    narration.length > 0 &&
    isPinCorrect;

  const handlePinChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setPinError(false);
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) pinRefs.current[index + 1]?.focus();
  }, [pin]);

  const handlePinKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) pinRefs.current[index - 1]?.focus();
  }, [pin]);

  const handleContinue = () => {
    if (pin.join("").length === 4 && !isPinCorrect) {
      setPinError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      return;
    }
    if (canContinue) setStep(2);
  };

  // Step 2 → send OTP → advance to Step 3
  const handleReviewContinue = () => {
    setStep(3);
  };

  // Step 3 OTP verified → execute transfer → Step 4
  const handleOtpSuccess = () => {
    setProcessing(true);
    const ref = genRef();
    setTxnRef(ref);
    setTimeout(() => {
      setBalance((prev) => prev - amountNum);
      addTransaction({
        id: "TXN" + Date.now(),
        date: new Date().toISOString(),
        type: "debit",
        amount: amountNum,
        status: "successful",
        reference: ref,
        category: "transfer",
      });
      setProcessing(false);
      setStep(4);
    }, 1500);
  };

  const resetForm = () => {
    setStep(1);
    setRecipientName("");
    setAccountNumber("");
    setBankName("");
    setAmount("");
    setNarration("");
    setPin(["", "", "", ""]);
    setPinError(false);
  };

  const steps = [
    { n: 1, label: "Beneficiary Details" },
    { n: 2, label: "Review Transfer" },
    { n: 3, label: "OTP Verification" },
    { n: 4, label: "Confirmation" },
  ];

  if (settingsLoaded && !transfersEnabled) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif text-3xl text-foreground mb-2">New Transfer</h1>
        <p className="text-muted-foreground text-sm mb-8">Dashboard &gt; Transfer</p>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-orange-500" />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-2">Transfers Unavailable</h2>
            <p className="text-muted-foreground text-sm">
              Transfers are temporarily unavailable.<br />
              Contact <span className="text-lumio-accent">support@lumiobank.co.uk</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-foreground mb-2">New Transfer</h1>
      <p className="text-muted-foreground text-sm mb-8">Dashboard &gt; Transfer</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className={`flex-1 h-0.5 min-w-4 ${step >= s.n ? "bg-lumio-accent" : "bg-border"}`} />}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step > s.n ? "bg-lumio-accent text-white" : step === s.n ? "bg-lumio-accent text-white" : "border-2 border-border text-muted-foreground"}`}>
                {step > s.n ? <CheckCircle size={16} /> : s.n}
              </div>
              <span className={`text-sm hidden sm:block whitespace-nowrap ${step >= s.n ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Beneficiary Details ── */}
        {step === 1 && (
          <motion.div key="step1" {...fadeUp} className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Recipient Full Name *</label>
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Enter recipient's full name" className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus-gold transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Recipient Account Number *</label>
                <input
                  type="tel"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  onKeyPress={(e) => { if (!/\d/.test(e.key)) e.preventDefault(); }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 12);
                    setAccountNumber(pasted);
                  }}
                  placeholder="Enter account number"
                  maxLength={12}
                  className={`w-full px-4 py-3 rounded-lg border text-foreground text-sm focus-gold transition-all bg-card ${
                    accountNumber.length > 0 && accountNumber.length < 8 ? "border-lumio-error"
                    : accountNumber.length >= 8 ? "border-lumio-success"
                    : "border-border"
                  }`}
                />
                {accountNumber.length > 0 && accountNumber.length < 8 && (
                  <p className="text-lumio-error text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Account number must be at least 8 digits</p>
                )}
                {accountNumber.length >= 8 && (
                  <p className="text-lumio-success text-xs mt-1 flex items-center gap-1"><CheckCircle size={12} /> Valid account number</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Bank Name *</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Barclays Bank, HSBC, Lloyds Bank..." className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus-gold transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Amount *</label>
                <p className="text-lumio-accent text-[13px] text-right mb-1">Available Balance: {formatCurrency(balance)}</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">£</span>
                  <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" className={`w-full pl-8 pr-4 py-3 rounded-lg border text-foreground text-sm focus-gold transition-all bg-card ${isOverBalance ? "border-lumio-error" : isAmountValid ? "border-lumio-success" : "border-border"}`} />
                </div>
                {isOverBalance && <p className="text-lumio-error text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Insufficient funds. Available balance: {formatCurrency(balance)}</p>}
                {isAmountValid && <p className="text-lumio-success text-xs mt-1 flex items-center gap-1"><CheckCircle size={12} /> Sufficient balance for this transfer</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Payment Reference *</label>
                <input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Invoice payment, Property settlement, Rent" className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus-gold transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Enter your 4-digit secure transfer PIN *</label>
                <div className={`flex gap-2 ${shaking ? "animate-shake" : ""}`}>
                  {pin.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { pinRefs.current[i] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className={`w-12 h-12 text-center text-lg rounded-lg border font-medium focus-gold transition-all bg-card text-foreground ${pinError ? "border-lumio-error" : isPinCorrect && pin.every(d => d !== "") ? "border-lumio-success" : "border-border"}`}
                    />
                  ))}
                </div>
                {pinError && <p className="text-lumio-error text-xs mt-1">Incorrect PIN. Please try again.</p>}
              </div>

              <button onClick={handleContinue} disabled={!canContinue} className="flex items-center gap-2 px-8 py-3.5 rounded-lg bg-lumio-accent text-accent-foreground font-medium transition-all gold-glow-hover disabled:opacity-40 disabled:cursor-not-allowed">
                Continue to Review <ArrowRight size={16} />
              </button>
            </div>

            {/* Live preview */}
            <div className="lg:col-span-2">
              <div className="glass-card-light p-6 sticky top-20 space-y-4">
                <h3 className="font-serif text-lg text-foreground mb-4">Transfer Preview</h3>
                {[
                  ["From", "Kyu Min Lee — **** 4821"],
                  ["To", recipientName || "—"],
                  ["Account No", accountNumber || "—"],
                  ["Bank", bankName || "—"],
                  ["Amount", amountNum > 0 ? formatCurrency(amountNum) : "£0.00"],
                  ["Reference", narration || "—"],
                  ["Fee", "£0.00"],
                  ["Total Debit", amountNum > 0 ? formatCurrency(amountNum) : "£0.00"],
                  ["Balance After", amountNum > 0 ? formatCurrency(balance - amountNum) : formatCurrency(balance)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={`text-foreground font-medium ${k === "Total Debit" ? "text-lumio-accent" : ""}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <motion.div key="step2" {...fadeUp} className="max-w-lg mx-auto">
            <div className="glass-card-light p-8 space-y-4">
              <h3 className="font-serif text-xl text-foreground mb-4">Review Your Transfer</h3>
              {[
                ["Recipient Name", recipientName],
                ["Account Number", accountNumber],
                ["Bank", bankName],
                ["Amount", formatCurrency(amountNum)],
                ["Transaction Fee", "£0.00"],
                ["Total Debit", formatCurrency(amountNum)],
                ["Narration", narration],
                ["Transfer PIN", "●●●●"],
                ["Balance After", formatCurrency(balance - amountNum)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={`text-foreground font-medium ${k === "Total Debit" ? "text-lumio-accent font-semibold" : ""}`}>{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-lumio-warning/10 border border-lumio-warning/20 flex items-start gap-3">
              <AlertTriangle size={18} className="text-lumio-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">Please verify all details carefully. Transfers cannot be reversed once confirmed.</p>
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                <ArrowLeft size={16} /> Edit Details
              </button>
              <button
                onClick={handleReviewContinue}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-lumio-accent text-accent-foreground font-medium transition-all gold-glow-hover"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: OTP Verification ── */}
        {step === 3 && !processing && (
          <OtpStep
            key="step3"
            onSuccess={handleOtpSuccess}
            onCancel={resetForm}
          />
        )}

        {/* Processing transition */}
        {step === 3 && processing && (
          <motion.div key="processing" {...fadeUp} className="max-w-md mx-auto text-center py-16">
            <div className="w-16 h-16 border-4 border-lumio-accent/20 border-t-lumio-accent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-serif text-2xl text-foreground mb-2">Processing Transfer</h2>
            <p className="text-muted-foreground text-sm">Securely executing your transfer, please wait…</p>
          </motion.div>
        )}

        {/* ── Step 4: Confirmation ── */}
        {step === 4 && (
          <motion.div key="step4" {...fadeUp} className="max-w-lg mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="226" style={{ animation: "draw-circle 0.6s ease-out forwards" }} />
                <path d="M24 40 L35 51 L56 30" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: "draw-check 0.4s ease-out 0.6s forwards", strokeDashoffset: 50 }} />
              </svg>
            </div>

            <h2 className="font-serif text-3xl text-foreground mb-2">Transfer Successful</h2>
            <p className="text-muted-foreground mb-8">Your transfer has been processed and is on its way.</p>

            <div className="glass-card-light p-8 text-left space-y-3 mb-8">
              {[
                ["Transaction Reference", txnRef],
                ["Date & Time", new Date().toLocaleString("en-GB")],
                ["Amount", formatCurrency(amountNum)],
                ["To", recipientName],
                ["Bank", bankName],
                ["Account No", accountNumber],
                ["Reference", narration],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={`font-medium ${k === "Amount" ? "text-lumio-success text-lg" : "text-foreground"}`}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-1.5 border-t border-border pt-3">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1.5 text-lumio-success font-medium"><span className="w-2 h-2 rounded-full bg-lumio-success" /> Successful</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => toast("Coming soon")} className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                <Download size={16} /> Download Receipt
              </button>
              <button onClick={resetForm} className="px-6 py-3 rounded-lg bg-lumio-accent text-accent-foreground text-sm font-medium transition-all gold-glow-hover">
                Make Another Transfer
              </button>
              <button onClick={() => navigate("/history")} className="px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                Go to History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferPage;
