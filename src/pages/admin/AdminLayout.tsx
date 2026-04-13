import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ArrowRightLeft, Bell, Settings,
  LogOut, Menu, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import LumioLogo from "@/components/LumioLogo";
import { supabase } from "@/lib/supabase";

const adminNav = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Transactions", icon: ArrowRightLeft, path: "/admin/transactions" },
  { label: "Alerts", icon: Bell, path: "/admin/alerts" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const COLLAPSED_KEY = "lumio_admin_sidebar_collapsed";

const AdminLayout: React.FC = () => {
  const { isAdmin, setIsAdmin, setIsLoggedIn, adminUnreadCount, setAdminUnreadCount } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(COLLAPSED_KEY) === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? 64 : 240;

  useEffect(() => {
    try { sessionStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    if (!isAdmin) navigate("/login");
  }, [isAdmin, navigate]);

  useEffect(() => {
    supabase
      .from("admin_alerts")
      .select("id", { count: "exact" })
      .eq("read", false)
      .then(({ count }) => { if (count !== null) setAdminUnreadCount(count); });

    channelRef.current = supabase
      .channel("admin-alerts-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_alerts" }, () => {
        supabase
          .from("admin_alerts")
          .select("id", { count: "exact" })
          .eq("read", false)
          .then(({ count }) => { if (count !== null) setAdminUnreadCount(count); });
      })
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [setAdminUnreadCount]);

  const handleLogout = () => { setIsAdmin(false); setIsLoggedIn(false); navigate("/login"); };
  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F6F9" }}>
      {/* ── Desktop fixed sidebar ── */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-lumio-dark overflow-visible"
        style={{ width: sidebarW, transition: "width 300ms ease" }}
      >
        {/* Logo */}
        <div className={`border-b border-white/5 flex-shrink-0 ${collapsed ? "flex justify-center items-center py-5 px-2" : "p-6"}`}>
          {collapsed ? (
            <span className="font-serif text-2xl tracking-tight"><span className="text-lumio-accent">o</span></span>
          ) : (
            <>
              <LumioLogo variant="light" />
              <p className="text-white/30 text-[10px] mt-1 uppercase tracking-widest">Admin Console</p>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-0.5 overflow-visible ${collapsed ? "px-0" : "px-3"}`}>
          {adminNav.map((item) => (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-all relative ${
                  collapsed ? "justify-center px-0 mx-2" : "px-4 mx-0"
                } ${
                  isActive(item.path)
                    ? "bg-lumio-accent/10 text-lumio-accent border-l-2 border-lumio-accent"
                    : "text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary-foreground/5"
                }`}
              >
                <item.icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                {!collapsed && item.label === "Alerts" && adminUnreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-lumio-accent text-[10px] text-white flex items-center justify-center font-medium">
                    {adminUnreadCount > 99 ? "99+" : adminUnreadCount}
                  </span>
                )}
                {collapsed && item.label === "Alerts" && adminUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-lumio-accent" />
                )}
              </Link>
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-lumio-dark border border-lumio-accent/40 text-primary-foreground text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[60] shadow-lg">
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className={`pb-3 flex-shrink-0 ${collapsed ? "flex justify-center" : "px-3 flex justify-end"}`}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-lumio-accent/60 bg-lumio-dark text-lumio-accent hover:bg-lumio-accent hover:text-white transition-all duration-200"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Footer */}
        <div className={`border-t border-white/5 flex-shrink-0 ${collapsed ? "p-3" : "p-4"}`}>
          {!collapsed && (
            <>
              <p className="text-white/70 text-xs font-medium truncate">admin@lumiobank.co.uk</p>
              <p className="text-white/30 text-[10px] mb-3">Super Admin</p>
            </>
          )}
          <div className={collapsed ? "flex justify-center" : ""}>
            <button onClick={handleLogout} title="Logout" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
              <LogOut size={14} />
              {!collapsed && "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Desktop spacer ── */}
      <div
        className="hidden lg:block flex-shrink-0"
        style={{ width: sidebarW, transition: "width 300ms ease" }}
      />

      {/* ── Mobile sidebar overlay ── */}
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
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <LumioLogo variant="light" />
                  <p className="text-white/30 text-[10px] mt-1 uppercase tracking-widest">Admin Console</p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white/70 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {adminNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative ${
                      isActive(item.path)
                        ? "bg-lumio-accent/10 text-lumio-accent border-l-2 border-lumio-accent"
                        : "text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary-foreground/5"
                    }`}
                  >
                    <item.icon size={17} />
                    {item.label}
                    {item.label === "Alerts" && adminUnreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-lumio-accent text-[10px] text-white flex items-center justify-center font-medium">
                        {adminUnreadCount > 99 ? "99+" : adminUnreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-white/5">
                <p className="text-white/70 text-xs font-medium truncate">admin@lumiobank.co.uk</p>
                <p className="text-white/30 text-[10px] mb-3">Super Admin</p>
                <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content (single Outlet) ── */}
      <div className="flex-1 min-w-0 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 h-14 flex items-center px-4 lg:px-6 gap-4">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-700">
            <Menu size={20} />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:block text-gray-500 hover:text-gray-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500 font-medium">Admin Panel</span>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
