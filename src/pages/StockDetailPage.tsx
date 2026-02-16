import { useNavigate, useParams } from "react-router-dom";
import StockDetailView from "@/components/StockDetailView";
import TradeModal from "@/components/TradeModal";
import { MOCK_STOCKS } from "@/data/mock-data";
import type { MockStock } from "@/data/mock-data";
import { useState } from "react";

const StockDetailPage = () => {
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean; stock: MockStock | null; type: 'buy' | 'sell' }>({ isOpen: false, stock: null, type: 'buy' });

  const stock = MOCK_STOCKS.find(s => s.symbol === symbol?.toUpperCase());

  if (!stock) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Stock Not Found</h2>
          <p className="text-muted-foreground">No data available for "{symbol}"</p>
          <button onClick={() => navigate(-1)} className="text-primary hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const openTrade = (s: MockStock, type: 'buy' | 'sell' = 'buy') => {
    setTradeModal({ isOpen: true, stock: s, type });
  };

  return (
    <>
      <StockDetailView stock={stock} onBack={() => navigate(-1)} onTrade={openTrade} />
      <TradeModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal({ isOpen: false, stock: null, type: 'buy' })}
        stock={tradeModal.stock}
        initialType={tradeModal.type}
      />
    </>
  );
};

export default StockDetailPage;
