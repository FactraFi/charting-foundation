import { Outlet, useNavigate, Navigate } from "react-router-dom";
import ModernNavbar from "@/components/ModernNavbar";
import { useAuth } from "@/contexts/AuthContext";

const AppLayout = () => {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col overflow-hidden">
      <div className="fixed inset-0 tech-grid-bg pointer-events-none opacity-20 z-0" />

      <div className="relative z-50">
        <ModernNavbar onLogout={handleLogout} />
      </div>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 overflow-y-auto">
        <Outlet />
      </main>

      <footer className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6 border-t border-border text-xs text-muted-foreground font-sans tracking-wide opacity-70 hover:opacity-100 transition-opacity">
        <div>© 2026 FACTRAFI. ALL RIGHTS RESERVED.</div>
        <div className="text-right">Contact us at contact@factrafi.com</div>
      </footer>
    </div>
  );
};

export default AppLayout;
