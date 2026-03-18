import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface Transaction {
  id: string;
  user_name: string;
  reference: string;
  category: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  narration: string;
}

const addAlert = async (type: string, message: string) => {
  await supabase.from("admin_alerts").insert({ type, message });
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const PAGE_SIZE = 10;

const AdminTransactions: React.FC = () => {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [transfersEnabled, setTransfersEnabled] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [toggling, setToggling] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSettings = async () => {
    const { data } = await supabase.from("admin_settings").select("*").limit(1).single();
    if (data) { setTransfersEnabled(data.transfers_enabled); setSettingsId(data.id); }
  };

  const fetchTxns = async () => {
    setLoading(true);
    let query = supabase.from("transactions").select("*", { count: "exact" });
    if (search) query = query.or(`reference.ilike.%${search}%,user_name.ilike.%${search}%`);
    if (typeFilter) query = query.eq("type", typeFilter);
    query = query.order("created_at", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    const { data, count } = await query;
    setTxns(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
    channelRef.current = supabase
      .channel("admin-txns")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchTxns)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_settings" }, fetchSettings)
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  useEffect(() => { fetchTxns(); }, [page, search, typeFilter]);

  const handleToggleTransfers = async () => {
    if (transfersEnabled) { setShowPauseModal(true); return; }
    await doToggle(true);
  };

  const doToggle = async (enable: boolean) => {
    if (!settingsId) return;
    setToggling(true);
    await supabase.from("admin_settings").update({ transfers_enabled: enable }).eq("id", settingsId);
    const msg = enable ? "Transfers resumed by admin" : "Transfers paused by admin";
    const alertType = enable ? "transfers_resumed" : "transfers_paused";
    await addAlert(alertType, msg);
    toast.success(enable ? "Transfers resumed" : "Transfers paused");
    setShowPauseModal(false);
    setToggling(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const typeBadge = (type: string) => {
    const map: Record<string, string> = { credit: "bg-green-100 text-green-700", debit: "bg-red-100 text-red-700" };
    return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${map[type] || "bg-gray-100 text-gray-600"}`}>{type}</span>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { successful: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", failed: "bg-red-100 text-red-700" };
    return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${map[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gray-900 mb-1">Transactions</h1>
        <p className="text-gray-500 text-sm">View all transactions and control transfer availability.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="font-semibold text-gray-900 mb-0.5">Transfer System</p>
            <p className={`text-sm font-medium ${transfersEnabled ? "text-green-600" : "text-red-500"}`}>
              {transfersEnabled ? "● Transfers Enabled" : "● Transfers Paused"}
            </p>
            {!transfersEnabled && (
              <p className="text-xs text-gray-400 mt-1">Users see: "Transfers temporarily unavailable. Contact support@lumiobank.co.uk"</p>
            )}
          </div>
          <button
            onClick={handleToggleTransfers} disabled={toggling}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
              transfersEnabled
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            }`}
          >
            {toggling ? "Updating…" : transfersEnabled ? "Pause Transfers" : "Enable Transfers"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by user or reference…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30" />
          </div>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumio-accent/30">
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Date", "User", "Reference", "Category", "Amount", "Type", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No transactions found.</td></tr>
              ) : (
                txns.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(t.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{t.user_name || "—"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{t.reference}</td>
                    <td className="px-6 py-4 capitalize text-gray-600">{t.category}</td>
                    <td className={`px-6 py-4 font-semibold ${t.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "credit" ? "+" : "-"}{fmt(t.amount)}
                    </td>
                    <td className="px-6 py-4">{typeBadge(t.type)}</td>
                    <td className="px-6 py-4">{statusBadge(t.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-gray-600">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showPauseModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPauseModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Pause Transfers?</h3>
              <button onClick={() => setShowPauseModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-orange-500" />
              </div>
              <p className="text-gray-600 text-sm">All users will be unable to make transfers immediately. You can re-enable at any time.</p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setShowPauseModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={() => doToggle(false)} disabled={toggling}
                className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-60">
                {toggling ? "Pausing…" : "Pause Transfers"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
