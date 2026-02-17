import { useQueries } from "@tanstack/react-query";
import { fetchStockData } from "@/lib/api";
import type { StockData } from "@/lib/api";
import type { DbHolding } from "@/hooks/use-portfolio";

interface HoldingsWithPrices {
  totalMarketValue: number;
  totalCost: number;
  daysPnl: number;
  totalReturn: number;
  isLoading: boolean;
  stockDataMap: Map<string, StockData>;
}

export const useHoldingsWithPrices = (holdings: DbHolding[]): HoldingsWithPrices => {
  const uniqueTickers = [...new Set(holdings.map((h) => h.ticker))];

  const results = useQueries({
    queries: uniqueTickers.map((ticker) => ({
      queryKey: ["stock-data", ticker],
      queryFn: () => fetchStockData(ticker),
      staleTime: 30_000,
      refetchInterval: 60_000,
      enabled: !!ticker,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);

  const stockDataMap = new Map<string, StockData>();
  results.forEach((r, i) => {
    if (r.data) stockDataMap.set(uniqueTickers[i], r.data);
  });

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  let totalMarketValue = 0;
  let totalCost = 0;
  let daysPnl = 0;

  for (const h of holdings) {
    const stock = stockDataMap.get(h.ticker);
    const price = stock?.current_price ?? h.avg_cost;
    const prevClose = stock?.previous_close ?? price;

    totalMarketValue += price * h.shares;
    totalCost += h.avg_cost * h.shares;

    // Positions opened today: baseline is purchase price
    // Positions held overnight: baseline is previous close
    const baseline = isToday(h.created_at) ? h.avg_cost : prevClose;
    daysPnl += (price - baseline) * h.shares;
  }

  const totalReturn = totalMarketValue - totalCost;

  return { totalMarketValue, totalCost, daysPnl, totalReturn, isLoading, stockDataMap };
};
