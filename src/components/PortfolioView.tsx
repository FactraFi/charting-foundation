import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Briefcase, TrendingUp, TrendingDown, DollarSign, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, PackageOpen, MoreHorizontal, Shield, Clock
} from "lucide-react";
import { useStockData } from "@/hooks/use-stock-data";
import type { StockData } from "@/lib/api";
import CompanyLogo from "@/components/CompanyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio, useTransactions, type DbHolding } from "@/hooks/use-portfolio";
import { useHoldingsWithPrices } from "@/hooks/use-holdings-prices";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatDistanceToNow, format } from "date-fns";

const PIE_COLORS = [
  "hsl(155 100% 50%)",
  "hsl(217 91% 60%)",
  "hsl(280 80% 60%)",
  "hsl(45 100% 55%)",
  "hsl(0 84% 60%)",
];

const TIME_PERIODS = ["1W", "1M", "3M", "YTD", "1Y", "ALL"] as const;

// ---------- Holding Row ----------

const HoldingRow = ({
  holding,
  onSelectStock,
  onTrade,
}: {
  holding: DbHolding;
  onSelectStock: (stock: StockData) => void;
  onTrade: (stock: StockData, type: "buy" | "sell") => void;
}) => {
  const { data: stock } = useStockData(holding.ticker);
  const price = stock?.current_price ?? holding.avg_cost;
  const mktValue = price * holding.shares;
  const totalReturn = (price - holding.avg_cost) * holding.shares;
  const totalReturnPct = ((price - holding.avg_cost) / holding.avg_cost * 100).toFixed(1);
  const positive = totalReturn >= 0;

  return (
    <TableRow className="cursor-pointer" onClick={() => stock && onSelectStock(stock)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
            <CompanyLogo ticker={holding.ticker} size={32} className="rounded-lg object-cover" />
          </div>
          <div>
            <div className="font-bold font-brand text-foreground text-sm">{holding.ticker}</div>
            <div className="text-[10px] text-muted-foreground">{stock?.name ?? holding.ticker}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium font-brand">{holding.shares}</TableCell>
      <TableCell className="text-right tabular-nums font-brand text-muted-foreground">${holding.avg_cost.toFixed(2)}</TableCell>
      <TableCell className="text-right tabular-nums font-medium font-brand">${price.toFixed(2)}</TableCell>
      <TableCell className="text-right tabular-nums font-medium font-brand">${mktValue.toFixed(2)}</TableCell>
      <TableCell className={`text-right tabular-nums font-bold font-brand ${positive ? "text-primary" : "text-destructive"}`}>
        {positive ? "+" : ""}${totalReturn.toFixed(2)}
        <div className="text-[10px]">{positive ? "+" : ""}{totalReturnPct}%</div>
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        {stock && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTrade(stock, "buy")}>Buy More</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTrade(stock, "sell")} className="text-destructive">Sell</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectStock(stock)}>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
  const { data: transactions = [] } = useTransactions(10);
  const [timePeriod, setTimePeriod] = useState<typeof TIME_PERIODS[number]>("1M");
  const cashBalance = profile?.cash_balance ?? 10000;

  const {
    totalMarketValue, totalCost, daysPnl, totalReturn, isLoading: pricesLoading, stockDataMap,
  } = useHoldingsWithPrices(holdings);

  const { data: historyData = [] } = usePortfolioHistory(timePeriod);

  const netLiquidity = cashBalance + totalMarketValue;
  const daysPnlPct = netLiquidity - daysPnl !== 0 ? (daysPnl / (netLiquidity - daysPnl)) * 100 : 0;
  const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  const pieData = holdings.map((h) => {
    const stock = stockDataMap.get(h.ticker);
    const price = stock?.current_price ?? h.avg_cost;
    return { name: h.ticker, value: price * h.shares };
  });

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading portfolio...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-brand text-foreground flex items-center gap-2">
          <Briefcase size={24} className="text-primary" /> Portfolio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Paper trading portfolio overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border hover-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-primary"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Net Liquidity</p>
              <p className="text-lg font-bold font-brand tabular-nums text-primary">
                ${netLiquidity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-secondary ${daysPnl >= 0 ? "text-primary" : "text-destructive"}`}>
              {daysPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Day's P&L</p>
              <p className={`text-lg font-bold font-brand tabular-nums ${daysPnl >= 0 ? "text-primary" : "text-destructive"}`}>
                ${daysPnl.toFixed(2)} <span className="text-xs">({daysPnlPct.toFixed(1)}%)</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-secondary ${totalReturn >= 0 ? "text-primary" : "text-destructive"}`}>
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Return</p>
              <p className={`text-lg font-bold font-brand tabular-nums ${totalReturn >= 0 ? "text-primary" : "text-destructive"}`}>
                ${totalReturn.toFixed(2)} <span className="text-xs">({totalReturnPct.toFixed(1)}%)</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-primary"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Buying Power</p>
              <p className="text-lg font-bold font-brand tabular-nums text-primary">
                ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Performance Chart + Allocation & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Performance Chart */}
        <Card className="border-border lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold font-brand text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} /> Performance
              </CardTitle>
              <div className="flex gap-1">
                {TIME_PERIODS.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={timePeriod === p ? "default" : "ghost"}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => setTimePeriod(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => format(new Date(v), "MMM d")}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Portfolio Value"]}
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_value"
                      stroke="hsl(var(--primary))"
                      fill="url(#portfolioGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center space-y-2">
                  <Activity size={32} className="mx-auto opacity-30" />
                  <p>No performance history yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Allocation + Portfolio Health */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Allocation */}
          <Card className="border-border flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold font-brand text-muted-foreground uppercase tracking-wider">Allocation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {pieData.length > 0 ? (
                <>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
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
                </>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center space-y-2">
                    <PieChart size={24} className="mx-auto opacity-30" />
                    <p className="text-xs">No holdings yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Health */}
          <Card className="border-border flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold font-brand text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield size={14} /> Portfolio Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                {/* Health Score Circle */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(220 12% 14%)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(155 100% 50% / 0.2)"
                      strokeWidth="3"
                      strokeDasharray="0, 100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">--</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Beta</span>
                    <span className="font-bold font-brand text-foreground">--</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Sharpe Ratio</span>
                    <span className="font-bold font-brand text-foreground">--</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Holdings + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Holdings Table */}
        <Card className="border-border lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold font-brand text-muted-foreground uppercase tracking-wider">Holdings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {holdings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-brand font-bold">Asset</TableHead>
                    <TableHead className="text-right font-brand font-bold">Qty</TableHead>
                    <TableHead className="text-right font-brand font-bold">Avg Cost</TableHead>
                    <TableHead className="text-right font-brand font-bold">Price</TableHead>
                    <TableHead className="text-right font-brand font-bold">Mkt Value</TableHead>
                    <TableHead className="text-right font-brand font-bold">Total Return</TableHead>
                    <TableHead className="text-right font-brand font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((h) => (
                    <HoldingRow key={h.ticker} holding={h} onSelectStock={onSelectStock} onTrade={onTrade} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <PackageOpen size={28} className="text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No holdings yet</p>
                <p className="text-xs text-muted-foreground">Place your first trade to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold font-brand text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isBuy = tx.type === "buy";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className={`p-1.5 rounded-lg ${isBuy ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {isBuy ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-brand text-sm text-foreground">{tx.ticker}</span>
                          <span className={`text-[10px] font-bold uppercase ${isBuy ? "text-primary" : "text-destructive"}`}>{tx.type}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.shares} shares @ ${tx.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-brand tabular-nums text-foreground">${(tx.shares * tx.price).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Clock size={28} className="text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground">Your trade history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioView;
