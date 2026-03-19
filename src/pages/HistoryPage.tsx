import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Download, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => {
  const date = new Date(d);
  return {
    date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const categoryIcons: Record<string, React.ReactNode> = {
  income: <ArrowDownLeft size={14} className="text-lumio-success" />,
  transfer: <ArrowUpRight size={14} className="text-red-400" />,
  housing: <Home size={14} className="text-lumio-primary" />,
  "admin credit": <ArrowDownLeft size={14} className="text-lumio-success" />,
};

const displayCategory = (cat: string) => cat === "admin credit" ? "income" : cat;

interface TxRow {
  id: string;
  created_at: string;
  type: "credit" | "debit";
  amount: number;
  status: string;
  reference: string;
  category: string;
  narration?: string;
}

const PER_PAGE = 8;

const HistoryPage: React.FC = () => {
  const { userId } = useApp();
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "largest">("newest");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchTransactions = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("transactions")
      .select("id, created_at, type, amount, status, reference, category, narration")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTransactions((data as TxRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchTransactions();

    channelRef.current = supabase
      .channel(`history-txns-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, fetchTransactions)
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [userId]);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.reference.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.narration || "").toLowerCase().includes(q)
      );
    }
    if (filter === "credits") result = result.filter((t) => t.type === "credit");
    else if (filter === "debits") result = result.filter((t) => t.type === "debit");
    else if (filter === "income") result = result.filter((t) => t.category === "income" || t.category === "admin credit");
    else if (filter !== "all") result = result.filter((t) => t.category === filter);

    if (sort === "newest") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sort === "oldest") result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else result.sort((a, b) => b.amount - a.amount);

    return result;
  }, [transactions, search, filter, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalCredits = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const filters = ["all", "credits", "debits", "transfer", "income", "housing"];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif text-3xl text-foreground mb-1">Transaction History</h1>
        <p className="text-muted-foreground text-sm mb-8">A complete record of your account activity.</p>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading transactions…</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-foreground mb-1">Transaction History</h1>
      <p className="text-muted-foreground text-sm mb-8">A complete record of your account activity.</p>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-3 py-1.5 rounded-full bg-lumio-success/10 text-lumio-success text-sm font-medium">Total Credits: +{formatCurrency(totalCredits)}</span>
        <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">Total Debits: -{formatCurrency(totalDebits)}</span>
        <span className="px-3 py-1.5 rounded-full bg-lumio-primary/10 text-lumio-primary text-sm font-medium">Net: {formatCurrency(totalCredits - totalDebits)}</span>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by reference, category or narration..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus-gold"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus-gold"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="largest">Largest Amount</option>
        </select>
        <button
          onClick={() => toast("Coming soon")}
          className="px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${filter === f ? "bg-lumio-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block glass-card-light overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Date & Time", "Category", "Reference", "Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No transactions found.</td></tr>
            ) : paginated.map((t) => {
              const { date, time } = formatDate(t.created_at);
              return (
                <React.Fragment key={t.id}>
                  <tr
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                    className="h-16 border-b border-border/50 hover:bg-lumio-accent/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-6">
                      <p className="text-sm text-foreground">{date}</p>
                      <p className="text-xs text-muted-foreground">{time}</p>
                    </td>
                    <td className="px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium capitalize">
                        {categoryIcons[t.category] || <ArrowRightLeft size={14} className="text-lumio-primary" />} {displayCategory(t.category)}
                      </span>
                    </td>
                    <td className="px-6 font-mono text-xs text-muted-foreground">{t.reference}</td>
                    <td className={`px-6 text-right text-sm font-medium tabular-nums ${t.type === "credit" ? "text-lumio-success" : "text-red-400"}`}>
                      {t.type === "credit" ? "+" : "-"}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.status === "successful" ? "text-lumio-success" : "text-amber-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === "successful" ? "bg-lumio-success" : "bg-amber-500"}`} />
                        {t.status === "successful" ? "Successful" : "Pending"}
                      </span>
                    </td>
                  </tr>
                  {expanded === t.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-muted/30">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div><span className="text-muted-foreground">Transaction ID:</span> <span className="text-foreground font-mono">{t.id}</span></div>
                          <div><span className="text-muted-foreground">Full Date:</span> <span className="text-foreground">{new Date(t.created_at).toLocaleString("en-GB")}</span></div>
                          <div><span className="text-muted-foreground">Amount:</span> <span className="text-foreground">{formatCurrency(t.amount)}</span></div>
                          {t.narration && <div className="col-span-3"><span className="text-muted-foreground">Narration:</span> <span className="text-foreground">{t.narration}</span></div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginated.map((t) => {
          const { date } = formatDate(t.created_at);
          return (
            <div key={t.id} onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="glass-card-light p-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">{categoryIcons[t.category]}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{displayCategory(t.category)}</p>
                    <p className="text-xs text-muted-foreground">{date}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium tabular-nums ${t.type === "credit" ? "text-lumio-success" : "text-red-400"}`}>
                  {t.type === "credit" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </div>
              {expanded === t.id && (
                <div className="mt-3 pt-3 border-t border-border text-xs space-y-1">
                  <p><span className="text-muted-foreground">Reference:</span> <span className="text-foreground font-mono">{t.reference}</span></p>
                  <p><span className="text-muted-foreground">Status:</span> <span className="text-lumio-success capitalize">{t.status}</span></p>
                  {t.narration && <p><span className="text-muted-foreground">Narration:</span> <span className="text-foreground">{t.narration}</span></p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} transactions
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-lumio-accent text-accent-foreground" : "text-foreground hover:bg-muted"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HistoryPage;
