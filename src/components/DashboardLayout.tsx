import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowRightLeft, Clock, UserCircle, Headphones,
  LogOut, Bell, Search, Menu, AlertTriangle, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import LumioLogo from "@/components/LumioLogo";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

const COLLAPSED_KEY = "lumio_sidebar_collapsed";

const DashboardLayout: React.FC = () => {
  useChatwayWidget();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userId, userStatus, setUserStatus, setBalance, setIsLoggedIn, notifications, markAllRead } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(COLLAPSED_KEY) === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const prevStatus = useRef<string>(userStatus);
  const suspendedToastShown = useRef(false);

  useEffect(() => {
    try { sessionStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`user-live-${userId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${userId}` }, (payload) => {
        const updated = payload.new as { balance?: number; status?: string };
        if (typeof updated.balance === "number") setBalance(updated.balance);
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
      })
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
        if (payload.new && typeof payload.new.maintenance_mode === "boolean") setMaintenanceMode(payload.new.maintenance_mode);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => { setIsLoggedIn(false); navigate("/"); };
  const handleNotifToggle = () => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); };
  const isActive = (path: string) => location.pathname === path;
  const sidebarW = collapsed ? 64 : 240;

  const NavItem = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => (
    <div className="relative group">
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-all ${
          collapsed ? "justify-center px-0 mx-2" : "px-4 mx-0"
        } ${
          isActive(item.path)
            ? "bg-lumio-accent/10 text-lumio-accent border-l-2 border-lumio-accent"
            : "text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary-foreground/5"
        }`}
      >
        <item.icon size={18} className="flex-shrink-0" />
        {!collapsed && (
          <span className="transition-opacity duration-200 opacity-100 whitespace-nowrap overflow-hidden">
            {item.label}
          </span>
        )}
      </Link>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-lumio-dark border border-lumio-accent/40 text-primary-foreground text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[60] shadow-lg">
          {item.label}
        </div>
      )}
    </div>
  );

  const CollapseButton = () => (
    <button
      onClick={() => setCollapsed((c) => !c)}
      className={`flex items-center justify-center w-8 h-8 rounded-md border border-lumio-accent/60 bg-lumio-dark text-lumio-accent hover:bg-lumio-accent hover:text-white transition-all duration-200 ${collapsed ? "mx-auto" : "ml-auto mr-3"}`}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  );

  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center border-b border-primary-foreground/10 flex-shrink-0 ${collapsed ? "justify-center py-5 px-2" : "p-6"}`}>
        {collapsed ? (
          <span className="font-serif text-2xl tracking-tight">
            <span className="text-lumio-accent">o</span>
          </span>
        ) : (
          <LumioLogo variant="light" />
        )}
      </div>

      <nav className={`flex-1 py-3 space-y-0.5 ${collapsed ? "px-0" : "px-3"}`}>
        {navItems.map((item) => <NavItem key={item.path} item={item} />)}
      </nav>

      <div className={`pb-3 flex-shrink-0 ${collapsed ? "flex justify-center" : "px-3"}`}>
        <CollapseButton />
      </div>

      <div className={`border-t border-primary-foreground/10 flex-shrink-0 ${collapsed ? "p-3" : "p-4"}`}>
        <div className={`flex items-center mb-3 ${collapsed ? "justify-center" : "gap-3"}`}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0" style={{ outline: "1px solid rgba(201,150,58,0.2)", outlineOffset: "-1px" }} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-lumio-primary flex items-center justify-center font-serif text-xs text-primary-foreground flex-shrink-0">{user.initials}</div>
          )}
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-primary-foreground text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-primary-foreground/40 text-xs">{user.accountType}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={handleLogout} className="flex items-center gap-2 text-primary-foreground/40 hover:text-primary-foreground/70 text-sm transition-colors w-full">
            <LogOut size={14} /> Log out
          </button>
        )}
        {collapsed && (
          <div className="flex justify-center mt-2">
            <button onClick={handleLogout} title="Log out" className="text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const MobileSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-primary-foreground/10">
        <LumioLogo variant="light" />
        <button onClick={() => setMobileOpen(false)} className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
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
    </div>
  );

  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lumio-surface">
        <div className="text-center max-w-sm px-6">
          <LumioLogo variant="dark" size="lg" />
          <h2 className="font-serif text-2xl text-foreground mt-8 mb-3">Under Maintenance</h2>
          <p className="text-muted-foreground text-sm">Lumio is under maintenance. We will be back shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-lumio-surface">
      {userStatus === "suspended" && (
        <div className="w-full bg-red-600 text-white text-sm py-2.5 px-4 flex items-center justify-center gap-2 z-50 flex-shrink-0 select-none">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>
            ⚠ <strong>Account Suspended</strong> — Contact{" "}
            <a href="mailto:support@lumiobank.co.uk" className="underline font-semibold">support@lumiobank.co.uk</a>{" "}
            for assistance.
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-lumio-dark overflow-visible"
          style={{
            width: sidebarW,
            top: userStatus === "suspended" ? "40px" : "0",
            transition: "width 300ms ease",
          }}
        >
          <DesktopSidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
              />
              <motion.aside
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden fixed inset-y-0 left-0 w-60 bg-lumio-dark flex flex-col z-50"
              >
                <MobileSidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div
          className="flex-1 min-w-0"
          style={{ marginLeft: 0, transition: "margin-left 300ms ease" }}
        >
          <div
            className="hidden lg:block"
            style={{ marginLeft: sidebarW, transition: "margin-left 300ms ease" }}
          >
            {/* Desktop top bar */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border h-14 flex items-center px-6 gap-4">
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
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
            <main className="p-8">
              <AnimatePresence mode="wait">
                <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Mobile layout */}
          <div className="lg:hidden">
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border h-14 flex items-center px-4 gap-4">
              <button onClick={() => setMobileOpen(true)} className="text-foreground">
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
              </div>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" style={{ outline: "1px solid rgba(201,150,58,0.2)", outlineOffset: "-1px" }} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-lumio-primary flex items-center justify-center font-serif text-xs text-primary-foreground">{user.initials}</div>
              )}
            </header>
            <main className="p-4">
              <AnimatePresence mode="wait">
                <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
