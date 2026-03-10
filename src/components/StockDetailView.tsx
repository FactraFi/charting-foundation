import { useEffect, useRef, useState } from "react";
import {
  Activity, DollarSign, TrendingUp, Briefcase, Zap, Lock, Sparkles
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import MarkerSection from "@/components/MarkerSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useWhyScore } from "@/hooks/use-why-score";
import type { WhyScoreData } from "@/hooks/use-why-score";
import type { StockData } from "@/lib/api";
import { useScoreHistory } from "@/hooks/use-score-history";

interface StockDetailViewProps {
  stock: StockData;
  onBack: () => void;
  onTrade?: (stock: StockData, type: 'buy' | 'sell') => void;
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

/* ── Helper functions ────────────────────────────────── */
const getPillarLabel = (score: number | null, isRisk = false): string => {
  if (score === null) return 'Pending';
  if (isRisk) return score <= 30 ? 'Low' : score <= 60 ? 'Moderate' : 'High';
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Weak';
  return 'Poor';
};

const deriveMetricLabel = (stock: StockData) => [
  { label: "Performance", val: stock.day_change_pct >= 1 ? "OUTPERFORMER" : stock.day_change_pct >= 0 ? "STABLE" : "UNDERPERFORMER", icon: Activity, color: stock.day_change_pct >= 0 ? "text-primary" : "text-destructive" },
  { label: "Valuation", val: stock.pe_ratio ? (stock.pe_ratio > 30 ? "EXPENSIVE" : stock.pe_ratio > 15 ? "FAIR" : "CHEAP") : "N/A", icon: DollarSign, color: stock.pe_ratio && stock.pe_ratio > 30 ? "text-destructive" : "text-primary" },
  { label: "Growth", val: stock.revenue_growth ? (parseFloat(stock.revenue_growth) > 10 ? "ACCELERATING" : "STEADY") : "N/A", icon: TrendingUp, color: "text-primary" },
  { label: "Profitability", val: stock.profit_margin ? (parseFloat(stock.profit_margin) > 20 ? "STRONG" : "MODERATE") : "N/A", icon: Briefcase, color: "text-foreground" },
  { label: "Technicals", val: stock.signal.toUpperCase().includes("BUY") ? "BULLISH" : stock.signal.toUpperCase().includes("SELL") ? "BEARISH" : "NEUTRAL", icon: Zap, color: stock.signal.includes("Buy") ? "text-primary" : "text-destructive" },
  { label: "Risk", val: stock.risk !== null ? (stock.risk <= 40 ? "LOW RISK" : stock.risk <= 70 ? "MODERATE" : "HIGH RISK") : "N/A", icon: Lock, color: stock.risk && stock.risk <= 40 ? "text-primary" : "text-yellow-500" },
];

/* ── Sub-components ──────────────────────────────────── */
const WhyScoreSkeleton = () => (
  <div className="space-y-4 relative z-10">
    <Skeleton className="h-5 w-3/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg bg-foreground/[0.02] border border-foreground/[0.05] space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

const PillarCard = ({ index, label, score, bullets, compact }: {
  index: string;
  label: string;
  score: number | null;
  bullets: { label: string; text: string }[];
  compact?: boolean;
}) => (
  <div className={`rounded-lg bg-foreground/[0.02] border border-foreground/[0.05] ${compact ? 'p-2.5' : 'p-4'}`}>
    <h4 className={`text-primary font-bold flex items-center gap-1.5 font-sans ${compact ? 'text-xs mb-1.5' : 'text-lg mb-3'}`}>
      <span className="opacity-50">{index}.</span> {label} ({score ?? '—'}/100)
    </h4>
    <ul className={`text-muted-foreground font-sans ${compact ? 'space-y-1 text-[11px]' : 'space-y-3'}`}>
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="bg-primary mt-1.5 w-1 h-1 rounded-full shrink-0" />
          <span><strong className="text-foreground tracking-wide">{b.label}:</strong> {b.text}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ── Main Component ──────────────────────────────────── */
const StockDetailView = ({ stock, onBack, onTrade }: StockDetailViewProps) => {
  const { data: whyScore, isLoading: whyLoading } = useWhyScore(stock);
  const [days, setDays] = useState(30);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    () => new Set(["Total", "Fundamentals", "Momentum", "Risk", "Sentiment"])
  );

  const { data: scoreHistory, isLoading: historyLoading } = useScoreHistory(stock.ticker, days);

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const pillars = [
    { key: "fundamentals", label: "Fundamentals", desc: "Earnings & financial health.", score: stock.fundamentals },
    { key: "risk", label: "Risk", desc: "Volatility & drawdown.", score: stock.risk, isRisk: true },
    { key: "sentiment", label: "Sentiment", desc: "Analyst & institutional flow.", score: stock.sentiment },
    { key: "momentum", label: "Momentum", desc: "Price trends & technicals.", score: stock.momentum },
  ];

  const metricsStrip = deriveMetricLabel(stock);

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      {/* Header / Marker Section */}
      <MarkerSection stock={stock} onBack={onBack} onTrade={onTrade} />

      {/* ── Side-by-Side: Score + Why This Score ────── */}
      <div className="bg-background border border-border rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="flex flex-col lg:flex-row gap-5 w-full relative z-10">
        {/* Left Panel: Scorecard Tree */}
        <div className="flex flex-col lg:w-[42%] shrink-0">
          {/* Top Node: FactraFi Score */}
          <div className="flex justify-center mb-0 relative z-20">
            <div className="w-full hover:border-primary p-4 rounded-xl border border-border space-y-2 relative overflow-hidden transition-all group shadow-[0_0_20px_hsl(var(--border)/0.2)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10 text-center">
                <div className="text-[10px] uppercase text-primary font-bold tracking-wider mb-1">FactraFi Total Score</div>
                <div className="flex items-baseline justify-center gap-1.5 mb-1">
                  <span className="text-5xl font-bold text-foreground">{stock.v_score ?? '—'}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                {!stock.has_scores && (
                  <div className="text-[10px] text-muted-foreground animate-pulse">Calculating score...</div>
                )}
                <div className="text-[10px] text-muted-foreground leading-relaxed">Normalized composite across all pillars.</div>
              </div>
            </div>
          </div>

          {/* Connector Lines (Desktop Only) */}
          <div className="hidden lg:block relative h-10 w-full -mt-1 mb-1 z-0">
            <div className="absolute left-1/2 top-0 h-1/2 w-px border-l-2 border-dashed border-muted-foreground/30 -translate-x-1/2">
              <div className="absolute left-0 w-1.5 h-1.5 bg-primary rounded-full -translate-x-1/2 blur-[1px] animate-flow-b-t" style={{ animationDelay: "1.5s" }} />
            </div>
            <div className="absolute top-1/2 left-[12.5%] right-1/2 h-px border-t-2 border-dashed border-muted-foreground/30">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-primary rounded-full -translate-y-1/2 blur-[1px] animate-flow-l-r" style={{ animationDelay: "0.8s" }} />
            </div>
            <div className="absolute top-1/2 left-1/2 right-[12.5%] h-px border-t-2 border-dashed border-muted-foreground/30">
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full -translate-y-1/2 blur-[1px] animate-flow-r-l" style={{ animationDelay: "0.8s" }} />
            </div>
            {[12.5, 37.5, 62.5, 87.5].map((pct, i) => (
              <div key={i} className="absolute top-1/2 h-1/2 w-px border-l-2 border-dashed border-muted-foreground/30 -translate-x-1/2" style={{ left: `${pct}%` }}>
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-primary rounded-full -translate-x-1/2 blur-[1px] animate-flow-b-t" />
              </div>
            ))}
          </div>

          {/* Pillar Cards — 4 in a row on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:mt-0 mt-4 relative z-10 flex-1">
            {pillars.map((p) => (
              <div key={p.key} className="bg-background border border-border p-2.5 rounded-lg hover:border-primary/30 transition-colors relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <div className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">{p.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">{p.score ?? '—'}</span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="relative z-10 mt-auto">
                  <div className="text-primary text-[9px] font-bold uppercase">{getPillarLabel(p.score, p.isRisk)}</div>
                  <div className="text-[8px] text-muted-foreground leading-relaxed">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Why This Score */}
        <div className="lg:w-[58%] flex flex-col">

          <div className="flex justify-between items-center mb-3 relative z-10">
            <h3 className="text-lg font-bold text-foreground tracking-tight underline decoration-primary/30 underline-offset-4 font-sans">Why This Score?</h3>
            <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-0.5 rounded-full border border-border shadow-inner">
              <Sparkles size={10} className="text-primary" />
              <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">AI Enhanced</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed font-sans relative z-10 flex-1 overflow-y-auto">
            {whyLoading ? (
              <WhyScoreSkeleton />
            ) : whyScore ? (
              <>
                <p className="text-xs text-foreground/80 border-l-2 border-primary/40 pl-3 py-0.5">
                  {whyScore.summary}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-2">
                    <PillarCard compact index="01" label="Fundamentals" score={stock.fundamentals} bullets={whyScore.fundamentals.bullets} />
                    <PillarCard compact index="02" label="Momentum" score={stock.momentum} bullets={whyScore.momentum.bullets} />
                  </div>
                  <div className="space-y-2">
                    <PillarCard compact index="03" label="Risk" score={stock.risk} bullets={whyScore.risk.bullets} />
                    <PillarCard compact index="04" label="Sentiment" score={stock.sentiment} bullets={whyScore.sentiment.bullets} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-foreground/80 border-l-2 border-primary/40 pl-3 py-0.5">
                  {stock.has_scores && stock.why_explanation
                    ? stock.why_explanation
                    : stock.has_scores
                      ? <>This V-Score of <strong className="text-foreground">{stock.v_score}/100</strong> for {stock.name} ({stock.ticker}) reflects a composite analysis across all pillars.</>
                      : <>Score is being calculated for {stock.name} ({stock.ticker}). Refresh in a moment.</>
                  }
                </p>
                {stock.has_scores && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="space-y-2">
                      <PillarCard compact index="01" label="Fundamentals" score={stock.fundamentals} bullets={[
                        { label: "Financial Health", text: stock.fundamentals && stock.fundamentals >= 80 ? 'Elite score indicates robust balance sheet.' : stock.fundamentals && stock.fundamentals >= 60 ? 'Solid financials with room for improvement.' : 'Fundamentals suggest caution.' },
                        { label: "Key Metrics", text: `P/E: ${stock.pe_ratio?.toFixed(1) ?? 'N/A'} | D/E: ${stock.debt_to_equity?.toFixed(2) ?? 'N/A'} | ROE: ${stock.roe ?? 'N/A'}` },
                      ]} />
                      <PillarCard compact index="02" label="Momentum" score={stock.momentum} bullets={[
                        { label: "Price Trends", text: stock.momentum && stock.momentum >= 70 ? 'Strong uptrend with buyers in control.' : stock.momentum && stock.momentum >= 50 ? 'Neutral momentum, consolidating.' : 'Bearish momentum, under pressure.' },
                      ]} />
                    </div>
                    <div className="space-y-2">
                      <PillarCard compact index="03" label="Risk" score={stock.risk} bullets={[
                        { label: "Volatility", text: `${stock.risk && stock.risk <= 40 ? 'Low risk — conservative.' : stock.risk && stock.risk <= 70 ? 'Moderate volatility.' : 'High risk — expect swings.'} Beta: ${stock.beta?.toFixed(2) ?? 'N/A'}` },
                      ]} />
                      <PillarCard compact index="04" label="Sentiment" score={stock.sentiment} bullets={[
                        { label: "Market View", text: `${stock.sentiment && stock.sentiment >= 70 ? 'Analysts bullish.' : stock.sentiment && stock.sentiment >= 50 ? 'Mixed sentiment.' : 'Bearish sentiment.'} ${stock.analyst_target ? `Target: $${stock.analyst_target.toFixed(2)}` : ''}` },
                      ]} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* ── Side-by-Side: V-Score History + Price Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: V-Score History */}
        <div className="bg-background border border-border rounded-xl p-5 relative overflow-hidden group flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground tracking-tight font-sans">V-Score History</h3>
            <div className="flex gap-1">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                    days === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          {historyLoading ? (
            <Skeleton className="h-56 rounded-lg flex-1" />
          ) : !scoreHistory || scoreHistory.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm flex-1">No historical data available.</div>
          ) : (
          <div className="h-56 relative z-10 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                {visibleLines.has("Total") && <Line type="monotone" dataKey="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />}
                {visibleLines.has("Fundamentals") && <Line type="monotone" dataKey="Fundamentals" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} dot={false} />}
                {visibleLines.has("Momentum") && <Line type="monotone" dataKey="Momentum" stroke="hsl(188, 85%, 50%)" strokeWidth={1.5} dot={false} />}
                {visibleLines.has("Risk") && <Line type="monotone" dataKey="Risk" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} dot={false} />}
                {visibleLines.has("Sentiment") && <Line type="monotone" dataKey="Sentiment" stroke="hsl(263, 70%, 58%)" strokeWidth={1.5} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}
          {/* Toggle legend */}
          <div className="flex flex-wrap gap-2 mt-3 relative z-10">
            {([
              { key: "Total", color: "hsl(var(--primary))" },
              { key: "Fundamentals", color: "hsl(142, 71%, 45%)" },
              { key: "Momentum", color: "hsl(188, 85%, 50%)" },
              { key: "Risk", color: "hsl(38, 92%, 50%)" },
              { key: "Sentiment", color: "hsl(263, 70%, 58%)" },
            ] as const).map(({ key, color }) => (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all ${
                  visibleLines.has(key)
                    ? "border-border text-foreground"
                    : "border-transparent text-muted-foreground/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: visibleLines.has(key) ? color : "hsl(var(--muted))" }} />
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Price Chart */}
        <div className="bg-background border border-border rounded-xl overflow-hidden relative group flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
          <div className="p-5 pb-0 relative z-10">
            <h3 className="text-lg font-bold text-foreground tracking-tight font-sans">Price Chart</h3>
          </div>
          <div className="flex-1 min-h-[380px] relative z-10">
            <TradingViewWidget symbol={stock.ticker} />
          </div>
        </div>
      </div>

      {/* ── Metrics Strip ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricsStrip.map((m) => (
          <div key={m.label} className="bg-background border border-border rounded-xl p-4 space-y-2 hover:border-primary/30 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center gap-2 relative z-10">
              <m.icon size={14} className={m.color} />
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{m.label}</span>
            </div>
            <div className={`text-sm font-bold relative z-10 ${m.color}`}>{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockDetailView;
