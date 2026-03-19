import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ArrowRightLeft, Clock, UserCircle, Headphones, LogOut, Bell, Search, Menu, AlertTriangle } from "lucide-react";
import LumioLogo from "@/components/LumioLogo";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Inject Chatway widget script once per session
function useChatwayWidget() {
  useEffect(() => {
    if (document.getElementById("chatway")) return;
    const script = document.createElement("script");
    script.id = "chatway";
    script.src = "https://cdn.chatway.app/widget.js?id=P0qAHkKWPpyX";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const existing = document.getElementById("chatway");
      if (existing) existing.remove();
    };
  }, []);
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Transfer", icon: ArrowRightLeft, path: "/transfer" },
  { label: "History", icon: Clock, path: "/history" },
  { label: "Profile", icon: UserCircle, path: "/profile" },
  { label: "Support", icon: Headphones, path: "/dashboard/support" },
];

const DashboardLayout: React.FC = () => {
  useChatwayWidget();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userId, userStatus, setUserStatus, setBalance, setIsLoggedIn, notifications, markAllRead } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const prevStatus = useRef<string>(userStatus);
  const suspendedToastShown = useRef(false);

  // Subscribe to balance + status changes for current user
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-live-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${userId}` },
        (payload) => {
          const updated = payload.new as { balance?: number; status?: string };
          if (typeof updated.balance === "number") {
            setBalance(updated.balance);
          }
          if (updated.status) {
            const prev = prevStatus.current;
            prevStatus.current = updated.status;
            setUserStatus(updated.status);

            if (updated.status === "suspended" && prev !== "suspended") {
              if (!suspendedToastShown.current) {
                suspendedToastShown.current = true;
                toast.error(
                  "⚠ Your account has been suspended. For more information please contact our support team at support@lumiobank.co.uk. We are here to help.",
                  { duration: Infinity, closeButton: true }
                );
              }
            }
            if (updated.status === "active" && prev === "suspended") {
              suspendedToastShown.current = false;
              toast.success("Your account has been reactivated. You can now make transfers.", { duration: Infinity, closeButton: true });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, setBalance, setUserStatus]);

  useEffect(() => {
    supabase.from("admin_settings").select("maintenance_mode").limit(1).single().then(({ data }) => {
      if (data) setMaintenanceMode(data.maintenance_mode);
    });
    const channel = supabase
      .channel("maintenance-check")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_settings" }, (payload) => {
        if (payload.new && typeof payload.new.maintenance_mode === "boolean") {
          setMaintenanceMode(payload.new.maintenance_mode);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleNotifToggle = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) markAllRead();
  };

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <LumioLogo variant="light" />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive(item.path)
                ? "bg-lumio-accent/10 text-lumio-accent border-l-2 border-lumio-accent"
                : "text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary-foreground/5"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-foreground/10">
        <div className="flex items-center gap-3 mb-3">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} className="w-9 h-9 rounded-full object-cover" style={{ outline: "1px solid rgba(201,150,58,0.2)", outlineOffset: "-1px" }} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-lumio-primary flex items-center justify-center font-serif text-xs text-primary-foreground">{user.initials}</div>
          )}
          <div className="min-w-0">
            <p className="text-primary-foreground text-sm font-medium truncate">{user.fullName}</p>
            <p className="text-primary-foreground/40 text-xs">{user.accountType}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-primary-foreground/40 hover:text-primary-foreground/70 text-sm transition-colors w-full">
          <LogOut size={14} /> Log out
        </button>
      </div>
    </>
  );

  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lumio-surface">
        <div className="text-center max-w-sm px-6">
          <LumioLogo variant="dark" size="lg" />
          <h2 className="font-serif text-2xl text-foreground mt-8 mb-3">Under Maintenance</h2>
          <p className="text-muted-foreground text-sm">
            Lumio is under maintenance. We will be back shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-lumio-surface">
      {/* Suspension Banner — non-dismissable, persists entire session */}
      {userStatus === "suspended" && (
        <div className="w-full bg-red-600 text-white text-sm py-2.5 px-4 flex items-center justify-center gap-2 z-50 flex-shrink-0 select-none">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>
            ⚠ <strong>Account Suspended</strong> — Contact{" "}
            <a href="mailto:support@lumiobank.co.uk" className="underline font-semibold">
              support@lumiobank.co.uk
            </a>{" "}
            for assistance.
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 bg-lumio-dark flex-col fixed inset-y-0 left-0 z-40" style={{ top: userStatus === "suspended" ? "40px" : "0" }}>
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-lumio-dark/60 z-40" />
              <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ ease: [0.16, 1, 0.3, 1] }} className="lg:hidden fixed inset-y-0 left-0 w-60 bg-lumio-dark flex flex-col z-50">
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex-1 lg:ml-60">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border h-14 flex items-center px-4 lg:px-6 gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu size={20} />
            </button>
            <div className="flex-1" />
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Search size={18} />
            </button>
            <div className="relative">
              <button onClick={handleNotifToggle} className="text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lumio-accent text-[10px] text-accent-foreground flex items-center justify-center font-medium">{unreadCount}</span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-10 w-80 bg-card rounded-xl border border-border elevated-shadow overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-medium text-sm text-foreground">Notifications</h3>
                      <button onClick={markAllRead} className="text-xs text-lumio-accent">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">No notifications</div>
                      ) : notifications.map((n) => (
                        <div key={n.id} className={`p-4 border-b border-border last:border-0 ${!n.read ? "border-l-2 border-l-lumio-accent" : ""}`}>
                          <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" style={{ outline: "1px solid rgba(201,150,58,0.2)", outlineOffset: "-1px" }} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-lumio-primary flex items-center justify-center font-serif text-xs text-primary-foreground">{user.initials}</div>
            )}
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
