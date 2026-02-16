import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchStockData, searchStocks, fetchScoredUniverse } from "@/lib/api";
import type { StockData, SearchResult, StockScoreRow } from "@/lib/api";

/** Full stock data (scores + live price + fundamentals) */
export const useStockData = (ticker: string, enabled = true) =>
  useQuery<StockData>({
    queryKey: ["stock-data", ticker],
    queryFn: () => fetchStockData(ticker),
    enabled: enabled && !!ticker,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

/** Universal stock search with debounce */
export const useStockSearch = (query: string, enabled = true) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery<SearchResult[]>({
    queryKey: ["stock-search", debouncedQuery],
    queryFn: () => searchStocks(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 1,
    staleTime: 60_000,
  });
};

/** Scored universe from stock_scores table (for Screener default view) */
export const useStockUniverse = () =>
  useQuery<StockScoreRow[]>({
    queryKey: ["stock-universe"],
    queryFn: fetchScoredUniverse,
    staleTime: 5 * 60_000,
  });

export type { StockData, SearchResult, StockScoreRow };
