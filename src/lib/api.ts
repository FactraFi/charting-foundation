/**
 * FactraFi Hybrid Data Fetching Architecture
 * 
 * PRIMARY (Railway Engine): Pre-calculated scores (Pillars, Factra Total Score)
 * LIVE (yfinance proxy): Real-time price, volume, day change
 * 
 * Railway domain is configured at runtime. yfinance data is fetched
 * through the Railway gateway which proxies yfinance calls.
 */

// Railway domain — will be set by user configuration
let railwayDomain = "";

export const setRailwayDomain = (domain: string) => {
  railwayDomain = domain.replace(/\/+$/, ""); // strip trailing slash
};

export const getRailwayDomain = () => railwayDomain;

// ---------- Types ----------

export interface StockScores {
  ticker: string;
  factra_total_score: number;
  fundamentals_pillar: number;
  momentum_pillar: number;
  risk_pillar: number;
  sentiment_pillar: number;
  debt_to_equity?: number;
  pe_ratio?: number;
  forward_pe?: number;
}

export interface LivePrice {
  ticker: string;
  current_price: number;
  day_change_pct: number;
  volume: number;
  previous_close: number;
}

export interface StockData extends StockScores, LivePrice {}

// ---------- Fetchers ----------

/** Fetch pre-calculated scores from Railway engine */
export const fetchStockScores = async (ticker: string): Promise<StockScores> => {
  if (!railwayDomain) throw new Error("Railway domain not configured");
  const res = await fetch(`${railwayDomain}/api/stock/${ticker}`);
  if (!res.ok) throw new Error(`Railway API error: ${res.status}`);
  return res.json();
};

/** Fetch live price data (proxied through Railway or direct yfinance endpoint) */
export const fetchLivePrice = async (ticker: string): Promise<LivePrice> => {
  if (!railwayDomain) throw new Error("Railway domain not configured");
  const res = await fetch(`${railwayDomain}/api/price/${ticker}`);
  if (!res.ok) throw new Error(`Price API error: ${res.status}`);
  return res.json();
};

/** Fetch both scores and live price in parallel */
export const fetchFullStockData = async (ticker: string): Promise<StockData> => {
  const [scores, price] = await Promise.all([
    fetchStockScores(ticker),
    fetchLivePrice(ticker),
  ]);
  return { ...scores, ...price };
};

/** Batch fetch multiple tickers */
export const fetchBatchStockData = async (tickers: string[]): Promise<StockData[]> => {
  return Promise.all(tickers.map(fetchFullStockData));
};
