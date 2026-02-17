import { useQueries } from "@tanstack/react-query";
import { fetchStockData } from "@/lib/api";
import type { StockData } from "@/lib/api";
import type { DbHolding } from "@/hooks/use-portfolio";

interface HoldingsWithPrices {
  totalMarketValue: number;
  totalCost: number;
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

  let totalMarketValue = 0;
  let totalCost = 0;

  for (const h of holdings) {
    const stock = stockDataMap.get(h.ticker);
    const price = stock?.current_price ?? h.avg_cost;

    totalMarketValue += price * h.shares;
    totalCost += h.avg_cost * h.shares;
  }

  const totalReturn = totalMarketValue - totalCost;

  return { totalMarketValue, totalCost, totalReturn, isLoading, stockDataMap };
};
