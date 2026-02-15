import { useState, useEffect, useRef } from "react";
import {
  Activity, ArrowUpRight, Briefcase, Lock, TrendingUp,
  ChevronRight, Search, BarChart2, AlertCircle, Sparkles,
  ChevronDown
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import FactraScoreGauge from "@/components/FactraScoreGauge";
import { MOCK_STOCKS, CHART_DATA_VARIANTS, MARKER_DATA } from "@/data/mock-data";
import type { MockStock } from "@/data/mock-data";

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onSelectStock?: (stock: MockStock) => void;
  onTrade?: (stock: MockStock, type: 'buy' | 'sell') => void;
}

const DashboardView = ({ setActiveTab, onSelectStock, onTrade }: DashboardViewProps) => {
  const [timeRange, setTimeRange] = useState('1D');
  const [markerType, setMarkerType] = useState('technical');
  const [isMarkersDropdownOpen, setIsMarkersDropdownOpen] = useState(false);
  const markersDropdownRef = useRef<HTMLDivElement>(null);
  const [activeStock, setActiveStock] = useState<MockStock>(MOCK_STOCKS[0]);

  // Hero search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (markersDropdownRef.current && !markersDropdownRef.current.contains(event.target as Node)) setIsMarkersDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStockSelect = (stock: MockStock) => {
    setActiveStock(stock);
    setIsSearchOpen(false);
    setHeroSearchQuery('');
  };

  const filteredHeroStocks = heroSearchQuery
    ? MOCK_STOCKS.filter(s => s.symbol.toLowerCase().includes(heroSearchQuery.toLowerCase()) || s.name.toLowerCase().includes(heroSearchQuery.toLowerCase()))
    : MOCK_STOCKS;

  const currentChartData = CHART_DATA_VARIANTS[timeRange] || CHART_DATA_VARIANTS['1D'];

  const getPillarColor = (score: number, isRisk = false) => {
    if (isRisk) return score <= 40 ? 'text-primary' : score <= 70 ? 'text-yellow-500' : 'text-destructive';
    return score >= 80 ? 'text-primary' : score >= 60 ? 'text-yellow-500' : 'text-destructive';
  };

  return (
    <div className="space-y-8 pb-10 relative">
      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-card border border-border rounded-2xl divide-y sm:divide-y-0 lg:divide-x divide-border shadow-lg animate-fade-in-up">
        <div className="p-6 hover:bg-foreground/[0.03] transition-colors cursor-default group">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
            <Briefcase size={14} /> Total Equity
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">$124,592.00</div>
          <div className="text-sm text-primary flex items-center gap-1 font-medium">
            <TrendingUp size={14} /> +4.2% <span className="text-muted-foreground/60 ml-1 font-normal">vs last week</span>
          </div>
        </div>
        <div className="p-6 hover:bg-foreground/[0.03] transition-colors cursor-default group">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
            <ArrowUpRight size={14} /> Day's P&L
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">+$1,840.50</div>
          <div className="text-sm text-primary flex items-center gap-1 font-medium">
            <TrendingUp size={14} /> +1.5%
          </div>
        </div>
        <div className="p-6 hover:bg-foreground/[0.03] transition-colors cursor-default group">
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-foreground transition-colors">
            <Lock size={14} /> Buying Power
          </div>
          <div className="text-2xl font-bold text-foreground mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">$42,000.00</div>
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
            <div className="text-2xl font-bold text-primary tracking-tight">+24.8%</div>
            <div className="text-sm text-muted-foreground">Annualized return</div>
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
                    placeholder="Search stock..."
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
                    {filteredHeroStocks.map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleStockSelect(stock)}
                        className="w-full text-left px-4 py-3 hover:bg-foreground/5 flex items-center justify-between border-b border-border last:border-0"
                      >
                        <div>
                          <div className="text-sm font-bold text-foreground">{stock.symbol}</div>
                          <div className="text-[10px] text-muted-foreground">{stock.name}</div>
                        </div>
                        <div className="text-primary text-xs font-bold">{stock.score}</div>
                      </button>
                    ))}
                    {filteredHeroStocks.length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground">No stocks found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ticker & Price */}
            <div className="animate-fade-in-up">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                    {activeStock.symbol[0]}
                  </div>
                  <h1
                    className="text-6xl md:text-7xl font-bold text-foreground tracking-tighter leading-none cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onSelectStock?.(activeStock)}
                  >
                    {activeStock.symbol}
                  </h1>
                </div>
                <div className="flex items-center gap-3 pb-1">
                  <span className="text-3xl text-foreground font-mono font-medium">${activeStock.price.toFixed(2)}</span>
                  <div className={`px-2 py-1 rounded-lg border ${activeStock.change >= 0 ? 'bg-primary/20 border-primary/30' : 'bg-destructive/20 border-destructive/30'}`}>
                    <span className={`text-lg font-bold ${activeStock.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {activeStock.change > 0 ? '+' : ''}{activeStock.change}%
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

              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                <span className="text-foreground border-b border-primary">Summary:</span> {activeStock.summary}
              </p>
            </div>

            {/* 4 Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 w-full animate-fade-in-up delay-100">
              {[
                { key: 'fundamentals' as const, label: 'Fundamentals', icon: BarChart2, desc: 'Earnings quality, balance sheet strength, and financial health' },
                { key: 'momentum' as const, label: 'Momentum', icon: Activity, desc: 'Price trends, relative strength, and technical indicators' },
                { key: 'risk' as const, label: 'Risk', icon: AlertCircle, desc: 'Volatility profile, drawdown potential, and market sensitivity', isRisk: true },
                { key: 'sentiment' as const, label: 'Sentiment', icon: TrendingUp, desc: 'Analyst ratings, institutional flow, and market positioning' },
              ].map(pillar => {
                const pillarData = activeStock.pillars[pillar.key];
                return (
                  <div key={pillar.key} className="bg-background/40 p-6 rounded-xl backdrop-blur-md border border-foreground/5 hover:border-primary/40 transition-all group/card hover:-translate-y-1 flex flex-col justify-between min-h-[180px]">
                    <div className="space-y-1">
                      <div className="text-muted-foreground mb-2 text-[10px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-2">
                        <pillar.icon size={12} /> {pillar.label}
                      </div>
                      <div className="text-foreground font-sans text-4xl font-bold tracking-tighter">{pillarData.score}</div>
                      <div className={`text-xs font-bold uppercase tracking-wide font-sans ${getPillarColor(pillarData.score, pillar.isRisk)}`}>
                        {pillarData.label}
                      </div>
                    </div>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-4 opacity-80">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score Gauge */}
          <div className="flex flex-col items-center gap-8 shrink-0 relative z-10">
            <div className="scale-110 md:scale-100 transition-transform hover:scale-105 duration-500">
              <FactraScoreGauge score={activeStock.score} size="large" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — Chart + Markers */}
      <div className="glass-panel rounded-3xl p-8 border border-foreground/10 shadow-2xl animate-fade-in-up delay-300 relative overflow-hidden group hover-glow">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] -z-10 group-hover:bg-primary/10 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-info/5 blur-[100px] -z-10 group-hover:bg-info/10 transition-colors duration-1000" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-stretch">
          {/* Chart */}
          <div className="flex flex-col justify-center space-y-8 min-h-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Activity size={28} className="text-primary" /> Stock Performance
                </h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Real-time price trajectory & volume analysis</p>
              </div>
              <div className="flex bg-background p-1 rounded-xl border border-foreground/5">
                {Object.keys(CHART_DATA_VARIANTS).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`text-[10px] font-black px-4 py-2 rounded-lg transition-all duration-500 uppercase tracking-tighter ${timeRange === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[600px] w-full relative group">
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData}>
                  <defs>
                    <linearGradient id="mainChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00FF94" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00FF94" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14%)" vertical={false} strokeOpacity={0.5} />
                  <XAxis dataKey="time" stroke="#4B5563" tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#4B5563" tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0,255,148,0.13)', color: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}
                    itemStyle={{ color: '#00FF94', fontWeight: 900, fontSize: '14px' }}
                    cursor={{ stroke: '#00FF94', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00FF94" strokeWidth={4} fill="url(#mainChartGradient)" animationDuration={1500} animationEasing="ease-in-out" />
                </AreaChart>
              </ResponsiveContainer>
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
                {MARKER_DATA[markerType].snapshot}
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
                {MARKER_DATA[markerType].items.map((indicator, idx) => (
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
