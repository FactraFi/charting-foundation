import { useState, useEffect, useRef } from "react";
import {
  Activity, ArrowUpRight, Briefcase, Lock, TrendingUp,
  ChevronRight, Search, BarChart2, AlertCircle, Sparkles,
  ChevronDown
} from "lucide-react";
import FactraScoreGauge from "@/components/FactraScoreGauge";
import { useStockData, useStockSearch } from "@/hooks/use-stock-data";
import { useStockSummary } from "@/hooks/use-stock-summary";
import type { StockData } from "@/lib/api";
import CompanyLogo from "@/components/CompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/hooks/use-portfolio";

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onSelectStock?: (stock: StockData) => void;
  onTrade?: (stock: StockData, type: 'buy' | 'sell') => void;
}

/* ── TradingView Chart Widget ────────────────────────── */
const TradingViewChart = ({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartId = `tv_dashboard_${symbol}`;

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const tv = (window as any).TradingView;
    if (!tv) {
      containerRef.current.innerHTML =
        '<p class="text-muted-foreground text-xs text-center py-20">TradingView library not loaded.</p>';
      return;
    }

    new tv.widget({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#050505",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: chartId,
      backgroundColor: "#050505",
      gridColor: "rgba(30,33,40,0.6)",
    });
  }, [symbol, chartId]);

  return (
    <div id={chartId} ref={containerRef} className="w-full h-full" />
  );
};

/* ── Marker data from live stock data ─────────────── */
const buildMarkerData = (stock: StockData) => ({
  technical: {
    snapshot: `Technical analysis for ${stock.ticker}. Beta: ${stock.beta ?? 'N/A'}. Current momentum ${stock.momentum ? (stock.momentum >= 60 ? 'is constructive' : 'shows caution') : 'data pending'}.`,
    items: [
      { label: 'Signal', value: stock.signal, status: stock.signal.toUpperCase(), color: stock.v_score && stock.v_score >= 60 ? 'text-primary' : 'text-destructive' },
      { label: 'Day Change', value: `${stock.day_change_pct > 0 ? '+' : ''}${stock.day_change_pct}%`, status: stock.day_change_pct >= 0 ? 'POSITIVE' : 'NEGATIVE', color: stock.day_change_pct >= 0 ? 'text-primary' : 'text-destructive' },
      { label: 'Volume', value: formatVolume(stock.volume), status: 'CURRENT', color: 'text-foreground' },
      { label: 'Beta', value: stock.beta?.toFixed(2) ?? 'N/A', status: stock.beta && stock.beta > 1.2 ? 'HIGH' : 'NORMAL', color: stock.beta && stock.beta > 1.2 ? 'text-yellow-500' : 'text-primary' },
      { label: 'Prev Close', value: `$${stock.previous_close.toFixed(2)}`, status: 'REF', color: 'text-foreground' },
      { label: 'Momentum', value: stock.momentum?.toString() ?? 'N/A', status: stock.momentum && stock.momentum >= 60 ? 'BULLISH' : 'PENDING', color: stock.momentum && stock.momentum >= 60 ? 'text-primary' : 'text-muted-foreground' },
    ],
  },
  fundamental: {
    snapshot: `Fundamental profile for ${stock.name}. ${stock.pe_ratio ? `Trading at ${stock.pe_ratio.toFixed(1)}x earnings.` : ''} ${stock.roe ? `ROE: ${stock.roe}.` : ''} ${stock.profit_margin ? `Profit margin: ${stock.profit_margin}.` : ''}`,
    items: [
      { label: 'P/E Ratio', value: stock.pe_ratio?.toFixed(1) ?? 'N/A', status: stock.pe_ratio && stock.pe_ratio > 30 ? 'PREMIUM' : 'FAIR', color: stock.pe_ratio && stock.pe_ratio > 30 ? 'text-yellow-500' : 'text-primary' },
      { label: 'Forward P/E', value: stock.forward_pe?.toFixed(1) ?? 'N/A', status: stock.forward_pe && stock.forward_pe < (stock.pe_ratio ?? 999) ? 'IMPROVING' : 'STABLE', color: 'text-foreground' },
      { label: 'Debt/Equity', value: stock.debt_to_equity?.toFixed(2) ?? 'N/A', status: stock.debt_to_equity && stock.debt_to_equity < 1 ? 'HEALTHY' : 'LEVERAGED', color: stock.debt_to_equity && stock.debt_to_equity < 1 ? 'text-primary' : 'text-yellow-500' },
      { label: 'ROE', value: stock.roe ?? 'N/A', status: 'RETURN', color: 'text-primary' },
      { label: 'Profit Margin', value: stock.profit_margin ?? 'N/A', status: 'MARGIN', color: 'text-primary' },
      { label: 'Rev. Growth', value: stock.revenue_growth ?? 'N/A', status: stock.revenue_growth ? 'GROWING' : 'N/A', color: 'text-primary' },
    ],
  },
  sentiment: {
    snapshot: `Market sentiment for ${stock.ticker}. ${stock.analyst_target ? `Analyst target: $${stock.analyst_target.toFixed(2)}.` : ''} ${stock.analyst_rating ? `Consensus rating: ${stock.analyst_rating.toFixed(1)}/5.` : ''} ${stock.dividend_yield ? `Dividend yield: ${stock.dividend_yield.toFixed(2)}%.` : ''}`,
    items: [
      { label: 'Analyst Rating', value: stock.analyst_rating ? `${stock.analyst_rating.toFixed(1)}/5` : 'N/A', status: stock.analyst_rating && stock.analyst_rating >= 4 ? 'BULLISH' : 'MIXED', color: stock.analyst_rating && stock.analyst_rating >= 4 ? 'text-primary' : 'text-yellow-500' },
      { label: 'Price Target', value: stock.analyst_target ? `$${stock.analyst_target.toFixed(2)}` : 'N/A', status: stock.analyst_target && stock.analyst_target > stock.current_price ? 'UPSIDE' : 'N/A', color: stock.analyst_target && stock.analyst_target > stock.current_price ? 'text-primary' : 'text-foreground' },
      { label: 'Dividend Yield', value: stock.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : 'N/A', status: 'YIELD', color: 'text-foreground' },
      { label: 'EPS Growth', value: stock.eps_growth ?? 'N/A', status: stock.eps_growth ? 'GROWING' : 'N/A', color: 'text-primary' },
      { label: 'Sentiment Score', value: stock.sentiment?.toString() ?? 'N/A', status: stock.sentiment && stock.sentiment >= 60 ? 'POSITIVE' : 'PENDING', color: stock.sentiment && stock.sentiment >= 60 ? 'text-primary' : 'text-muted-foreground' },
      { label: 'Market Cap', value: stock.market_cap, status: 'SIZE', color: 'text-foreground' },
    ],
  },
});

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
}

