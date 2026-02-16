import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { MOCK_STOCKS, type MockStock } from "@/data/mock-data";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "@/recharts-adapter";

// ---------- Portfolio mock data ----------

interface Holding {
  stock: MockStock;
  shares: number;
  avgCost: number;
  allocation: number;
}

const INITIAL_HOLDINGS: Holding[] = [
  { stock: MOCK_STOCKS[0], shares: 12, avgCost: 780.00, allocation: 32 },
  { stock: MOCK_STOCKS[2], shares: 45, avgCost: 142.30, allocation: 22 },
  { stock: MOCK_STOCKS[6], shares: 18, avgCost: 385.20, allocation: 22 },
  { stock: MOCK_STOCKS[4], shares: 30, avgCost: 165.50, allocation: 15 },
  { stock: MOCK_STOCKS[3], shares: 120, avgCost: 18.40, allocation: 9 },
];

const PERF_HISTORY = [
  { month: "Sep", value: 38200 },
  { month: "Oct", value: 41500 },
  { month: "Nov", value: 39800 },
  { month: "Dec", value: 44100 },
  { month: "Jan", value: 47200 },
  { month: "Feb", value: 52800 },
];

const PIE_COLORS = [
  "hsl(155 100% 50%)",
  "hsl(217 91% 60%)",
  "hsl(280 80% 60%)",
  "hsl(45 100% 55%)",
  "hsl(0 84% 60%)",
];

// ---------- Rebalance Modal ----------

const RebalanceModal = ({
  isOpen,
  onClose,
  holdings,
}: {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
}) => {
  const [allocations, setAllocations] = useState(
    holdings.map((h) => ({ symbol: h.stock.symbol, target: h.allocation }))
  );

  const totalAlloc = allocations.reduce((s, a) => s + a.target, 0);

  const updateAlloc = (idx: number, val: number) => {
    setAllocations((prev) => prev.map((a, i) => (i === idx ? { ...a, target: val } : a)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-brand flex items-center gap-2">
            <RefreshCw size={18} className="text-primary" /> Rebalance Portfolio
          </DialogTitle>
          <DialogDescription>Adjust target allocations. Total must equal 100%.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {allocations.map((a, i) => (
            <div key={a.symbol} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-foreground">{a.symbol}</span>
                <span className="tabular-nums text-muted-foreground">{a.target}%</span>
              </div>
              <Slider
                value={[a.target]}
                max={100}
                step={1}
                onValueChange={([v]) => updateAlloc(i, v)}
              />
            </div>
          ))}
          <div className={`text-sm text-right font-bold ${totalAlloc === 100 ? "text-primary" : "text-destructive"}`}>
            Total: {totalAlloc}%
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={totalAlloc !== 100} onClick={onClose}>Apply Rebalance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Portfolio View ----------

interface PortfolioViewProps {
  onSelectStock: (stock: MockStock) => void;
  onTrade: (stock: MockStock, type: "buy" | "sell") => void;
}

const PortfolioView = ({ onSelectStock, onTrade }: PortfolioViewProps) => {
  const [showRebalance, setShowRebalance] = useState(false);
  const holdings = INITIAL_HOLDINGS;

  const totalValue = holdings.reduce((s, h) => s + h.shares * h.stock.price, 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = ((totalPnl / totalCost) * 100).toFixed(2);

  const pieData = holdings.map((h) => ({
    name: h.stock.symbol,
    value: h.allocation,
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-brand text-foreground flex items-center gap-2">
            <Briefcase size={24} className="text-primary" /> Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Paper trading portfolio overview</p>
        </div>
        <Button onClick={() => setShowRebalance(true)} variant="outline" className="gap-2">
          <RefreshCw size={14} /> Rebalance
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Value", value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: "text-primary" },
          { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: totalPnl >= 0 ? TrendingUp : TrendingDown, color: totalPnl >= 0 ? "text-primary" : "text-destructive" },
          { label: "Return", value: `${Number(totalPnlPct) >= 0 ? "+" : ""}${totalPnlPct}%`, icon: totalPnl >= 0 ? ArrowUpRight : ArrowDownRight, color: totalPnl >= 0 ? "text-primary" : "text-destructive" },
          { label: "Positions", value: holdings.length.toString(), icon: PieChart, color: "text-info" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border hover-glow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                <kpi.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{kpi.label}</p>
                <p className={`text-lg font-bold font-brand tabular-nums ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PERF_HISTORY}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(155 100% 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(155 100% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 14%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 63%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 10% 63%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "hsl(220 15% 7%)", border: "1px solid hsl(220 12% 14%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(155 100% 50%)" fill="url(#perfGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Allocation pie */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Allocation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220 15% 7%)", border: "1px solid hsl(220 12% 14%)", borderRadius: 8, fontSize: 12 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {holdings.map((h, i) => (
                <div key={h.stock.symbol} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {h.stock.symbol}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings table */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">Alloc %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => {
                const pnl = (h.stock.price - h.avgCost) * h.shares;
                const pnlPct = ((h.stock.price - h.avgCost) / h.avgCost * 100).toFixed(1);
                const positive = pnl >= 0;
                return (
                  <TableRow key={h.stock.symbol} className="cursor-pointer" onClick={() => onSelectStock(h.stock)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-primary">{h.stock.symbol[0]}</div>
                        <div>
                          <div className="font-bold text-foreground text-sm">{h.stock.symbol}</div>
                          <div className="text-[10px] text-muted-foreground">{h.stock.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{h.shares}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">${h.avgCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">${h.stock.price.toFixed(2)}</TableCell>
                    <TableCell className={`text-right tabular-nums font-bold ${positive ? "text-primary" : "text-destructive"}`}>
                      {positive ? "+" : ""}${pnl.toFixed(2)}
                      <div className="text-[10px]">{positive ? "+" : ""}{pnlPct}%</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{h.allocation}%</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="text-primary text-xs h-7 px-2" onClick={() => onTrade(h.stock, "buy")}>Buy</Button>
                        <Button size="sm" variant="ghost" className="text-destructive text-xs h-7 px-2" onClick={() => onTrade(h.stock, "sell")}>Sell</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RebalanceModal isOpen={showRebalance} onClose={() => setShowRebalance(false)} holdings={holdings} />
    </div>
  );
};

export default PortfolioView;
