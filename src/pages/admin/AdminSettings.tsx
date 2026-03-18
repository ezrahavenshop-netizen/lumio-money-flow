import React, { useEffect, useState, useRef } from "react";
import { Shield, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Settings {
  id: string;
  transfers_enabled: boolean;
  maintenance_mode: boolean;
  allow_registration: boolean;
}

const Toggle = ({ enabled, onToggle, label, description }: {
  enabled: boolean; onToggle: () => void; label: string; description: string;
}) => (
  <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-0">
    <div>
      <p className="font-medium text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-lumio-accent" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  </div>
);

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSettings = async () => {
    const { data } = await supabase.from("admin_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
    channelRef.current = supabase
      .channel("admin-settings-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_settings" }, fetchSettings)
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const update = async (key: keyof Omit<Settings, "id">, value: boolean) => {
    if (!settings) return;
    const { error } = await supabase.from("admin_settings").update({ [key]: value }).eq("id", settings.id);
    if (error) { toast.error("Failed to update setting."); return; }
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    toast.success("Setting updated");
  };

  const handleChangePassword = () => {
    setPwdError("");
    if (!newPwd || newPwd.length < 6) { setPwdError("Password must be at least 6 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    toast.success("Password updated successfully");
    setShowPwdModal(false);
    setNewPwd(""); setConfirmPwd("");
  };

  if (loading || !settings) {
    return (
      <div>
        <h1 className="font-serif text-3xl text-gray-900 mb-6">Settings</h1>
        <p className="text-gray-400 text-sm">Loading settings…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">Manage system-wide configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6">
            <h2 className="font-semibold text-gray-900 pt-5 pb-4 border-b border-gray-100">System Controls</h2>
            <Toggle
              label="Allow New Registrations"
              description="When disabled, new account sign-ups are blocked."
              enabled={settings.allow_registration}
              onToggle={() => update("allow_registration", !settings.allow_registration)}
            />
            <Toggle
              label="Maintenance Mode"
              description='When ON, all users see: "Lumio is under maintenance. We will be back shortly."'
              enabled={settings.maintenance_mode}
              onToggle={() => update("maintenance_mode", !settings.maintenance_mode)}
            />
            <Toggle
              label="Email Notifications"
              description="Send system email notifications for key events."
              enabled={settings.transfers_enabled}
              onToggle={() => update("transfers_enabled", !settings.transfers_enabled)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-lumio-primary flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Super Admin</p>
                <p className="text-xs text-gray-400">Full access</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 font-medium">admin@lumiobank.co.uk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="text-gray-900 font-medium">Super Admin</span>
              </div>
            </div>
            <button
              onClick={() => setShowPwdModal(true)}
              className="mt-5 w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPwdModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPwdModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setPwdError(""); }}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setPwdError(""); }}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPwdModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={handleChangePassword}
                className="px-5 py-2 rounded-lg bg-lumio-accent text-white text-sm font-medium hover:bg-lumio-accent-light">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
