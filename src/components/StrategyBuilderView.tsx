import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Workflow, Play, Zap, TrendingUp, TrendingDown,
  ShieldCheck, BarChart3, CheckCircle2, XCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "@/recharts-adapter";

// ---------- Strategy defaults ----------

interface StrategyConfig {
  smaFast: number;
  smaSlow: number;
  rsiThreshold: number;
  stopLoss: number;
  takeProfit: number;
  useVolFilter: boolean;
  universe: string;
}

const DEFAULT_CONFIG: StrategyConfig = {
  smaFast: 20,
  smaSlow: 50,
  rsiThreshold: 30,
  stopLoss: 5,
  takeProfit: 15,
  useVolFilter: true,
  universe: "sp500",
};

// ---------- Backtest mock results ----------

const EQUITY_CURVE = [
  { month: "Jan", strategy: 10000, benchmark: 10000 },
  { month: "Feb", strategy: 10450, benchmark: 10200 },
  { month: "Mar", strategy: 10120, benchmark: 9800 },
  { month: "Apr", strategy: 11200, benchmark: 10400 },
  { month: "May", strategy: 11800, benchmark: 10650 },
  { month: "Jun", strategy: 12400, benchmark: 10900 },
  { month: "Jul", strategy: 11900, benchmark: 11100 },
  { month: "Aug", strategy: 13100, benchmark: 11300 },
  { month: "Sep", strategy: 13800, benchmark: 11000 },
  { month: "Oct", strategy: 14500, benchmark: 11500 },
  { month: "Nov", strategy: 15200, benchmark: 11800 },
  { month: "Dec", strategy: 16100, benchmark: 12100 },
];

const MONTHLY_RETURNS = [
  { month: "Jan", return: 4.5 },
  { month: "Feb", return: -3.2 },
  { month: "Mar", return: 10.7 },
  { month: "Apr", return: 5.4 },
  { month: "May", return: 5.1 },
  { month: "Jun", return: -4.0 },
  { month: "Jul", return: 10.1 },
  { month: "Aug", return: 5.3 },
  { month: "Sep", return: 5.1 },
  { month: "Oct", return: 4.8 },
  { month: "Nov", return: 5.9 },
  { month: "Dec", return: -1.2 },
];

// ---------- Backtest Modal ----------

