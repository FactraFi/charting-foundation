import { useNavigate } from "react-router-dom";
import DashboardView from "@/components/DashboardView";
import type { StockData } from "@/lib/api";
import TradeModal from "@/components/TradeModal";
import { useState } from "react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean; stock: StockData | null; type: 'buy' | 'sell' }>({ isOpen: false, stock: null, type: 'buy' });

  const openTrade = (stock: StockData, type: 'buy' | 'sell' = 'buy') => {
    setTradeModal({ isOpen: true, stock, type });
  };

  return (
    <>
      <DashboardView
        setActiveTab={(tab) => navigate(`/${tab === 'dashboard' ? '' : tab}`)}
        onSelectStock={(stock) => navigate(`/stock/${stock.ticker}`)}
        onTrade={openTrade}
      />
      <TradeModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal({ isOpen: false, stock: null, type: 'buy' })}
        stock={tradeModal.stock}
        initialType={tradeModal.type}
      />
    </>
  );
};

export default DashboardPage;
