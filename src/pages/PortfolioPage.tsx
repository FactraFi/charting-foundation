import { useNavigate } from "react-router-dom";
import PortfolioView from "@/components/PortfolioView";
import TradeModal from "@/components/TradeModal";
import type { StockData } from "@/lib/api";
import { useState } from "react";

const PortfolioPage = () => {
  const navigate = useNavigate();
  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean; stock: StockData | null; type: 'buy' | 'sell' }>({ isOpen: false, stock: null, type: 'buy' });

  const openTrade = (stock: StockData, type: 'buy' | 'sell' = 'buy') => {
    setTradeModal({ isOpen: true, stock, type });
  };

  return (
    <>
      <PortfolioView
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

export default PortfolioPage;
