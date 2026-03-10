/**
 * FactraFi Data Layer
 *
 * All data is fetched via two Supabase Edge Functions:
 *   - stock-data: live price (yFinance) + fundamentals (Alpha Vantage) + cached scores (DB)
 *   - stock-search: universal ticker search (DB + Alpha Vantage SYMBOL_SEARCH)
 */

import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------

export interface StockData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  current_price: number;
  day_change_pct: number;
  volume: number;
  previous_close: number;
  market_cap: string;
  pe_ratio: number | null;
  forward_pe: number | null;
  debt_to_equity: number | null;
  roe: string | null;
  roce: string | null;
  dividend_yield: number | null;
  profit_margin: string | null;
  operating_margin: string | null;
  revenue_growth: string | null;
  eps_growth: string | null;
  beta: number | null;
  analyst_target: number | null;
  analyst_rating: number | null;
  year_change: string | null;
  v_score: number | null;
  fundamentals: number | null;
  momentum: number | null;
  risk: number | null;
  sentiment: number | null;
  description: string | null;
  signal: string;
  has_scores: boolean;
  why_explanation: string | null;
}

export interface BatchPriceData {
  current_price: number;
  previous_close: number;
  day_change_pct: number;
  volume: number;
}

export interface SearchResult {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
}

export interface StockScoreRow {
  ticker: string;
  name: string | null;
  sector: string | null;
  industry: string | null;
  v_score: number | null;
  fundamentals: number | null;
  momentum: number | null;
  risk: number | null;
  sentiment: number | null;
  style: string | null;
  updated_at: string;
  market_cap: string | null;
}

// ---------- Fetchers ----------

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** Fetch full stock data for a single ticker */
export const fetchStockData = async (ticker: string): Promise<StockData> => {
  const res = await fetch(`${FUNCTIONS_BASE}/stock-data?ticker=${encodeURIComponent(ticker)}`, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`stock-data error ${res.status}: ${body}`);
  }
  return res.json();
};

/** Fetch batch prices for multiple tickers */
export const fetchBatchPrices = async (tickers: string[]): Promise<Record<string, BatchPriceData>> => {
  if (!tickers.length) return {};
  const res = await fetch(
    `${FUNCTIONS_BASE}/stock-prices?tickers=${tickers.map(encodeURIComponent).join(",")}`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }
  );
  if (!res.ok) return {};
  return res.json();
};

/** Search for tickers */
export const searchStocks = async (query: string, limit = 10): Promise<SearchResult[]> => {
  if (!query || query.length < 1) return [];
  const res = await fetch(
    `${FUNCTIONS_BASE}/stock-search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
};

/** Fetch scored universe from stock_scores table (for Screener default view) */
export const fetchScoredUniverse = async (): Promise<StockScoreRow[]> => {
  const { data: scores, error } = await supabase
    .from("stock_scores")
    .select("*")
    .not("v_score", "is", null)
    .order("v_score", { ascending: false });
  if (error) throw error;

  const { data: universe } = await supabase
    .from("stock_universe")
    .select("ticker, market_cap");

  const capMap = new Map((universe || []).map(u => [u.ticker, u.market_cap]));
  return (scores || []).map(s => ({
    ...(s as unknown as StockScoreRow),
    market_cap: capMap.get(s.ticker) || null,
  }));
};
