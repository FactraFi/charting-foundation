import { useState } from "react";
import { ArrowRight, DollarSign, Star, Layers, Search } from "lucide-react";
import FactraScoreGauge from "@/components/FactraScoreGauge";
import { MOCK_STOCKS } from "@/data/mock-data";
import type { MockStock } from "@/data/mock-data";

interface ScreenerViewProps {
  onSelectStock: (stock: MockStock) => void;
  onTrade: (stock: MockStock, type: 'buy' | 'sell') => void;
}

/* ── Screener Card ──────────────────────────────── */
const ScreenerCard = ({
  stock,
  onSelect,
  onPlaceOrder,
}: {
  stock: MockStock;
  onSelect: (stock: MockStock) => void;
  onPlaceOrder: (stock: MockStock) => void;
}) => {
  const isBullish = stock.technical === 'Bullish' || stock.technical === 'Strong Buy';

  return (
    <div className="bg-background border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group hover:scale-[1.01] duration-300 flex flex-col h-full relative overflow-hidden">
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground border border-border shadow-md group-hover:border-primary/50 transition-colors">
            {stock.symbol[0]}
          </div>
          <div>
            <div className="text-xl font-bold text-foreground tracking-tight">{stock.symbol}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stock.name}</div>
          </div>
        </div>
        <FactraScoreGauge score={stock.score} minimal={true} />
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-6 relative z-10">
        <span className="text-3xl font-bold text-foreground tracking-tight">${stock.price.toFixed(2)}</span>
        <span className={`text-sm font-bold ${stock.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {stock.change > 0 ? '+' : ''}{stock.change}%
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-y-5 gap-x-8 mb-6 text-sm flex-grow relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Sector</span>
          <span className="text-muted-foreground font-medium truncate">{stock.sector}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Industry</span>
          <span className="text-foreground font-bold uppercase truncate">{stock.industry}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Market Cap</span>
          <span className="text-foreground font-bold">{stock.marketCap}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">P/E Ratio</span>
          <span className="text-foreground font-bold">{stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Signal</span>
          <span className={`font-bold ${stock.score >= 60 ? 'text-primary' : stock.score >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{stock.signal}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Momentum</span>
          <span className={`font-bold ${isBullish ? 'text-primary' : 'text-destructive'}`}>{stock.technical}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Analyst</span>
          <div className="flex text-primary text-[10px]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} fill={i < stock.analystRating ? "currentColor" : "none"} className={i < stock.analystRating ? "text-primary" : "text-muted-foreground/30"} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 relative z-10">
        <button
          onClick={() => onSelect(stock)}
          className="flex-1 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight size={14} /> View Details
        </button>
        <button
          onClick={() => onPlaceOrder(stock)}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
        >
          <DollarSign size={14} /> Place Order
        </button>
      </div>
    </div>
  );
};

/* ── Industry Card ──────────────────────────────── */
const IndustryCard = ({ industry, data }: { industry: string; data: MockStock[] }) => {
  const getDescription = (name: string) => {
    if (name.includes('Tech') || name.includes('Semi')) return 'Software, hardware, semiconductors, and IT services companies.';
    if (name.includes('Auto') || name.includes('Cyclical')) return 'Retail, automotive, travel, and discretionary spending sectors.';
    if (name.includes('Financial') || name.includes('Capital')) return 'Banks, insurance, asset management, and fintech companies.';
    if (name.includes('Comm') || name.includes('Internet')) return 'Telecom, media, entertainment, and digital communications.';
    return 'Companies operating within this specific market sector.';
  };

  const avgScore = Math.round(data.reduce((acc, s) => acc + s.score, 0) / data.length);
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
          <span className={`text-lg font-bold ${scoreColor}`}>{avgScore}</span>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-4">
          <div className="flex -space-x-2">
            {data.slice(0, 4).map((stock, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground" style={{ zIndex: 10 - i }}>
                {stock.symbol[0]}
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

  const filteredStocks = MOCK_STOCKS.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupedData = (key: 'industry' | 'sector') => {
    const groups: Record<string, MockStock[]> = {};
    filteredStocks.forEach(stock => {
      const groupName = stock[key];
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(stock);
    });
    return groups;
  };

  const industryGroups = getGroupedData('industry');
  const sectorGroups = getGroupedData('sector');

  const renderContent = () => {
    if (activeTab === 'All Stocks') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStocks.map((stock) => (
            <ScreenerCard
              key={stock.symbol}
              stock={stock}
              onSelect={onSelectStock}
              onPlaceOrder={(s) => onTrade(s, 'buy')}
            />
          ))}
          {filteredStocks.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No stocks found matching "{searchQuery}"
            </div>
          )}
        </div>
      );
    } else {
      const groups = activeTab === 'Industry' ? industryGroups : sectorGroups;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.keys(groups).map((groupName) => (
            <IndustryCard key={groupName} industry={groupName} data={groups[groupName]} />
          ))}
          {Object.keys(groups).length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No groups found matching "{searchQuery}"
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
            placeholder="Search stocks by name or symbol..."
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
