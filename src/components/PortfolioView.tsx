import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, ArrowUpRight, ArrowDownRight, PackageOpen } from "lucide-react";
import { useStockData } from "@/hooks/use-stock-data";
import type { StockData } from "@/lib/api";
import CompanyLogo from "@/components/CompanyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio, type DbHolding } from "@/hooks/use-portfolio";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

const PIE_COLORS = [
  "hsl(155 100% 50%)",
  "hsl(217 91% 60%)",
  "hsl(280 80% 60%)",
  "hsl(45 100% 55%)",
  "hsl(0 84% 60%)",
];

// ---------- Holding Row (fetches own live price) ----------

const HoldingRow = ({
  holding,
  onSelectStock,
  onTrade,
}: {
  holding: DbHolding;
  onSelectStock: (stock: StockData) => void;
  onTrade: (stock: StockData, type: 'buy' | 'sell') => void;
}) => {
  const { data: stock } = useStockData(holding.ticker);
  const price = stock?.current_price ?? holding.avg_cost;
  const pnl = (price - holding.avg_cost) * holding.shares;
  const pnlPct = ((price - holding.avg_cost) / holding.avg_cost * 100).toFixed(1);
  const positive = pnl >= 0;

  return (
    <TableRow className="cursor-pointer" onClick={() => stock && onSelectStock(stock)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
            <CompanyLogo ticker={holding.ticker} size={32} className="rounded-lg object-cover" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">{holding.ticker}</div>
            <div className="text-[10px] text-muted-foreground">{stock?.name ?? holding.ticker}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">{holding.shares}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">${holding.avg_cost.toFixed(2)}</TableCell>
      <TableCell className="text-right tabular-nums font-medium">${price.toFixed(2)}</TableCell>
      <TableCell className={`text-right tabular-nums font-bold ${positive ? "text-primary" : "text-destructive"}`}>
        {positive ? "+" : ""}${pnl.toFixed(2)}
        <div className="text-[10px]">{positive ? "+" : ""}{pnlPct}%</div>
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 justify-end">
          {stock && (
            <>
              <Button size="sm" variant="ghost" className="text-primary text-xs h-7 px-2" onClick={() => onTrade(stock, "buy")}>Buy</Button>
              <Button size="sm" variant="ghost" className="text-destructive text-xs h-7 px-2" onClick={() => onTrade(stock, "sell")}>Sell</Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

// ---------- Portfolio View ----------

interface PortfolioViewProps {
  onSelectStock: (stock: StockData) => void;
  onTrade: (stock: StockData, type: "buy" | "sell") => void;
}

const PortfolioView = ({ onSelectStock, onTrade }: PortfolioViewProps) => {
  const { profile } = useAuth();
  const { data: holdings = [], isLoading } = usePortfolio();
  const cashBalance = profile?.cash_balance ?? 10000;

  const pieData = holdings.map((h) => ({
    name: h.ticker,
    value: h.shares * h.avg_cost, // approximate value
  }));

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading portfolio...</div>;
  }

  if (holdings.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold font-brand text-foreground flex items-center gap-2">
            <Briefcase size={24} className="text-primary" /> Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Paper trading portfolio overview</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-primary"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Buying Power</p>
              <p className="text-lg font-bold font-brand tabular-nums text-primary">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            <PackageOpen size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground font-brand">Your portfolio is empty</h2>
          <p className="text-muted-foreground text-sm max-w-md text-center">
            Start trading by searching for a stock and placing your first paper trade!
          </p>
        </div>
      </div>
    );
  }

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
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Positions", value: holdings.length.toString(), icon: PieChart, color: "text-info" },
          { label: "Buying Power", value: `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-primary" },
          { label: "Mode", value: "Simulation", icon: TrendingUp, color: "text-primary" },
          { label: "Currency", value: "USD", icon: DollarSign, color: "text-foreground" },
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

      {/* Allocation chart */}
      {pieData.length > 0 && (
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
                <div key={h.ticker} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {h.ticker}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => (
                <HoldingRow key={h.ticker} holding={h} onSelectStock={onSelectStock} onTrade={onTrade} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioView;