const DashboardView = ({ setActiveTab, onSelectStock, onTrade }: DashboardViewProps) => {
  const { profile } = useAuth();
  const { data: holdings } = usePortfolio();
  const cashBalance = profile?.cash_balance ?? 0;
  const [markerType, setMarkerType] = useState('technical');
  const [isMarkersDropdownOpen, setIsMarkersDropdownOpen] = useState(false);
  const markersDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTicker, setActiveTicker] = useState('NVDA');

  // Hero search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Live data
  const { data: activeStock, isLoading } = useStockData(activeTicker);
  const { data: searchResults } = useStockSearch(heroSearchQuery, isSearchOpen && heroSearchQuery.length >= 1);
  const { data: summary, isLoading: summaryLoading } = useStockSummary(activeStock ?? null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (markersDropdownRef.current && !markersDropdownRef.current.contains(event.target as Node)) setIsMarkersDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStockSelect = (ticker: string) => {
    setActiveTicker(ticker);
    setIsSearchOpen(false);
    setHeroSearchQuery('');
  };

  const getPillarColor = (score: number | null, isRisk = false) => {
    if (score === null) return 'text-muted-foreground';
    if (isRisk) return score <= 40 ? 'text-primary' : score <= 70 ? 'text-yellow-500' : 'text-destructive';
    return score >= 80 ? 'text-primary' : score >= 60 ? 'text-yellow-500' : 'text-destructive';
  };

  const getPillarLabel = (score: number | null, isRisk = false): string => {
    if (score === null) return 'Pending';
    if (isRisk) return score <= 30 ? 'Low' : score <= 60 ? 'Moderate' : 'High';
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Weak';
    return 'Poor';
  };

  if (isLoading || !activeStock) {
    return (
      <div className="space-y-8 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
        <Skeleton className="h-[600px] rounded-3xl" />
      </div>
    );
  }

  const markerData = buildMarkerData(activeStock);

  const pillars = [
    { key: 'fundamentals' as const, label: 'Fundamentals', icon: BarChart2, desc: 'Earnings quality, balance sheet strength, and financial health', score: activeStock.fundamentals },
    { key: 'momentum' as const, label: 'Momentum', icon: Activity, desc: 'Price trends, relative strength, and technical indicators', score: activeStock.momentum },
    { key: 'risk' as const, label: 'Risk', icon: AlertCircle, desc: 'Volatility profile, drawdown potential, and market sensitivity', isRisk: true, score: activeStock.risk },
    { key: 'sentiment' as const, label: 'Sentiment', icon: TrendingUp, desc: 'Analyst ratings, institutional flow, and market positioning', score: activeStock.sentiment },
  ];

  return (
    <div className="space-y-8 pb-10 relative">
      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-card border border-border rounded-2xl divide-y sm:divide-y-0 lg:divide-x divide-border shadow-lg animate-fade-in-up">
        <div className="p-6 hover:bg-foreground/[0.03] transition-colors cursor-default group">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
            <Briefcase size={14} /> Total Equity
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-sm text-muted-foreground">Cash balance</div>
        </div>
        <div className="p-6 hover:bg-foreground/[0.03] transition-colors cursor-default group">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
            <ArrowUpRight size={14} /> Day's P&L
          </div>
          <div className="text-2xl font-bold text-muted-foreground mb-1 tracking-tight">--</div>
          <div className="text-sm text-muted-foreground">No trades yet</div>
        </div>
        <div className="p-6 hover:bg-foreground/[0.03] transition-colors cursor-default group">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
            <Lock size={14} /> Buying Power
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-sm text-muted-foreground">Available cash</div>
        </div>
        <div
          className="p-6 flex items-center justify-between group cursor-pointer hover:bg-foreground/[0.03] transition-colors"
          onClick={() => setActiveTab('portfolio')}
        >
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
              <Activity size={14} /> Portfolio XIRR
            </div>
            <div className="text-2xl font-bold text-muted-foreground tracking-tight">--</div>
            <div className="text-sm text-muted-foreground">N/A</div>
          </div>
          <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative w-full rounded-3xl overflow-hidden glass-panel group animate-fade-in-up delay-100 hover-glow">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent opacity-50 blur-3xl group-hover:opacity-70 transition-opacity duration-1000" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-info/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-10">
          <div className="flex-1 space-y-6 text-center md:text-left w-full">
            {/* Stock Switcher */}
            <div className="relative inline-block" ref={searchContainerRef}>
              <div
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 border ${isSearchOpen ? 'bg-secondary border-primary w-64' : 'bg-primary/10 border-primary/20 hover:bg-primary/20 w-auto'}`}
              >
                <Search size={14} className="text-primary" />
                {isSearchOpen ? (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search any stock..."
                    className="bg-transparent border-none text-xs font-bold text-foreground focus:outline-none w-full placeholder-muted-foreground uppercase tracking-wider"
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                  />
                ) : (
                  <span className="text-primary text-xs font-bold uppercase tracking-wider">SEARCH</span>
                )}
              </div>

              {isSearchOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults && searchResults.length > 0 ? (
                      searchResults.map(result => (
                        <button
                          key={result.ticker}
                          onClick={() => handleStockSelect(result.ticker)}
                          className="w-full text-left px-4 py-3 hover:bg-foreground/5 flex items-center justify-between border-b border-border last:border-0"
                        >
                          <div>
                            <div className="text-sm font-bold text-foreground">{result.ticker}</div>
                            <div className="text-[10px] text-muted-foreground">{result.name}</div>
                          </div>
                        </button>
                      ))
                    ) : heroSearchQuery.length >= 1 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        {heroSearchQuery.length < 2 ? 'Type to search...' : 'No stocks found'}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">Type a ticker or name...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ticker & Price */}
            <div className="animate-fade-in-up">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[0_0_20px_hsl(var(--primary)/0.4)] overflow-hidden">
                    <CompanyLogo ticker={activeStock.ticker} size={64} className="rounded-full object-cover" />
                  </div>
                  <h1
                    className="text-6xl md:text-7xl font-bold text-foreground tracking-tighter leading-none cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onSelectStock?.(activeStock)}
                  >
                    {activeStock.ticker}
                  </h1>
                </div>
                <div className="flex items-center gap-3 pb-1">
                  <span className="text-3xl text-foreground font-mono font-medium">${activeStock.current_price.toFixed(2)}</span>
                  <div className={`px-2 py-1 rounded-lg border ${activeStock.day_change_pct >= 0 ? 'bg-primary/20 border-primary/30' : 'bg-destructive/20 border-destructive/30'}`}>
                    <span className={`text-lg font-bold ${activeStock.day_change_pct >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {activeStock.day_change_pct > 0 ? '+' : ''}{activeStock.day_change_pct}%
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectStock?.(activeStock)}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_15px_hsl(var(--primary)/0.3)] ml-2 flex items-center gap-1"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onTrade?.(activeStock, 'buy')}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_15px_hsl(var(--primary)/0.3)] flex items-center gap-1"
                  >
                    Place Order
                  </button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                <span className="font-bold text-primary underline underline-offset-2">Summary:</span>{' '}
                {summaryLoading ? (
                  <span className="italic text-muted-foreground">Generating summary...</span>
                ) : (
                  <span>{summary ?? `${activeStock.name} — ${activeStock.sector} / ${activeStock.industry}. Signal: ${activeStock.signal}`}</span>
                )}
                {!activeStock.has_scores && <span className="ml-2 text-yellow-500 text-xs">(V-Score pending)</span>}
              </div>
            </div>

            {/* 4 Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 w-full animate-fade-in-up delay-100">
              {pillars.map(pillar => (
                <div key={pillar.key} className="bg-background/40 p-6 rounded-xl backdrop-blur-md border border-foreground/5 hover:border-primary/40 transition-all group/card hover:-translate-y-1 flex flex-col justify-between min-h-[180px]">
                  <div className="space-y-1">
                    <div className="text-muted-foreground mb-2 text-[10px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-2">
                      <pillar.icon size={12} /> {pillar.label}
                    </div>
                    <div className="text-foreground font-sans text-4xl font-bold tracking-tighter">
                      {pillar.score ?? '—'}
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wide font-sans ${getPillarColor(pillar.score, pillar.isRisk)}`}>
                      {getPillarLabel(pillar.score, pillar.isRisk)}
                    </div>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-4 opacity-80">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Score Gauge */}
          <div className="flex flex-col items-center gap-8 shrink-0 relative z-10">
            <div className="scale-110 md:scale-100 transition-transform hover:scale-105 duration-500">
              <FactraScoreGauge score={activeStock.v_score ?? 0} size="large" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — Chart + Markers */}
      <div className="glass-panel rounded-3xl p-8 border border-foreground/10 shadow-2xl animate-fade-in-up delay-300 relative overflow-hidden group hover-glow">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] -z-10 group-hover:bg-primary/10 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-info/5 blur-[100px] -z-10 group-hover:bg-info/10 transition-colors duration-1000" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-stretch">
          {/* Chart — TradingView Widget */}
          <div className="flex flex-col justify-center space-y-8 min-h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Activity size={28} className="text-primary" /> Stock Performance
                </h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Real-time price trajectory & volume analysis</p>
              </div>
            </div>

            <div className="h-[600px] w-full relative">
              <TradingViewChart symbol={activeStock.ticker} />
            </div>
          </div>

          {/* Right: Markers */}
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.05)] animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-tighter">Factra Snapshot</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-bold capitalize">
                {markerData[markerType as keyof typeof markerData].snapshot}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative" ref={markersDropdownRef}>
                <button
                  onClick={() => setIsMarkersDropdownOpen(!isMarkersDropdownOpen)}
                  className={`w-full bg-card border ${isMarkersDropdownOpen ? 'border-primary/50' : 'border-foreground/10'} text-foreground font-bold py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-foreground/5 shadow-inner active:scale-[0.98] group`}
                >
                  <span className="capitalize">{markerType} Markers</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 text-muted-foreground group-hover:text-primary ${isMarkersDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMarkersDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-foreground/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-fade-in-up backdrop-blur-xl">
                    {['technical', 'fundamental', 'sentiment'].map((type) => (
                      <button
                        key={type}
                        onClick={() => { setMarkerType(type); setIsMarkersDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors border-b border-foreground/[0.03] last:border-0 hover:bg-primary/10 hover:text-primary flex items-center justify-between ${markerType === type ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                      >
                        <span className="capitalize">{type} Markers</span>
                        {markerType === type && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {markerData[markerType as keyof typeof markerData].items.map((indicator, idx) => (
                  <div key={idx} className="bg-foreground/5 border border-foreground/[0.03] p-4 rounded-2xl hover:bg-foreground/[0.08] transition-all duration-300 group/indicator hover:translate-x-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-muted-foreground font-bold">{indicator.label}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-background/40 ${indicator.color}`}>{indicator.status}</span>
                    </div>
                    <div className="text-xl font-black text-foreground tracking-tighter">{indicator.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
