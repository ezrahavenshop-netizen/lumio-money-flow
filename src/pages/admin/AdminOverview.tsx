import React, { useEffect, useState, useRef } from "react";
import { Users, PoundSterling, ArrowRightLeft, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Stats {
  totalUsers: number;
  totalBalance: number;
  totalTransfers: number;
  transfersToday: number;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalBalance: 0, totalTransfers: 0, transfersToday: 0 });
  const [activity, setActivity] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    const [usersRes, balanceRes, txnRes, todayRes, activityRes] = await Promise.all([
      supabase.from("users").select("id", { count: "exact" }),
      supabase.from("users").select("balance"),
      supabase.from("transactions").select("id", { count: "exact" }).eq("type", "debit"),
      supabase.from("transactions").select("id", { count: "exact" }).eq("type", "debit").gte("created_at", today),
      supabase.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const totalBalance = (balanceRes.data || []).reduce((sum: number, u: { balance: number }) => sum + Number(u.balance), 0);

    setStats({
      totalUsers: usersRes.count || 0,
      totalBalance,
      totalTransfers: txnRes.count || 0,
      transfersToday: todayRes.count || 0,
    });
    setActivity(activityRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    channelRef.current = supabase
      .channel("overview-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_alerts" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchStats)
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const typeColor: Record<string, string> = {
    "user_created": "bg-green-100 text-green-700",
    "user_updated": "bg-blue-100 text-blue-700",
    "user_suspended": "bg-red-100 text-red-700",
    "user_unsuspended": "bg-green-100 text-green-700",
    "user_deleted": "bg-red-100 text-red-700",
    "account_credited": "bg-lumio-accent/10 text-amber-700",
    "transfers_paused": "bg-orange-100 text-orange-700",
    "transfers_resumed": "bg-green-100 text-green-700",
    "transfer_made": "bg-blue-100 text-blue-700",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gray-900 mb-1">Overview</h1>
        <p className="text-gray-500 text-sm">Welcome back, Admin. Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard icon={Users} label="Total Users" value={loading ? "—" : stats.totalUsers} color="bg-lumio-primary" />
        <StatCard icon={PoundSterling} label="Total Balance" value={loading ? "—" : fmt(stats.totalBalance)} color="bg-lumio-accent" />
        <StatCard icon={ArrowRightLeft} label="Total Transfers" value={loading ? "—" : stats.totalTransfers} color="bg-indigo-500" />
        <StatCard icon={TrendingUp} label="Transfers Today" value={loading ? "—" : stats.transfersToday} color="bg-emerald-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 10 actions — updates in real-time</p>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : activity.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No activity yet.</div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-6 py-4">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap mt-0.5 ${typeColor[item.type] || "bg-gray-100 text-gray-600"}`}>
                  {item.type.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{item.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
