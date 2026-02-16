import { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownRight, CheckCircle, Info, FileText } from "lucide-react";
import type { StockData } from "@/lib/api";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData | null;
  initialType?: 'buy' | 'sell';
}

const TradeModal = ({ isOpen, onClose, stock, initialType = 'buy' }: TradeModalProps) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>(initialType);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [environment, setEnvironment] = useState<'paper' | 'real'>('paper');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const currentPrice = stock?.current_price || 0;
  const symbol = stock?.ticker || 'UNKNOWN';
  const companyName = stock?.name || '';

  useEffect(() => {
    setLimitPrice(currentPrice);
  }, [currentPrice, isOpen]);

  useEffect(() => {
    setTradeType(initialType);
    setQuantity(1);
    setOrderPlaced(false);
    setEnvironment('paper');
    setOrderType('market');
    setShowTooltip(false);
  }, [initialType, isOpen]);

  const effectivePrice = orderType === 'limit' ? limitPrice : currentPrice;
  const estimatedTotal = (quantity * effectivePrice).toFixed(2);
  const isBuy = tradeType === 'buy';

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (environment === 'real') return;

    setTimeout(() => {
      setOrderPlaced(true);
      setTimeout(() => {
        setOrderPlaced(false);
        onClose();
      }, 2000);
    }, 800);
  };

  if (!isOpen || !stock) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up overflow-hidden">
        {!orderPlaced ? (
          <div className="flex flex-col h-full">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground font-brand">Review Order</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex bg-secondary p-1 rounded-xl">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${isBuy ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${!isBuy ? 'bg-destructive text-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Order Type</span>
                  <div className="flex bg-secondary rounded-lg p-0.5 border border-border">
                    <button onClick={() => setOrderType('market')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${orderType === 'market' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}>Market</button>
                    <button onClick={() => setOrderType('limit')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${orderType === 'limit' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}>Limit</button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm font-medium">Quantity</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} className="w-24 bg-card border border-border rounded-lg px-3 py-2 text-right text-foreground font-mono text-sm focus:border-primary focus:outline-none transition-colors" />
                    <span className="text-muted-foreground text-xs font-medium w-8">shares</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-sm font-medium">{orderType === 'limit' ? 'Limit Price' : 'Market Price'}</span>
                    <div className="relative">
                      <Info size={14} className="text-muted-foreground cursor-help hover:text-foreground transition-colors" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} />
                      {showTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-secondary border border-border rounded-lg shadow-xl p-3 z-50 pointer-events-none">
                          <div className="text-foreground text-xs font-bold mb-1">{orderType === 'market' ? 'Market Order' : 'Limit Order'}</div>
                          <div className="text-muted-foreground text-[10px] leading-relaxed">{orderType === 'market' ? 'Executes immediately at the current market price.' : 'Executes only when the price reaches your specified limit.'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {orderType === 'limit' ? (
                      <input type="number" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)} className={`w-24 bg-card border rounded-lg px-3 py-2 text-right text-foreground font-mono text-sm focus:outline-none transition-colors ${isBuy ? 'border-primary' : 'border-destructive'}`} />
                    ) : (
                      <span className="text-foreground font-mono text-sm px-3 py-2">${currentPrice.toFixed(2)}</span>
                    )}
                    <span className="text-muted-foreground text-xs font-medium w-8">USD</span>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 border border-border rounded-xl p-4 flex justify-between items-center">
                <span className="text-foreground/70 text-sm font-medium">Estimated Total</span>
                <span className={`font-mono text-xl font-bold ${isBuy ? 'text-primary' : 'text-destructive'}`}>${estimatedTotal}</span>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Market Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    MARKET OPEN
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Environment</span>
                  <div className="flex items-center bg-secondary rounded-full p-0.5 border border-border">
                    <button onClick={() => setEnvironment('paper')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all ${environment === 'paper' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground'}`}>
                      <FileText size={10} /> Paper
                    </button>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 text-muted-foreground/40 cursor-not-allowed opacity-60">
                      Real <span className="bg-muted text-[8px] text-foreground px-1 rounded ml-1">SOON</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto flex gap-3">
              <button onClick={onClose} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-muted-foreground border border-border hover:bg-secondary hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleTrade} className={`flex-[2] py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isBuy ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-foreground hover:bg-destructive/90'}`}>
                {isBuy ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                Confirm {isBuy ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full min-h-[500px]">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isBuy ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2 font-brand">Order Executed</h3>
            <p className="text-muted-foreground max-w-[240px] mx-auto leading-relaxed mb-6">
              You successfully {isBuy ? 'bought' : 'sold'} <span className="text-foreground font-bold">{quantity}</span> shares of <span className="text-foreground font-bold">{symbol}</span>.
            </p>
            <div className="w-full bg-secondary rounded-xl p-4 mb-6 border border-border">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Total Value</span>
                <span>Type</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>${estimatedTotal}</span>
                <span className="uppercase">{environment} Trading</span>
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
