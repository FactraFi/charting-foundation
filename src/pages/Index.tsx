import { useState } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import DashboardView from "@/components/DashboardView";
import StockDetailView from "@/components/StockDetailView";
import AuthScreen from "@/components/AuthScreen";
import type { MockStock } from "@/data/mock-data";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<MockStock | null>(null);

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    if (selectedStock) {
      return <StockDetailView stock={selectedStock} onBack={() => setSelectedStock(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} onSelectStock={setSelectedStock} />;
      default:
        return (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <span className="text-2xl font-bold font-brand">F</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground font-brand">Coming Soon</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                The <span className="text-primary font-bold capitalize">{activeTab}</span> module is under construction. Check back soon.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 tech-grid-bg pointer-events-none opacity-20 z-0" />

      {/* Navigation */}
      <div className="relative z-50">
        <ModernNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 overflow-y-auto">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6 border-t border-border text-xs text-muted-foreground font-sans tracking-wide opacity-70 hover:opacity-100 transition-opacity">
        <div>© 2026 FACTRAFI. ALL RIGHTS RESERVED.</div>
        <div className="text-right">Contact us at contact@factrafi.com</div>
      </footer>
    </div>
  );
};

export default Index;
