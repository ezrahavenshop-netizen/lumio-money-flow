import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const genRef = () => "LUM-" + Math.random().toString(36).substring(2, 10).toUpperCase();

const TransferPage: React.FC = () => {
  const { balance, setBalance, addTransaction } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form fields
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
    /^\d{8,16}$/.test(accountNumber) &&
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
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  }, [pin]);

  const handlePinKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
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

  const handleConfirm = () => {
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
      setStep(3);
    }, 2000);
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

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-foreground mb-2">New Transfer</h1>
      <p className="text-muted-foreground text-sm mb-8">Dashboard &gt; Transfer</p>

      {/* Stepper */}
      <div className="flex items-center gap-4 mb-10">
        {[
          { n: 1, label: "Beneficiary Details" },
          { n: 2, label: "Review Transfer" },
          { n: 3, label: "Confirmation" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className={`flex-1 h-0.5 ${step >= s.n ? "bg-lumio-accent" : "bg-border"}`} />}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step > s.n ? "bg-lumio-accent text-accent-foreground" : step === s.n ? "bg-lumio-accent text-accent-foreground" : "border-2 border-border text-muted-foreground"}`}>
                {step > s.n ? <CheckCircle size={16} /> : s.n}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s.n ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" {...fadeUp} className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
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
                    accountNumber.length > 0 && accountNumber.length < 8
                      ? "border-lumio-error"
                      : accountNumber.length >= 8
                      ? "border-lumio-success"
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
                <div className="pt-4 flex justify-end opacity-20">
                  <span className="font-serif text-lg text-muted-foreground">Lumio</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
              <button onClick={handleConfirm} disabled={processing} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-lumio-accent text-accent-foreground font-medium transition-all gold-glow-hover disabled:opacity-60">
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    Processing your transfer securely...
                  </>
                ) : (
                  <>Confirm & Transfer <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" {...fadeUp} className="max-w-lg mx-auto text-center">
            {/* Success animation */}
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
