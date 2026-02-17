import { useState } from "react";
import { ArrowRight, DollarSign, Star, Layers, Search } from "lucide-react";
import FactraScoreGauge from "@/components/FactraScoreGauge";
import { useStockUniverse, useStockSearch } from "@/hooks/use-stock-data";
import { useBatchPrices } from "@/hooks/use-batch-prices";
import type { StockData, StockScoreRow, BatchPriceData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/CompanyLogo";

interface ScreenerViewProps {
  onSelectStock: (stock: StockData) => void;
  onTrade: (stock: StockData, type: 'buy' | 'sell') => void;
}

/* ── Mini stock data for screener cards ─────────────── */
interface ScreenerStock {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  v_score: number | null;
  signal: string;
}

/* ── Screener Card (simplified — fetches own price) ── */
const ScreenerCard = ({
  stock,
  priceData,
  onSelect,
  onPlaceOrder,
}: {
  stock: ScreenerStock;
  priceData?: BatchPriceData;
  onSelect: (ticker: string) => void;
  onPlaceOrder: (ticker: string) => void;
}) => {

  return (
    <div className="bg-background border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group hover:scale-[1.01] duration-300 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground border border-border shadow-md group-hover:border-primary/50 transition-colors overflow-hidden">
            <CompanyLogo ticker={stock.ticker} size={48} className="rounded-full object-cover" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground tracking-tight">{stock.ticker}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stock.name || stock.ticker}</div>
          </div>
        </div>
        <FactraScoreGauge score={stock.v_score ?? 0} minimal={true} />
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-6 relative z-10">
        {priceData ? (
          <>
            <span className="text-3xl font-bold text-foreground tracking-tight">${priceData.current_price.toFixed(2)}</span>
            <span className={`text-sm font-bold ${priceData.day_change_pct >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {priceData.day_change_pct > 0 ? '+' : ''}{priceData.day_change_pct}%
            </span>
          </>
        ) : (
          <Skeleton className="h-8 w-32" />
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-y-5 gap-x-8 mb-6 text-sm flex-grow relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Sector</span>
          <span className="text-muted-foreground font-medium truncate">{stock.sector || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Industry</span>
          <span className="text-foreground font-bold uppercase truncate">{stock.industry || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Market Cap</span>
          <span className="text-foreground font-bold">—</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">P/E Ratio</span>
          <span className="text-foreground font-bold">—</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Signal</span>
          <span className={`font-bold ${(stock.v_score ?? 0) >= 60 ? 'text-primary' : (stock.v_score ?? 0) >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>
            {stock.signal}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">V-Score</span>
          <span className="text-primary font-bold">{stock.v_score ?? '—'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 relative z-10">
        <button
          onClick={() => onSelect(stock.ticker)}
          className="flex-1 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight size={14} /> View Details
        </button>
        <button
          onClick={() => onPlaceOrder(stock.ticker)}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
        >
          <DollarSign size={14} /> Place Order
        </button>
      </div>
    </div>
  );
};

/* ── Industry Card ──────────────────────────────── */
const IndustryCard = ({ industry, data }: { industry: string; data: ScreenerStock[] }) => {
  const getDescription = (name: string) => {
    if (name.includes('Tech') || name.includes('Semi')) return 'Software, hardware, semiconductors, and IT services companies.';
    if (name.includes('Auto') || name.includes('Cyclical')) return 'Retail, automotive, travel, and discretionary spending sectors.';
    if (name.includes('Financial') || name.includes('Capital')) return 'Banks, insurance, asset management, and fintech companies.';
    if (name.includes('Comm') || name.includes('Internet')) return 'Telecom, media, entertainment, and digital communications.';
    return 'Companies operating within this specific market sector.';
  };

  const scores = data.filter(s => s.v_score !== null).map(s => s.v_score!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const scoreColor = avgScore >= 70 ? 'text-primary' : avgScore >= 50 ? 'text-yellow-500' : 'text-destructive';

  return (
    <div className="bg-background border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group hover:scale-[1.01] duration-300 flex flex-col justify-between h-[280px]">
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
          <Layers size={12} /> Industry
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{industry}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{getDescription(industry)}</p>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Avg Score:</span>
          <span className={`text-lg font-bold ${scoreColor}`}>{avgScore || 'N/A'}</span>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-4">
          <div className="flex -space-x-2">
            {data.slice(0, 4).map((stock, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground overflow-hidden" style={{ zIndex: 10 - i }}>
                <CompanyLogo ticker={stock.ticker} size={32} className="rounded-full object-cover" />
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">{data.length} companies</span>
        </div>
      </div>
    </div>
  );
};

/* ── Screener View ──────────────────────────────── */
const ScreenerView = ({ onSelectStock, onTrade }: ScreenerViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Stocks');

  const { data: universe, isLoading: universeLoading } = useStockUniverse();
  const { data: searchResults } = useStockSearch(searchQuery, searchQuery.length >= 1);

  // Convert universe to ScreenerStock format (same as before, just moved above batch call)
  const screenerStocks: ScreenerStock[] = (universe || []).map((s) => ({
    ticker: s.ticker,
    name: s.name || s.ticker,
    sector: s.sector || '',
    industry: s.industry || '',
    v_score: s.v_score,
    signal: s.v_score ? (s.v_score >= 85 ? 'Strong Buy' : s.v_score >= 70 ? 'Buy' : s.v_score >= 50 ? 'Hold' : 'Sell') : '—',
  }));

  // If searching, show search results
  const displayStocks = searchQuery.length >= 1 && searchResults
    ? searchResults.map((r) => ({
        ticker: r.ticker,
        name: r.name,
        sector: r.sector,
        industry: r.industry,
        v_score: screenerStocks.find(s => s.ticker === r.ticker)?.v_score ?? null,
        signal: 'Pending',
      }))
    : screenerStocks;

  // Batch fetch all prices in one request
  const allTickers = displayStocks.map(s => s.ticker);
  const { data: batchPrices } = useBatchPrices(allTickers, allTickers.length > 0);

  const getGroupedData = (key: 'industry' | 'sector') => {
    const groups: Record<string, ScreenerStock[]> = {};
    displayStocks.forEach(stock => {
      const groupName = stock[key] || 'Other';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(stock);
    });
    return groups;
  };

  const handleSelectStock = (ticker: string) => {
    // Navigate to stock detail — we pass a minimal StockData for navigation
    onSelectStock({ ticker, name: ticker, sector: '', industry: '', current_price: 0, day_change_pct: 0, volume: 0, previous_close: 0, market_cap: '', pe_ratio: null, forward_pe: null, debt_to_equity: null, roe: null, roce: null, dividend_yield: null, profit_margin: null, operating_margin: null, revenue_growth: null, eps_growth: null, beta: null, analyst_target: null, analyst_rating: null, year_change: null, v_score: null, fundamentals: null, momentum: null, risk: null, sentiment: null, signal: '', has_scores: false, why_explanation: null });
  };

  const handlePlaceOrder = (ticker: string) => {
    onTrade({ ticker, name: ticker, sector: '', industry: '', current_price: 0, day_change_pct: 0, volume: 0, previous_close: 0, market_cap: '', pe_ratio: null, forward_pe: null, debt_to_equity: null, roe: null, roce: null, dividend_yield: null, profit_margin: null, operating_margin: null, revenue_growth: null, eps_growth: null, beta: null, analyst_target: null, analyst_rating: null, year_change: null, v_score: null, fundamentals: null, momentum: null, risk: null, sentiment: null, signal: '', has_scores: false, why_explanation: null }, 'buy');
  };

  const renderContent = () => {
    if (universeLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      );
    }

    if (activeTab === 'All Stocks') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayStocks.map((stock) => (
            <ScreenerCard
              key={stock.ticker}
              stock={stock}
              priceData={batchPrices?.[stock.ticker]}
              onSelect={handleSelectStock}
              onPlaceOrder={handlePlaceOrder}
            />
          ))}
          {displayStocks.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              {searchQuery ? `No stocks found matching "${searchQuery}"` : 'No scored stocks yet. Scores are being calculated — try searching for any ticker above.'}
            </div>
          )}
        </div>
      );
    } else {
      const groups = activeTab === 'Industry' ? getGroupedData('industry') : getGroupedData('sector');
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.keys(groups).map((groupName) => (
            <IndustryCard key={groupName} industry={groupName} data={groups[groupName]} />
          ))}
          {Object.keys(groups).length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No groups found
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-card border border-border rounded-full px-4 py-2 w-full max-w-md hover:border-muted-foreground focus-within:border-primary transition-colors">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search any stock by name or ticker..."
            className="bg-transparent border-none text-sm text-foreground focus:outline-none w-full placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 bg-card p-1 rounded-full border border-border w-fit">
        {['All Stocks', 'Industry', 'F-Sectors'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};

export default ScreenerView;
