import { useState } from "react";
import {
  ChevronLeft, ChevronDown, Plus, RefreshCcw,
  TrendingUp, MessageSquare, BarChart3
} from "lucide-react";
import type { MockStock } from "@/data/mock-data";

interface MarkerSectionProps {
  stock: MockStock;
  onBack: () => void;
}

const MARKER_DATA_DETAIL: Record<string, { label: string; value: string; color: string }[]> = {
  Technical: [
    { label: 'RSI (14)', value: '68.5', color: 'text-primary' },
    { label: 'MACD Signal', value: 'Bullish', color: 'text-primary' },
    { label: 'MA Cross (50/200)', value: 'Golden', color: 'text-primary' },
    { label: 'Volume Trend', value: 'Above Avg', color: 'text-primary' },
    { label: 'Bollinger Bands', value: 'Upper Band', color: 'text-yellow-500' },
    { label: 'Stochastic', value: 'Overbought', color: 'text-yellow-500' },
    { label: 'ADX (14)', value: '42.3', color: 'text-primary' },
    { label: 'ATR (14)', value: '12.45', color: 'text-foreground' },
    { label: 'OBV Trend', value: 'Rising', color: 'text-primary' },
    { label: 'Parabolic SAR', value: 'Bullish', color: 'text-primary' },
    { label: 'CCI (20)', value: '125.8', color: 'text-yellow-500' },
    { label: 'Williams %R', value: '-15.2', color: 'text-primary' },
  ],
  Sentiment: [
    { label: 'Analyst Rating', value: '⭐⭐⭐⭐', color: 'text-yellow-500' },
    { label: 'Avg Price Target', value: '$950', color: 'text-primary' },
    { label: 'News Sentiment', value: 'Positive', color: 'text-primary' },
    { label: 'Social Media', value: 'Bullish', color: 'text-primary' },
    { label: 'Inst. Ownership', value: '67.2%', color: 'text-foreground' },
    { label: 'Inst. Flow (30D)', value: '+$2.3B', color: 'text-primary' },
    { label: 'Analyst Upgrades', value: '12', color: 'text-primary' },
    { label: 'Analyst Downgrades', value: '2', color: 'text-destructive' },
    { label: 'Short Interest', value: '3.2%', color: 'text-primary' },
    { label: 'Put/Call Ratio', value: '0.68', color: 'text-primary' },
    { label: 'Insider Buying', value: 'Active', color: 'text-primary' },
    { label: 'Hedge Fund Activity', value: 'Accumulating', color: 'text-primary' },
  ],
  Fundamental: [
    { label: 'P/E Ratio (TTM)', value: '72.5', color: 'text-foreground' },
    { label: 'Forward P/E', value: '45.2', color: 'text-primary' },
    { label: 'EPS Growth (YoY)', value: '+24.5%', color: 'text-primary' },
    { label: 'Revenue Growth', value: '+18.3%', color: 'text-primary' },
    { label: 'ROE', value: '32.8%', color: 'text-primary' },
    { label: 'Debt/Equity', value: '0.15', color: 'text-primary' },
    { label: 'Profit Margin', value: '28.5%', color: 'text-primary' },
    { label: 'Operating Margin', value: '35.2%', color: 'text-primary' },
    { label: 'Current Ratio', value: '2.8', color: 'text-primary' },
    { label: 'Quick Ratio', value: '2.3', color: 'text-primary' },
    { label: 'Free Cash Flow', value: '$12.5B', color: 'text-primary' },
    { label: 'Dividend Yield', value: '0.8%', color: 'text-foreground' },
  ],
};

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

  const currentMetrics = MARKER_DATA_DETAIL[selectedMarker];

  return (
    <div className="bg-background border border-border rounded-xl p-6 hover:border-primary/30 transition-all relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start gap-8 relative z-10 flex-wrap lg:flex-nowrap">
        {/* Left Side: Ticker Info */}
        <div className="flex items-start gap-4 min-w-[400px]">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors mt-2">
            <ChevronLeft size={24} />
          </button>
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-foreground border border-border shadow-md">
            {stock.symbol[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-4xl font-bold text-foreground tracking-tight">{stock.symbol}</div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs font-bold text-muted-foreground hover:bg-foreground/5 transition-colors">
                <Plus size={12} /> Watchlist
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-bold text-foreground tracking-tight">${stock.price.toFixed(2)}</span>
              <span className={`text-base font-bold px-2.5 py-1 rounded ${stock.change >= 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {stock.change > 0 ? '+' : ''}{stock.change}%
              </span>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed max-w-[350px]">
              {stock.name} — {stock.sector} / {stock.industry}. Signal: <span className="text-primary font-bold">{stock.signal}</span>
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
