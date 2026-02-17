import { useQuery } from "@tanstack/react-query";
import { fetchBatchPrices } from "@/lib/api";
import type { BatchPriceData } from "@/lib/api";

/** Fetch prices for multiple tickers in a single request */
export const useBatchPrices = (tickers: string[], enabled = true) =>
  useQuery<Record<string, BatchPriceData>>({
    queryKey: ["batch-prices", tickers.sort().join(",")],
    queryFn: () => fetchBatchPrices(tickers),
    enabled: enabled && tickers.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
