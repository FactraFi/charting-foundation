import { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownRight, CheckCircle, FileText, AlertCircle, Clock } from "lucide-react";
import type { StockData } from "@/lib/api";
import { useExecuteTrade } from "@/hooks/use-portfolio";
import { useAuth } from "@/contexts/AuthContext";
import { isMarketOpen } from "@/lib/market-hours";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData | null;
  initialType?: 'buy' | 'sell';
}

const TradeModal = ({ isOpen, onClose, stock, initialType = 'buy' }: TradeModalProps) => {
  const { profile } = useAuth();
  const executeTrade = useExecuteTrade();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(initialType);
  const [quantity, setQuantity] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderQueued, setOrderQueued] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentPrice = stock?.current_price || 0;
  const symbol = stock?.ticker || 'UNKNOWN';
  const companyName = stock?.name || '';
  const marketOpen = isMarketOpen();

  useEffect(() => {
    setTradeType(initialType);
    setQuantity(1);
    setOrderPlaced(false);
    setOrderQueued(false);
    setError('');
  }, [initialType, isOpen]);

  const estimatedTotal = (quantity * currentPrice).toFixed(2);
  const isBuy = tradeType === 'buy';

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await executeTrade({
        ticker: symbol,
        shares: quantity,
        price: currentPrice,
        type: tradeType,
      });
      if (marketOpen) {
        setOrderPlaced(true);
      } else {
        setOrderQueued(true);
      }
      setTimeout(() => {
        setOrderPlaced(false);
        setOrderQueued(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Trade failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !stock) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up overflow-hidden">
        {!orderPlaced && !orderQueued ? (
          <div className="flex flex-col h-full">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground font-brand">Review Order</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex bg-secondary p-1 rounded-xl">
                <button onClick={() => setTradeType('buy')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${isBuy ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                  BUY
                </button>
                <button onClick={() => setTradeType('sell')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${!isBuy ? 'bg-destructive text-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                  SELL
                </button>
              </div>
            </div>

            <div className="px-6 space-y-6 pb-6">
              <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-foreground border border-border">
                    {symbol[0]}
                  </div>
                  <div>
                    <div className="text-foreground font-bold">{symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{companyName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground font-mono text-sm">${currentPrice.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">Current Price</div>
                </div>
              </div>

              {!marketOpen && (
                <div className="flex items-center gap-2 text-sm bg-accent/10 text-accent-foreground p-3 rounded-lg border border-accent/20">
                  <Clock size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="text-muted-foreground text-xs">Market is closed. This order will be <strong className="text-foreground">queued</strong> and executed at market open.</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Quantity</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} className="w-24 bg-card border border-border rounded-lg px-3 py-2 text-right text-foreground font-mono text-sm focus:border-primary focus:outline-none transition-colors" />
                    <span className="text-muted-foreground text-xs font-medium w-8">shares</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Market Price</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono text-sm px-3 py-2">${currentPrice.toFixed(2)}</span>
                    <span className="text-muted-foreground text-xs font-medium w-8">USD</span>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 border border-border rounded-xl p-4 flex justify-between items-center">
                <span className="text-foreground/70 text-sm font-medium">Estimated Total</span>
                <span className={`font-mono text-xl font-bold ${isBuy ? 'text-primary' : 'text-destructive'}`}>${estimatedTotal}</span>
              </div>

              {isBuy && profile && (
                <div className="text-xs text-muted-foreground text-right">
                  Available: ${profile.cash_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              )}

              {error && (
                <div className="text-destructive text-sm flex items-center gap-2 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="h-px w-full bg-border" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Environment</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wide">
                  <FileText size={10} /> Paper Trading
                </span>
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto flex gap-3">
              <button onClick={onClose} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-muted-foreground border border-border hover:bg-secondary hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleTrade} disabled={submitting || currentPrice <= 0}
                className={`flex-[2] py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${isBuy ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-foreground hover:bg-destructive/90'}`}>
                {currentPrice <= 0 ? 'Waiting for price data...' : submitting ? 'Processing...' : (
                  <>
                    {isBuy ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    {marketOpen ? `Confirm ${isBuy ? 'Buy' : 'Sell'}` : `Queue ${isBuy ? 'Buy' : 'Sell'}`}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              orderQueued ? 'bg-blue-500/20 text-blue-400' : isBuy ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
            }`}>
              {orderQueued ? <Clock size={40} /> : <CheckCircle size={40} />}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2 font-brand">
              {orderQueued ? 'Order Queued' : 'Order Executed'}
            </h3>
            <p className="text-muted-foreground max-w-[240px] mx-auto leading-relaxed mb-6">
              {orderQueued ? (
                <>Your order to {isBuy ? 'buy' : 'sell'} <span className="text-foreground font-bold">{quantity}</span> shares of <span className="text-foreground font-bold">{symbol}</span> will execute at market open.</>
              ) : (
                <>You successfully {isBuy ? 'bought' : 'sold'} <span className="text-foreground font-bold">{quantity}</span> shares of <span className="text-foreground font-bold">{symbol}</span>.</>
              )}
            </p>
            <div className="w-full bg-secondary rounded-xl p-4 mb-6 border border-border">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Total Value</span>
                <span>Type</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>${estimatedTotal}</span>
                <span className="uppercase">Paper Trading</span>
              </div>
            </div>
            <button onClick={onClose} className="text-primary font-bold text-sm hover:underline">Close Window</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeModal;
