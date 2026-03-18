import React, { useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ArrowRightLeft, Bell, Settings, LogOut } from "lucide-react";
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

const AdminLayout: React.FC = () => {
  const { isAdmin, setIsAdmin, setIsLoggedIn, adminUnreadCount, setAdminUnreadCount } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/login");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    supabase
      .from("admin_alerts")
      .select("id", { count: "exact" })
      .eq("read", false)
      .then(({ count }) => {
        if (count !== null) setAdminUnreadCount(count);
      });

    channelRef.current = supabase
      .channel("admin-alerts-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_alerts" }, () => {
        supabase
          .from("admin_alerts")
          .select("id", { count: "exact" })
          .eq("read", false)
          .then(({ count }) => {
            if (count !== null) setAdminUnreadCount(count);
          });
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [setAdminUnreadCount]);

  const handleLogout = () => {
    setIsAdmin(false);
    setIsLoggedIn(false);
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F6F9" }}>
      <aside className="w-60 bg-lumio-dark flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-white/5">
          <LumioLogo variant="light" />
          <p className="text-white/30 text-[10px] mt-1 uppercase tracking-widest">Admin Console</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-60 min-h-screen">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
