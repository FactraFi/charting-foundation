import { useEffect, useRef } from "react";
import {
  Activity, DollarSign, TrendingUp, Briefcase, Zap, Lock, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import MarkerSection from "@/components/MarkerSection";
import { CHART_DATA_VARIANTS } from "@/data/mock-data";
import type { MockStock } from "@/data/mock-data";

interface StockDetailViewProps {
  stock: MockStock;
  onBack: () => void;
}

/* ── TradingView Chart Widget ────────────────────────── */
const TradingViewWidget = ({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: containerRef.current.id,
      backgroundColor: "#050505",
      gridColor: "rgba(30,33,40,0.6)",
    });
  }, [symbol]);

  return (
    <div
      id={`tv_chart_${symbol}`}
      ref={containerRef}
      className="w-full h-full"
    />
  );
};

/* ── Main Component ──────────────────────────────────── */
const StockDetailView = ({ stock, onBack }: StockDetailViewProps) => {
  const chartData = CHART_DATA_VARIANTS["1D"];

  const vScoreHistory = Array.from({ length: 20 }).map((_, i) => ({
    name: `Day ${i}`,
    Fundamentals: 70 + Math.random() * 20,
    Momentum: 60 + Math.random() * 30,
    Risk: 50 + Math.random() * 20,
    Sentiment: 65 + Math.random() * 25,
  }));

  const pillars = [
    { key: "fundamentals" as const, label: "Fundamentals", desc: "Earnings quality, balance sheet strength, and financial health metrics." },
    { key: "risk" as const, label: "Risk", desc: "Volatility profile, drawdown potential, and market sensitivity." },
    { key: "sentiment" as const, label: "Sentiment", desc: "Analyst ratings, institutional flow, and market positioning." },
    { key: "momentum" as const, label: "Momentum", desc: "Price trends, relative strength, and technical indicators." },
  ];

  return (
    <div className="animate-fade-in-up space-y-8 pb-12">
      {/* Header / Marker Section */}
      <MarkerSection stock={stock} onBack={onBack} />

      {/* ── Scorecard Tree Layout ─────────────────────── */}
      <div className="flex flex-col w-full mb-8">
        {/* Top Node: FactraFi Score */}
        <div className="flex justify-center mb-0 relative z-20">
          <div className="w-full max-w-sm bg-background border-2 border-border hover:border-primary p-6 rounded-xl space-y-3 relative overflow-hidden transition-all group shadow-[0_0_20px_hsl(var(--border)/0.2)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative z-10 text-center">
              <div className="text-xs uppercase text-primary font-bold tracking-wider mb-2">FactraFi Total Score</div>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-bold text-foreground">{stock.score}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <div className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xs mx-auto">Normalized composite score across all pillars.</div>
            </div>
          </div>
        </div>

        {/* Connector Lines (Desktop Only) — Bidirectional converging dots */}
        <div className="hidden lg:block relative h-16 w-full -mt-2 mb-2 z-0">
          {/* Vertical line center → top node */}
          <div className="absolute left-1/2 top-0 h-1/2 w-px border-l-2 border-dashed border-muted-foreground/30 -translate-x-1/2">
            <div className="absolute left-0 w-2 h-2 bg-primary rounded-full -translate-x-1/2 blur-[1px] animate-flow-b-t" style={{ animationDelay: "1.5s" }} />
          </div>

          {/* Horizontal bar left side (flows L→R to center) */}
          <div className="absolute top-1/2 left-[12.5%] right-1/2 h-px border-t-2 border-dashed border-muted-foreground/30">
            <div className="absolute top-0 left-0 w-2 h-2 bg-primary rounded-full -translate-y-1/2 blur-[1px] animate-flow-l-r" style={{ animationDelay: "0.8s" }} />
          </div>

          {/* Horizontal bar right side (flows R→L to center) */}
          <div className="absolute top-1/2 left-1/2 right-[12.5%] h-px border-t-2 border-dashed border-muted-foreground/30">
            <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full -translate-y-1/2 blur-[1px] animate-flow-r-l" style={{ animationDelay: "0.8s" }} />
          </div>

          {/* Vertical drops to each pillar */}
          {[12.5, 37.5, 62.5, 87.5].map((pct, i) => (
            <div key={i} className="absolute top-1/2 h-1/2 w-px border-l-2 border-dashed border-muted-foreground/30 -translate-x-1/2" style={{ left: `${pct}%` }}>
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-primary rounded-full -translate-x-1/2 blur-[1px] animate-flow-b-t" />
            </div>
          ))}
        </div>

        {/* Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-0 mt-6 relative z-10">
          {pillars.map((p) => {
            const data = stock.pillars[p.key];
            return (
              <div key={p.key} className="bg-background border border-border p-5 rounded-xl space-y-2 hover:border-primary/30 transition-colors relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                {/* Mobile connector */}
                <div className="flex justify-center lg:hidden absolute top-0 left-1/2 -translate-x-1/2 -mt-3">
                  <div className="w-px h-3 border-l-2 border-dashed border-border" />
                </div>
                <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider relative z-10">{p.label}</div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-bold text-primary">{data.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="text-primary text-xs font-bold uppercase relative z-10">{data.label}</div>
                <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed relative z-10">{p.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts Section ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TradingView Price Chart */}
        <div className="bg-background border border-border rounded-xl p-6 h-[400px] relative overflow-hidden flex flex-col group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="text-sm font-bold text-foreground mb-4 relative z-10">Price</div>
          <div className="flex-1 relative z-10 min-h-0">
            <TradingViewWidget symbol={stock.symbol} />
          </div>
        </div>

        {/* V-Score History */}
        <div className="bg-background border border-border rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-sm font-bold text-foreground mb-4">V-Score History</div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vScoreHistory} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14%)" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'hsl(220 12% 14%)' }}
                    contentStyle={{ backgroundColor: 'hsl(220 15% 7%)', borderColor: 'hsl(220 12% 14%)', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="Fundamentals" stackId="a" fill="hsl(155 100% 50%)" fillOpacity={0.3} />
                  <Bar dataKey="Momentum" stackId="a" fill="hsl(155 100% 50%)" fillOpacity={0.5} />
                  <Bar dataKey="Risk" stackId="a" fill="hsl(155 100% 50%)" fillOpacity={0.7} />
                  <Bar dataKey="Sentiment" stackId="a" fill="hsl(155 100% 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-border">
              {[
                { label: "Fundamentals", opacity: "opacity-30" },
                { label: "Momentum", opacity: "opacity-50" },
                { label: "Risk", opacity: "opacity-70" },
                { label: "Sentiment", opacity: "" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 bg-primary ${l.opacity}`} />
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Metrics Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Performance", val: "OUTPERFORMER", icon: Activity, color: "text-primary" },
          { label: "Valuation", val: "EXPENSIVE", icon: DollarSign, color: "text-destructive" },
          { label: "Growth", val: "ACCELERATING", icon: TrendingUp, color: "text-primary" },
          { label: "Profitability", val: "MODERATE", icon: Briefcase, color: "text-foreground" },
          { label: "Technicals", val: "BULLISH", icon: Zap, color: "text-primary" },
          { label: "Risk", val: "LOW RISK", icon: Lock, color: "text-primary" },
        ].map((m, i) => (
          <div key={i} className="bg-background border border-border p-4 rounded-xl flex flex-col items-center text-center hover:bg-secondary transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <m.icon size={16} className="text-muted-foreground mb-2" />
              <div className="text-[10px] text-muted-foreground uppercase font-bold">{m.label}</div>
              <div className={`text-xs font-bold mt-1 ${m.color}`}>{m.val}</div>
              <div className={`w-4 h-0.5 mt-2 rounded-full ${m.val.includes("EXPENSIVE") ? "bg-destructive" : m.val === "MODERATE" ? "bg-muted-foreground" : "bg-primary"}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Why This Score? ───────────────────────────── */}
      <div className="bg-background border border-border rounded-xl p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-2xl font-bold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8 font-sans">Why This Score?</h3>
          <div className="flex items-center gap-2 bg-secondary px-4 py-1.5 rounded-full border border-border shadow-inner">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-widest">AI Enhanced</span>
          </div>
        </div>

        <div className="space-y-8 text-base text-muted-foreground leading-relaxed font-sans relative z-10">
          <p className="text-lg text-foreground/80 border-l-2 border-primary/40 pl-6 py-1">
            This V-Score of <strong className="text-foreground">{stock.score}/100</strong> suggests a high-conviction profile for {stock.name} ({stock.symbol}), driven by a combination of exceptional financial health and very positive market perception. While the overall score is strong, the underlying pillars reveal a balance between steady growth and some underlying volatility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-foreground/[0.02] border border-foreground/[0.05]">
                <h4 className="text-primary font-bold mb-3 text-lg flex items-center gap-2 font-sans">
                  <span className="opacity-50">01.</span> Fundamentals ({stock.pillars.fundamentals.score}/100)
                </h4>
                <ul className="space-y-3 text-muted-foreground font-sans">
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Financial Health:</strong> This elite score indicates that the company possesses a robust balance sheet and generates high-quality earnings relative to its peers.</span></li>
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Profitability:</strong> For investors, this suggests the company has a "moat" or competitive advantage that allows it to maintain strong margins despite inflationary pressures.</span></li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-foreground/[0.02] border border-foreground/[0.05]">
                <h4 className="text-primary font-bold mb-3 text-lg flex items-center gap-2 font-sans">
                  <span className="opacity-50">02.</span> Momentum ({stock.pillars.momentum.score}/100)
                </h4>
                <ul className="space-y-3 text-muted-foreground font-sans">
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Price Trends:</strong> A score of {stock.pillars.momentum.score} shows that the stock is in a confirmed uptrend, outperforming many other stocks in the {stock.sector} sector.</span></li>
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Technical Strength:</strong> This indicates that "buyers are in control," though the momentum isn't as extreme as the sentiment, suggesting the move upward has been steady rather than a speculative spike.</span></li>
                </ul>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-foreground/[0.02] border border-foreground/[0.05]">
                <h4 className="text-primary font-bold mb-3 text-lg flex items-center gap-2 font-sans">
                  <span className="opacity-50">03.</span> Risk ({stock.pillars.risk.score}/100)
                </h4>
                <ul className="space-y-3 text-muted-foreground font-sans">
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Volatility:</strong> A score of {stock.pillars.risk.score} is respectable but lower than the other pillars, suggesting the stock may experience sharper drawdowns or price swings than a "low-risk" utility stock.</span></li>
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Risk-Adjusted Returns:</strong> Investors should be aware that while the upside is strong, they must be comfortable with moderate price fluctuations.</span></li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-foreground/[0.02] border border-foreground/[0.05]">
                <h4 className="text-primary font-bold mb-3 text-lg flex items-center gap-2 font-sans">
                  <span className="opacity-50">04.</span> Sentiment ({stock.pillars.sentiment.score}/100)
                </h4>
                <ul className="space-y-3 text-muted-foreground font-sans">
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Analyst Ratings:</strong> This "Sentiment" score of {stock.pillars.sentiment.score} is the strongest of the four pillars, signaling that Wall Street analysts are exceptionally bullish on the stock's future.</span></li>
                  <li className="flex gap-3"><span className="bg-primary mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" /><span><strong className="text-foreground tracking-wide">Market Positioning:</strong> It appears that institutional investors are accumulating shares, betting on continued outperformance.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailView;
