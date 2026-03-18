import React, { useEffect, useState, useRef } from "react";
import { Search, Plus, Edit2, CreditCard, Trash2, AlertTriangle, X, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  address: string;
  account_type: string;
  balance: number;
  account_number: string;
  status: string;
  kyc_status: string;
  transfer_pin: string;
  password: string;
  created_at: string;
}

const emptyForm = {
  first_name: "", last_name: "", email: "", phone: "",
  date_of_birth: "", gender: "", marital_status: "", occupation: "",
  address: "", account_type: "Lumio Premier", opening_balance: "",
  transfer_pin: "", password: "",
};

const genAccountNumber = () => String(Math.floor(10000000 + Math.random() * 90000000));

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const addAlert = async (type: string, message: string) => {
  await supabase.from("admin_alerts").insert({ type, message });
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", options }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string; options?: string[];
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {options ? (
      <select name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30">
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input name={name} type={type} value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30" />
    )}
  </div>
);

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "credit" | "suspend" | "delete" | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNarration, setCreditNarration] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [saving, setSaving] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    channelRef.current = supabase
      .channel("admin-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchUsers)
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const closeModal = () => {
    setModal(null); setSelected(null);
    setForm({ ...emptyForm });
    setCreditAmount(""); setCreditNarration(""); setAdminPin(""); setPinError(false);
  };

  const openEdit = (u: User) => {
    setSelected(u);
    setForm({
      first_name: u.first_name, last_name: u.last_name, email: u.email,
      phone: u.phone || "", date_of_birth: u.date_of_birth || "",
      gender: u.gender || "", marital_status: u.marital_status || "",
      occupation: u.occupation || "", address: u.address || "",
      account_type: u.account_type || "Lumio Premier",
      opening_balance: "", transfer_pin: u.transfer_pin || "", password: u.password || "",
    });
    setModal("edit");
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error("First name, last name and email are required.");
      return;
    }
    setSaving(true);
    const fullName = `${form.first_name} ${form.last_name}`;
    const accountNumber = genAccountNumber();
    const { error } = await supabase.from("users").insert({
      first_name: form.first_name, last_name: form.last_name,
      email: form.email, phone: form.phone,
      date_of_birth: form.date_of_birth, gender: form.gender,
      marital_status: form.marital_status, occupation: form.occupation,
      address: form.address, account_type: form.account_type,
      balance: parseFloat(form.opening_balance) || 0,
      account_number: accountNumber, status: "active",
      kyc_status: "pending", transfer_pin: form.transfer_pin,
      password: form.password,
    });
    setSaving(false);
    if (error) { toast.error("Failed to create user."); return; }
    await addAlert("user_created", `New user created — ${fullName}`);
    toast.success("User created successfully");
    closeModal();
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const fullName = `${form.first_name} ${form.last_name}`;
    const { error } = await supabase.from("users").update({
      first_name: form.first_name, last_name: form.last_name,
      email: form.email, phone: form.phone, date_of_birth: form.date_of_birth,
      gender: form.gender, marital_status: form.marital_status,
      occupation: form.occupation, address: form.address,
      account_type: form.account_type, transfer_pin: form.transfer_pin,
      password: form.password,
    }).eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error("Failed to update user."); return; }
    await addAlert("user_updated", `User ${fullName} updated`);
    toast.success("User updated");
    closeModal();
  };

  const handleCredit = async () => {
    if (!selected) return;
    if (adminPin !== "0000") { setPinError(true); return; }
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0 || !creditNarration) { toast.error("Please fill in all fields."); return; }
    setSaving(true);
    const newBalance = Number(selected.balance) + amount;
    const ref = "ADM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const fullName = `${selected.first_name} ${selected.last_name}`;

    const [{ error: balErr }, { error: txnErr }] = await Promise.all([
      supabase.from("users").update({ balance: newBalance }).eq("id", selected.id),
      supabase.from("transactions").insert({
        user_id: selected.id, user_name: fullName,
        type: "credit", amount, status: "successful",
        reference: ref, category: "admin credit",
        narration: creditNarration,
      }),
    ]);
    setSaving(false);
    if (balErr || txnErr) { toast.error("Credit failed."); return; }
    await addAlert("account_credited", `Account credited — ${fullName} +£${amount.toFixed(2)}`);
    toast.success("Account credited");
    closeModal();
  };

  const handleSuspendToggle = async () => {
    if (!selected) return;
    setSaving(true);
    const newStatus = selected.status === "suspended" ? "active" : "suspended";
    const fullName = `${selected.first_name} ${selected.last_name}`;
    const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error("Failed to update status."); return; }
    const alertType = newStatus === "suspended" ? "user_suspended" : "user_unsuspended";
    await addAlert(alertType, `User ${fullName} has been ${newStatus}`);
    toast.success(`User ${newStatus}`);
    closeModal();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    const fullName = `${selected.first_name} ${selected.last_name}`;
    const { error } = await supabase.from("users").delete().eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error("Failed to delete user."); return; }
    await addAlert("user_deleted", `User ${fullName} deleted`);
    toast.success("User deleted");
    closeModal();
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.account_number?.includes(q)
    );
  });

  const UserFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <Field label="First Name *" name="first_name" value={form.first_name} onChange={handleFormChange} />
      <Field label="Last Name *" name="last_name" value={form.last_name} onChange={handleFormChange} />
      <Field label="Email *" name="email" value={form.email} onChange={handleFormChange} type="email" />
      <Field label="Phone" name="phone" value={form.phone} onChange={handleFormChange} />
      <Field label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={handleFormChange} />
      <Field label="Gender" name="gender" value={form.gender} onChange={handleFormChange} options={["Male", "Female", "Other", "Prefer not to say"]} />
      <Field label="Marital Status" name="marital_status" value={form.marital_status} onChange={handleFormChange} options={["Single", "Married", "Divorced", "Widowed"]} />
      <Field label="Occupation" name="occupation" value={form.occupation} onChange={handleFormChange} />
      <div className="col-span-2">
        <Field label="Address" name="address" value={form.address} onChange={handleFormChange} />
      </div>
      <Field label="Account Type" name="account_type" value={form.account_type} onChange={handleFormChange} options={["Lumio Premier", "Lumio Standard", "Lumio Business"]} />
      {modal === "create" && (
        <Field label="Opening Balance (£)" name="opening_balance" value={form.opening_balance} onChange={handleFormChange} type="number" />
      )}
      <Field label="Transfer PIN" name="transfer_pin" value={form.transfer_pin} onChange={handleFormChange} />
      <Field label="Password" name="password" value={form.password} onChange={handleFormChange} type="password" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gray-900 mb-1">Users</h1>
        <p className="text-gray-500 text-sm">Manage all Lumio customer accounts.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or account number…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30"
            />
          </div>
          <button onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lumio-accent text-white text-sm font-medium hover:bg-lumio-accent-light transition-colors">
            <Plus size={15} /> Create New User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["User", "Email", "Account Type", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found.</td></tr>
              ) : (
                filtered.map((u) => {
                  const initials = `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-lumio-primary flex items-center justify-center text-white text-xs font-serif font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-gray-400">#{u.account_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-gray-600">{u.account_type}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{fmt(u.balance)}</td>
                      <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { setSelected(u); setModal("credit"); }} title="Credit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <CreditCard size={14} />
                          </button>
                          <button
                            onClick={() => { setSelected(u); setModal("suspend"); }}
                            title={u.status === "suspended" ? "Unsuspend" : "Suspend"}
                            className={`p-1.5 rounded-lg transition-colors ${u.status === "suspended" ? "text-green-600 hover:bg-green-50" : "text-orange-500 hover:bg-orange-50"}`}>
                            {u.status === "suspended" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          </button>
                          <button onClick={() => { setSelected(u); setModal("delete"); }} title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "create" && (
        <Modal title="Create New User" onClose={closeModal}>
          <UserFormFields />
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleCreate} disabled={saving}
              className="px-5 py-2 rounded-lg bg-lumio-accent text-white text-sm font-medium hover:bg-lumio-accent-light disabled:opacity-60">
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "edit" && selected && (
        <Modal title={`Edit — ${selected.first_name} ${selected.last_name}`} onClose={closeModal}>
          <UserFormFields />
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleEdit} disabled={saving}
              className="px-5 py-2 rounded-lg bg-lumio-accent text-white text-sm font-medium hover:bg-lumio-accent-light disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "credit" && selected && (
        <Modal title={`Credit Account — ${selected.first_name} ${selected.last_name}`} onClose={closeModal}>
          <div className="bg-gray-50 rounded-lg p-4 mb-5">
            <p className="text-xs text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{fmt(selected.balance)}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Credit Amount (£) *</label>
              <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Narration *</label>
              <input type="text" value={creditNarration} onChange={(e) => setCreditNarration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Admin PIN *</label>
              <input type="password" value={adminPin} onChange={(e) => { setAdminPin(e.target.value); setPinError(false); }}
                maxLength={4} placeholder="••••"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${pinError ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-lumio-accent/30"}`} />
              {pinError && <p className="text-xs text-red-500 mt-1">Incorrect admin PIN.</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleCredit} disabled={saving}
              className="px-5 py-2 rounded-lg bg-lumio-accent text-white text-sm font-medium hover:bg-lumio-accent-light disabled:opacity-60">
              {saving ? "Processing…" : "Confirm Credit"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "suspend" && selected && (
        <Modal title={selected.status === "suspended" ? "Unsuspend User" : "Suspend User"} onClose={closeModal}>
          <div className="text-center py-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${selected.status === "suspended" ? "bg-green-100" : "bg-orange-100"}`}>
              <AlertTriangle size={24} className={selected.status === "suspended" ? "text-green-600" : "text-orange-500"} />
            </div>
            <p className="text-gray-700 text-sm">
              Are you sure you want to <strong>{selected.status === "suspended" ? "unsuspend" : "suspend"}</strong>{" "}
              <strong>{selected.first_name} {selected.last_name}</strong>?
            </p>
            {selected.status !== "suspended" && (
              <p className="text-xs text-gray-400 mt-2">
                They will not be able to log in until unsuspended.
              </p>
            )}
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleSuspendToggle} disabled={saving}
              className={`px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 ${selected.status === "suspended" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}>
              {saving ? "Updating…" : selected.status === "suspended" ? "Unsuspend" : "Suspend"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <Modal title="Delete User" onClose={closeModal}>
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <p className="text-gray-700 text-sm">
              Are you sure you want to permanently delete{" "}
              <strong>{selected.first_name} {selected.last_name}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleDelete} disabled={saving}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60">
              {saving ? "Deleting…" : "Delete User"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;
