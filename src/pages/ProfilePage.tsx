import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Shield, Copy, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const ProfilePage: React.FC = () => {
  const { user, setUser } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "account" | "security">("personal");
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [twoFA, setTwoFA] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [loginNotif, setLoginNotif] = useState(true);
  const [txnAlerts, setTxnAlerts] = useState(true);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large. Please choose a file under 5MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload a valid image file (JPG, PNG, WebP)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setUser((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      toast.success("Profile photo updated ✓");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setUser((prev) => ({ ...prev, avatarUrl: null }));
    toast("Profile photo removed");
  };

  const tabs = ["personal", "account", "security"] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-foreground mb-8">Profile</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left card */}
        <div className="glass-card-light p-8 text-center">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <div className="relative w-20 h-20 mx-auto mb-4 group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} className="w-20 h-20 rounded-full object-cover" style={{ outline: "1px solid rgba(201,150,58,0.2)", outlineOffset: "-1px" }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-lumio-primary flex items-center justify-center font-serif text-2xl text-primary-foreground">{user.initials}</div>
            )}
            <div className="absolute inset-0 rounded-full bg-lumio-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
              <Camera size={18} className="text-primary-foreground" />
              <span className="text-primary-foreground text-[10px] mt-0.5">Change</span>
            </div>
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-lumio-accent text-xs font-medium">Upload Photo</button>
          {user.avatarUrl && <button onClick={removePhoto} className="text-lumio-error text-xs ml-3">Remove</button>}

          <h2 className="font-serif text-xl text-foreground mt-4">{user.fullName}</h2>
          <p className="text-muted-foreground text-sm">{user.occupation}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-lumio-accent/10 text-lumio-accent text-xs font-medium">{user.accountType}</span>
          <p className="text-muted-foreground text-xs mt-2">Member since {user.memberSince}</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-lumio-success text-xs">
            <Shield size={12} /> <span className="font-medium">KYC Verified</span>
          </div>
        </div>

        {/* Right tabs */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-6">
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === t ? "bg-lumio-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="glass-card-light p-8">
            {activeTab === "personal" && (
              <div className="space-y-4">
                {[
                  ["First Name", user.firstName],
                  ["Last Name", user.lastName],
                  ["Date of Birth", user.dateOfBirth],
                  ["Gender", user.gender],
                  ["Marital Status", user.maritalStatus],
                  ["Occupation", user.occupation],
                  ["Home Address", user.address],
                  ["Phone", user.phone],
                  ["Email", user.email],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{k}</span>
                    <span className="text-sm text-foreground font-medium">{v}</span>
                  </div>
                ))}
                <button onClick={() => toast("Verification required to update personal details")} className="mt-4 px-6 py-2.5 rounded-lg bg-lumio-accent text-accent-foreground text-sm font-medium transition-all gold-glow-hover">
                  Edit Personal Details
                </button>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-mono">{showFullAccount ? user.accountNumber : user.accountNumberMasked}</span>
                    <button onClick={() => setShowFullAccount(!showFullAccount)} className="text-muted-foreground hover:text-foreground">
                      {showFullAccount ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(user.accountNumber); toast.success("Copied!"); }} className="text-muted-foreground hover:text-foreground">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                {[
                  ["IBAN", "GB29LUMI60161331926819"],
                  ["Account Type", user.accountType],
                  ["Currency", "GBP (£)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{k}</span>
                    <span className="text-sm text-foreground font-medium">{v}</span>
                  </div>
                ))}
                <button onClick={() => toast("Coming soon")} className="mt-4 px-6 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                  Download Account Certificate
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-5">
                {[
                  { label: "Two-Factor Authentication", state: twoFA, toggle: setTwoFA },
                  { label: "Biometric Login", state: biometric, toggle: setBiometric },
                  { label: "Login Notifications", state: loginNotif, toggle: setLoginNotif },
                  { label: "Transaction Alerts", state: txnAlerts, toggle: setTxnAlerts },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <button onClick={() => item.toggle(!item.state)} className={`w-11 h-6 rounded-full transition-colors relative ${item.state ? "bg-lumio-success" : "bg-border"}`}>
                      <div className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform ${item.state ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}

                <div className="pt-4 space-y-3">
                  <button onClick={() => toast("Coming soon")} className="w-full text-left px-4 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Change Transfer PIN</button>
                  <button onClick={() => toast("Redirecting to secure password reset...")} className="w-full text-left px-4 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Change Password</button>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-2">Active Sessions</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-lumio-success" />
                      <span className="text-sm text-foreground">Chrome · Chelmsford, UK · Active now</span>
                    </div>
                    <button className="text-xs text-lumio-error hover:text-lumio-error/80">Log Out</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
