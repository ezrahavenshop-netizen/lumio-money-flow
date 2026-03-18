import React, { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  isNew?: boolean;
}

const typeColor: Record<string, string> = {
  user_created: "bg-green-100 text-green-700",
  user_updated: "bg-blue-100 text-blue-700",
  user_suspended: "bg-red-100 text-red-700",
  user_unsuspended: "bg-green-100 text-green-700",
  user_deleted: "bg-red-100 text-red-700",
  account_credited: "bg-amber-100 text-amber-700",
  transfers_paused: "bg-orange-100 text-orange-700",
  transfers_resumed: "bg-emerald-100 text-emerald-700",
  transfer_made: "bg-indigo-100 text-indigo-700",
};

const AdminAlerts: React.FC = () => {
  const { setAdminUnreadCount } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const fetchAlerts = async (markNew = false) => {
    const { data } = await supabase
      .from("admin_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    const items: Alert[] = (data || []).map((a: Alert) => ({
      ...a,
      isNew: markNew && !knownIds.current.has(a.id),
    }));
    (data || []).forEach((a: Alert) => knownIds.current.add(a.id));
    setAlerts(items);
    setLoading(false);

    const unread = items.filter((a) => !a.read).length;
    setAdminUnreadCount(unread);
  };

  useEffect(() => {
    fetchAlerts();

    channelRef.current = supabase
      .channel("admin-alerts-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_alerts" }, () => fetchAlerts(true))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_alerts" }, () => fetchAlerts())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "admin_alerts" }, () => fetchAlerts())
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const markAllRead = async () => {
    await supabase.from("admin_alerts").update({ read: true }).eq("read", false);
  };

  const clearAll = async () => {
    await supabase.from("admin_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setAlerts([]);
    setAdminUnreadCount(0);
  };

  const markOne = async (id: string) => {
    await supabase.from("admin_alerts").update({ read: true }).eq("id", id);
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-gray-900 mb-1 flex items-center gap-3">
            Alerts
            {unreadCount > 0 && (
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-lumio-accent text-white">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm">Real-time system activity feed.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <CheckCheck size={15} /> Mark all read
          </button>
          <button onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-sm text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No alerts yet. Actions you take will appear here.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={alert.isNew ? { opacity: 0, y: -10, backgroundColor: "rgba(201,150,58,0.08)" } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0, backgroundColor: alert.read ? "transparent" : "rgba(201,150,58,0.04)" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-4 px-6 py-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/60 transition-colors ${!alert.read ? "border-l-4 border-l-lumio-accent" : ""}`}
                onClick={() => !alert.read && markOne(alert.id)}
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap mt-0.5 flex-shrink-0 ${typeColor[alert.type] || "bg-gray-100 text-gray-600"}`}>
                  {alert.type.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!alert.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(alert.created_at), "dd MMM yyyy, HH:mm:ss")}
                  </p>
                </div>
                {!alert.read && (
                  <span className="w-2 h-2 rounded-full bg-lumio-accent flex-shrink-0 mt-1.5" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminAlerts;
