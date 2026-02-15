import { useQuery } from "@tanstack/react-query";
import { fetchFullStockData, fetchStockScores, fetchLivePrice } from "@/lib/api";
import type { StockData, StockScores, LivePrice } from "@/lib/api";

/** Full stock data (scores + live price) */
export const useStockData = (ticker: string, enabled = true) =>
  useQuery<StockData>({
    queryKey: ["stock", ticker],
    queryFn: () => fetchFullStockData(ticker),
    enabled: enabled && !!ticker,
    staleTime: 30_000, // 30s — live prices refresh
    refetchInterval: 60_000, // auto-refresh every 60s
  });

/** Only pre-calculated scores from Railway */
export const useStockScores = (ticker: string, enabled = true) =>
  useQuery<StockScores>({
    queryKey: ["stock-scores", ticker],
    queryFn: () => fetchStockScores(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60_000, // 5 min — scores are batch-calculated
  });

/** Only live price from yfinance */
export const useLivePrice = (ticker: string, enabled = true) =>
  useQuery<LivePrice>({
    queryKey: ["live-price", ticker],
    queryFn: () => fetchLivePrice(ticker),
    enabled: enabled && !!ticker,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
