import { useState } from "react";
import {
  ChevronLeft, ChevronDown, Plus, RefreshCcw,
  TrendingUp, MessageSquare, BarChart3
} from "lucide-react";
import type { StockData } from "@/lib/api";
import CompanyLogo from "@/components/CompanyLogo";
import { useStockSummary } from "@/hooks/use-stock-summary";

interface MarkerSectionProps {
  stock: StockData;
  onBack: () => void;
  onTrade?: (stock: StockData, type: 'buy' | 'sell') => void;
}

const buildMarkerDetail = (stock: StockData) => ({
  Technical: [
    { label: 'Signal', value: stock.signal, color: stock.v_score && stock.v_score >= 60 ? 'text-primary' : 'text-destructive' },
    { label: 'Day Change', value: `${stock.day_change_pct > 0 ? '+' : ''}${stock.day_change_pct}%`, color: stock.day_change_pct >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'Volume', value: formatVol(stock.volume), color: 'text-foreground' },
    { label: 'Beta', value: stock.beta?.toFixed(2) ?? 'N/A', color: stock.beta && stock.beta > 1.2 ? 'text-yellow-500' : 'text-primary' },
    { label: 'Prev Close', value: `$${stock.previous_close.toFixed(2)}`, color: 'text-foreground' },
    { label: 'Momentum Score', value: stock.momentum?.toString() ?? 'Pending', color: stock.momentum && stock.momentum >= 60 ? 'text-primary' : 'text-muted-foreground' },
  ],
  Sentiment: [
    { label: 'Analyst Rating', value: stock.analyst_rating ? `${stock.analyst_rating.toFixed(1)}/5` : 'N/A', color: stock.analyst_rating && stock.analyst_rating >= 4 ? 'text-primary' : 'text-yellow-500' },
    { label: 'Price Target', value: stock.analyst_target ? `$${stock.analyst_target.toFixed(2)}` : 'N/A', color: stock.analyst_target && stock.analyst_target > stock.current_price ? 'text-primary' : 'text-foreground' },
    { label: 'Dividend Yield', value: stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : 'N/A', color: 'text-foreground' },
    { label: 'EPS Growth', value: stock.eps_growth ?? 'N/A', color: 'text-primary' },
    { label: 'Sentiment Score', value: stock.sentiment?.toString() ?? 'Pending', color: stock.sentiment && stock.sentiment >= 60 ? 'text-primary' : 'text-muted-foreground' },
    { label: 'Market Cap', value: stock.market_cap, color: 'text-foreground' },
  ],
  Fundamental: [
    { label: 'P/E Ratio (TTM)', value: stock.pe_ratio?.toFixed(1) ?? 'N/A', color: stock.pe_ratio && stock.pe_ratio > 30 ? 'text-yellow-500' : 'text-foreground' },
    { label: 'Forward P/E', value: stock.forward_pe?.toFixed(1) ?? 'N/A', color: 'text-primary' },
    { label: 'ROE', value: stock.roe ?? 'N/A', color: 'text-primary' },
    { label: 'ROCE', value: stock.roce ?? 'N/A', color: 'text-primary' },
    { label: 'Debt/Equity', value: stock.debt_to_equity?.toFixed(2) ?? 'N/A', color: stock.debt_to_equity && stock.debt_to_equity < 1 ? 'text-primary' : 'text-yellow-500' },
    { label: 'Profit Margin', value: stock.profit_margin ?? 'N/A', color: 'text-primary' },
    { label: 'Operating Margin', value: stock.operating_margin ?? 'N/A', color: 'text-primary' },
    { label: 'Revenue Growth', value: stock.revenue_growth ?? 'N/A', color: 'text-primary' },
    { label: 'EPS Growth', value: stock.eps_growth ?? 'N/A', color: 'text-primary' },
    { label: 'Fundamentals Score', value: stock.fundamentals?.toString() ?? 'Pending', color: stock.fundamentals && stock.fundamentals >= 60 ? 'text-primary' : 'text-muted-foreground' },
  ],
});

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
}

const markerTypes = ['Technical', 'Sentiment', 'Fundamental'] as const;

const getMarkerIcon = (type: string) => {
  switch (type) {
    case 'Technical': return <TrendingUp size={14} className="text-primary" />;
    case 'Sentiment': return <MessageSquare size={14} className="text-primary" />;
    case 'Fundamental': return <BarChart3 size={14} className="text-primary" />;
    default: return null;
  }
};

const MarkerSection = ({ stock, onBack }: MarkerSectionProps) => {
  const [selectedMarker, setSelectedMarker] = useState('Technical');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: summary, isLoading: summaryLoading } = useStockSummary(stock);

  const markerDetail = buildMarkerDetail(stock);
  const currentMetrics = markerDetail[selectedMarker as keyof typeof markerDetail];

  return (
    <div className="bg-background border border-border rounded-xl p-6 hover:border-primary/30 transition-all relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start gap-8 relative z-10 flex-wrap lg:flex-nowrap">
        {/* Left Side: Ticker Info */}
        <div className="flex items-start gap-4 min-w-[400px]">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors mt-2">
            <ChevronLeft size={24} />
          </button>
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-foreground border border-border shadow-md overflow-hidden">
            <CompanyLogo ticker={stock.ticker} size={64} className="rounded-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl font-bold text-foreground tracking-tight">{stock.ticker}</div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs font-bold text-muted-foreground hover:bg-foreground/5 transition-colors">
                <Plus size={12} /> Watchlist
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-bold text-foreground tracking-tight">${stock.current_price.toFixed(2)}</span>
              <span className={`text-base font-bold px-2.5 py-1 rounded ${stock.day_change_pct >= 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {stock.day_change_pct > 0 ? '+' : ''}{stock.day_change_pct}%
              </span>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed max-w-[350px]">
              <span className="font-bold text-foreground underline underline-offset-2">Summary:</span>{' '}
              {summaryLoading ? (
                <span className="italic text-muted-foreground">Generating summary...</span>
              ) : (
                <span>{summary ?? `${stock.name} — ${stock.sector} / ${stock.industry}. Signal: ${stock.signal}`}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Markers */}
        <div className="flex-1 border-l border-border pl-8">
          <div className="relative mb-4">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                {getMarkerIcon(selectedMarker)}
                <span className="text-sm font-bold text-foreground uppercase tracking-wider">{selectedMarker} Markers</span>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-border rounded-lg overflow-hidden z-50 shadow-xl">
                {markerTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setSelectedMarker(type); setIsDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors ${selectedMarker === type ? 'bg-primary/20' : ''}`}
                  >
                    {getMarkerIcon(type)}
                    <span className="text-xs font-bold text-foreground">{type} Markers</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {currentMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                <span className={`text-xs font-bold ${metric.color}`}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkerSection;