const BacktestModal = ({
  isOpen,
  onClose,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: StrategyConfig;
}) => {
  const stats = [
    { label: "Total Return", value: "+61.0%", good: true },
    { label: "Sharpe Ratio", value: "1.84", good: true },
    { label: "Max Drawdown", value: "-8.2%", good: false },
    { label: "Win Rate", value: "68%", good: true },
    { label: "Avg Trade", value: "+2.4%", good: true },
    { label: "Total Trades", value: "47", good: null },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-brand flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" /> Backtest Results
          </DialogTitle>
          <DialogDescription>
            SMA({config.smaFast}/{config.smaSlow}) · RSI &lt; {config.rsiThreshold} · SL {config.stopLoss}% / TP {config.takeProfit}%
          </DialogDescription>
        </DialogHeader>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</p>
              <p className={`text-lg font-bold font-brand tabular-nums ${s.good === true ? "text-primary" : s.good === false ? "text-destructive" : "text-foreground"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Equity curve */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={EQUITY_CURVE}>
              <defs>
                <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(155 100% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(155 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 63%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 10% 63%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(220 15% 7%)", border: "1px solid hsl(220 12% 14%)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="strategy" stroke="hsl(155 100% 50%)" fill="url(#stratGrad)" strokeWidth={2} name="Strategy" />
              <Area type="monotone" dataKey="benchmark" stroke="hsl(220 10% 63%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="S&P 500" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly returns bar */}
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_RETURNS}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 63%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 10% 63%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip contentStyle={{ background: "hsl(220 15% 7%)", border: "1px solid hsl(220 12% 14%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="return" name="Monthly %" radius={[4, 4, 0, 0]} fill="hsl(155 100% 50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="gap-2">
            <Zap size={14} /> Deploy Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Strategy Builder View ----------

const StrategyBuilderView = () => {
  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_CONFIG);
  const [showBacktest, setShowBacktest] = useState(false);

  const update = <K extends keyof StrategyConfig>(key: K, value: StrategyConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-brand text-foreground flex items-center gap-2">
            <Workflow size={24} className="text-primary" /> Strategy Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure rule-based strategies and backtest</p>
        </div>
        <Button className="gap-2" onClick={() => setShowBacktest(true)}>
          <Play size={14} /> Run Backtest
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Moving Averages */}
        <Card className="border-border hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Moving Average Crossover
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">Fast SMA Period</span>
                <span className="tabular-nums text-primary font-bold">{config.smaFast}</span>
              </div>
              <Slider value={[config.smaFast]} min={5} max={50} step={1} onValueChange={([v]) => update("smaFast", v)} />
              <p className="text-[10px] text-muted-foreground">Short-term trend signal (5-50 days)</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">Slow SMA Period</span>
                <span className="tabular-nums text-primary font-bold">{config.smaSlow}</span>
              </div>
              <Slider value={[config.smaSlow]} min={20} max={200} step={5} onValueChange={([v]) => update("smaSlow", v)} />
              <p className="text-[10px] text-muted-foreground">Long-term trend confirmation (20-200 days)</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-bold">Signal:</span> Buy when SMA({config.smaFast}) crosses above SMA({config.smaSlow}). Sell on reverse crossover.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* RSI & Filters */}
        <Card className="border-border hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap size={16} className="text-info" /> RSI & Volume Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">RSI Oversold Threshold</span>
                <span className="tabular-nums text-primary font-bold">{config.rsiThreshold}</span>
              </div>
              <Slider value={[config.rsiThreshold]} min={10} max={50} step={1} onValueChange={([v]) => update("rsiThreshold", v)} />
              <p className="text-[10px] text-muted-foreground">Enter only when RSI(14) falls below this level</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Volume Confirmation</p>
                <p className="text-[10px] text-muted-foreground">Require above-average volume on entry signals</p>
              </div>
              <Switch checked={config.useVolFilter} onCheckedChange={(v) => update("useVolFilter", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">Universe</span>
              </div>
              <Select value={config.universe} onValueChange={(v) => update("universe", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp500">S&P 500</SelectItem>
                  <SelectItem value="nasdaq100">NASDAQ 100</SelectItem>
                  <SelectItem value="watchlist">My Watchlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="border-border hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-yellow-500" /> Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-destructive" /> Stop Loss
                </span>
                <span className="tabular-nums text-destructive font-bold">{config.stopLoss}%</span>
              </div>
              <Slider value={[config.stopLoss]} min={1} max={20} step={0.5} onValueChange={([v]) => update("stopLoss", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" /> Take Profit
                </span>
                <span className="tabular-nums text-primary font-bold">{config.takeProfit}%</span>
              </div>
              <Slider value={[config.takeProfit]} min={5} max={50} step={1} onValueChange={([v]) => update("takeProfit", v)} />
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-500 font-bold">Risk/Reward:</span> 1:{(config.takeProfit / config.stopLoss).toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Strategy summary */}
        <Card className="border-border hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" /> Strategy Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { rule: `Buy when SMA(${config.smaFast}) > SMA(${config.smaSlow})`, active: true },
              { rule: `Enter only when RSI(14) < ${config.rsiThreshold}`, active: true },
              { rule: "Require above-average volume", active: config.useVolFilter },
              { rule: `Stop loss at -${config.stopLoss}%`, active: true },
              { rule: `Take profit at +${config.takeProfit}%`, active: true },
              { rule: `Universe: ${config.universe === "sp500" ? "S&P 500" : config.universe === "nasdaq100" ? "NASDAQ 100" : "Watchlist"}`, active: true },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${item.active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                {item.active ? (
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                ) : (
                  <XCircle size={14} className="text-muted-foreground shrink-0" />
                )}
                {item.rule}
              </div>
            ))}
            <div className="pt-4">
              <Button className="w-full gap-2" onClick={() => setShowBacktest(true)}>
                <Play size={14} /> Run Backtest
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BacktestModal isOpen={showBacktest} onClose={() => setShowBacktest(false)} config={config} />
    </div>
  );
};

export default StrategyBuilderView;
