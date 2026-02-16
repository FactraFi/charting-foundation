import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ScreenerPage from "@/pages/ScreenerPage";
import AIPage from "@/pages/AIPage";
import StrategyPage from "@/pages/StrategyPage";
import PortfolioPage from "@/pages/PortfolioPage";
import StockDetailPage from "@/pages/StockDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/screener" element={<ScreenerPage />} />
            <Route path="/ai" element={<AIPage />} />
            <Route path="/strategy" element={<StrategyPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/stock/:symbol" element={<StockDetailPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
