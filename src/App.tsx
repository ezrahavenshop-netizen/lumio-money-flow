import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import TransferPage from "./pages/TransferPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function useTawkWidget() {
  useEffect(() => {
    if (document.getElementById("tawk-script")) return;
    const s0 = document.getElementsByTagName("script")[0];
    const s1 = document.createElement("script");
    s1.id = "tawk-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/6a3aa832452f781d473b573b/1jrqi2264";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    s0.parentNode!.insertBefore(s1, s0);
  }, []);
}

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="text-center">
      <h2 className="font-serif text-2xl text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm">Coming soon</p>
    </div>
  </div>
);

const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isAdmin } = useApp();
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useApp();
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  useTawkWidget();
  return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<UserRoute><DashboardLayout /></UserRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/accounts" element={<PlaceholderPage title="Accounts" />} />
        <Route path="/dashboard/cards" element={<PlaceholderPage title="Cards" />} />
        <Route path="/dashboard/support" element={<PlaceholderPage title="Support" />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/alerts" element={<AdminAlerts />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Sonner />
        <AppRoutes />
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
