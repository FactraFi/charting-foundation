
# Full Live Data Integration -- Remove All Mock Data

## Summary

Replace every piece of hardcoded mock data in FactraFi with live metrics fetched from **two edge functions** that proxy your Railway scoring engine, yFinance (via a lightweight Python proxy or direct API), and Alpha Vantage. The app will support searching and viewing **any US stock**, not just a fixed list.

---

## Architecture

The Railway engine currently only exposes `POST /calculate-scores` which batch-calculates scores for its ~50 hardcoded universe tickers. It does **not** have per-ticker REST endpoints like `/api/stock/{ticker}` or `/api/price/{ticker}`.

To make the app work for **any stock** in real-time, we will build two backend functions that act as the data layer:

```text
Browser (React)
  |
  |--> Edge Function: /stock-data?ticker=AAPL
  |      |- Checks DB cache (stock_scores table) for pre-calculated scores
  |      |- If cache miss or stale: calls Alpha Vantage OVERVIEW endpoint for fundamentals
  |      |- Calls yFinance (via Yahoo Finance API) for live price
  |      |- Returns unified JSON to frontend
  |
  |--> Edge Function: /stock-search?q=app
  |      |- Searches a stock_universe table (or calls Alpha Vantage SYMBOL_SEARCH)
  |      |- Returns matching tickers + names for autocomplete
  |
  |--> Railway Engine (existing, unchanged)
         |- Runs on a schedule (or manually triggered)
         |- Calculates V-Scores for its 50-ticker universe
         |- Writes results to stock_scores table via Supabase
```

---

## What I Need From You

Before I start implementing, I will ask for these in the chat:

1. **Alpha Vantage Premium API Key** -- stored as a secret called `ALPHA_VANTAGE_API_KEY`, used by edge functions for company overview data and ticker search.
2. **Railway Domain URL** -- stored as a secret called `RAILWAY_DOMAIN` (e.g., `https://your-app.railway.app`), so we can optionally trigger score recalculation.

---

## Step-by-Step Implementation

### Step 1: Database Tables

Create two tables:

**`stock_scores`** -- Cache for Railway-calculated V-Scores:
- `ticker` (text, primary key)
- `name` (text)
- `sector` (text)
- `industry` (text)
- `v_score` (integer, 0-100)
- `fundamentals` (integer, 0-100)
- `momentum` (integer, 0-100)
- `risk` (integer, 0-100)
- `sentiment` (integer, 0-100)
- `style` (text) -- universe bucket name
- `rank_ic` (real)
- `weights` (text)
- `why_explanation` (text)
- `updated_at` (timestamptz)

**`stock_universe`** -- Searchable ticker directory (seeded with popular tickers, grows as users search):
- `ticker` (text, primary key)
- `name` (text)
- `sector` (text)
- `industry` (text)
- `market_cap` (text)
- `added_at` (timestamptz, default now())

Both tables will have RLS disabled since they contain public market data (no user-specific information). Alternatively, read-only access for anon role.

### Step 2: Edge Function -- `stock-data`

A single endpoint that returns everything the frontend needs for one ticker:

**Request:** `GET /stock-data?ticker=AAPL`

**Response shape:**
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "current_price": 172.50,
  "day_change_pct": -0.50,
  "volume": 50000000,
  "previous_close": 173.37,
  "market_cap": "2.6T",
  "pe_ratio": 26.4,
  "forward_pe": 24.1,
  "debt_to_equity": 1.87,
  "roe": "160%",
  "roce": "58%",
  "dividend_yield": 0.56,
  "year_change": "+12%",
  "v_score": 65,
  "fundamentals": 95,
  "momentum": 45,
  "risk": 20,
  "sentiment": 50,
  "signal": "Hold",
  "has_scores": true
}
```

Logic:
1. Fetch live price from Yahoo Finance API (free, no key needed -- using `query1.finance.yahoo.com` or similar)
2. Check `stock_scores` table for pre-calculated V-Score and pillars
3. If no cached score exists, fetch Alpha Vantage OVERVIEW for basic fundamentals and return `has_scores: false` (so frontend shows "Score pending" instead of a fake number)
4. Merge and return

### Step 3: Edge Function -- `stock-search`

For the universal search/autocomplete:

**Request:** `GET /stock-search?q=appl&limit=10`

**Response:**
```json
{
  "results": [
    { "ticker": "AAPL", "name": "Apple Inc", "sector": "Technology" },
    { "ticker": "APLE", "name": "Apple Hospitality REIT", "sector": "Real Estate" }
  ]
}
```

Logic:
1. First search the local `stock_universe` table
2. If fewer than `limit` results, call Alpha Vantage `SYMBOL_SEARCH` endpoint to find more
3. Auto-insert newly discovered tickers into `stock_universe` for future fast lookups

### Step 4: React Data Layer

**New types** (`src/lib/api.ts`):
- `StockData` interface matching the edge function response
- `fetchStockData(ticker)` -- calls the `stock-data` edge function
- `searchStocks(query)` -- calls the `stock-search` edge function

**New hooks** (`src/hooks/use-stock-data.ts`):
- `useStockData(ticker)` -- React Query wrapper, 30s stale time, 60s auto-refresh
- `useStockSearch(query)` -- React Query wrapper with 300ms debounce
- `useStockUniverse()` -- fetches all tickers from `stock_scores` table for the Screener default view (the ~50 tickers that Railway has scored)

### Step 5: Component Migration

**`ModernNavbar.tsx`**:
- Replace `MOCK_STOCKS` search with `useStockSearch` hook
- Navbar search becomes a real universal search -- any ticker, not just 10
- On selecting a result, navigate to `/stock/{ticker}`

**`DashboardView.tsx`**:
- Default hero stock loaded via `useStockData('NVDA')` (or user's last viewed)
- Hero search uses `useStockSearch` for live autocomplete
- Pillar scores, price, change -- all from live data
- Marker panel uses live fundamental data where available
- KPI strip (Total Equity, Day P&L, etc.) remains portfolio-mock until portfolio persistence is built

**`ScreenerView.tsx`**:
- "All Stocks" tab fetches the scored universe from `stock_scores` table (~50 stocks with V-Scores)
- Search bar uses `useStockSearch` for finding any ticker beyond the scored universe
- Industry/Sector grouping uses real sector data from the database
- Each card shows live price + cached V-Score
- Loading skeleton cards while data loads

**`StockDetailPage.tsx`**:
- Instead of `MOCK_STOCKS.find()`, uses `useStockData(symbol)` hook
- Works for ANY ticker, not just the 10 hardcoded ones
- Shows "Score not yet calculated" gracefully when `has_scores` is false

**`StockDetailView.tsx`**:
- Pillar cards use live data from `useStockData`
- V-Score History chart -- placeholder until historical score tracking is added
- Metrics strip derives labels from real data (e.g., P/E > 30 = "EXPENSIVE")
- "Why This Score?" section uses AI (existing FactraAI chat function) to generate explanation based on real pillar scores

**`MarkerSection.tsx`**:
- Technical/Sentiment/Fundamental markers populated from Alpha Vantage overview data where fields are available (P/E, D/E, ROE, dividend yield, etc.)
- Fields not available from the API show "N/A" or are hidden

**`PortfolioView.tsx`**:
- Holdings reference live prices via `useStockData` for real P&L calculations
- Portfolio composition (which stocks, how many shares) remains local state (paper trading)

### Step 6: Loading States and Error Handling

- Skeleton loading cards in Screener and Dashboard while data loads
- Error toasts if edge functions are unreachable
- "Score Pending" badge on stocks not in the Railway-scored universe
- Graceful fallback for Alpha Vantage rate limits (premium key has 75 requests/min)

### Step 7: Clean Up

- Delete `src/data/mock-data.ts` entirely
- Remove all imports of `MOCK_STOCKS`, `MOCK_NOTIFICATIONS`, `MARKER_DATA`, `CHART_DATA_VARIANTS`
- Remove `MockStock` type -- replaced by the new `StockData` interface
- Update `TradeModal` to accept the new `StockData` type

### Step 8: Railway Integration (Optional Enhancement)

- Store `RAILWAY_DOMAIN` as a secret
- Add a "Refresh Scores" admin button that calls `POST /calculate-scores` on your Railway engine
- Railway engine writes results to `stock_scores` table (it already has the Supabase upsert logic)
- This keeps the scored universe fresh without manual intervention

---

## Sequence of Implementation

1. Ask for API keys (Alpha Vantage key first)
2. Create database tables (`stock_scores`, `stock_universe`)
3. Build and deploy `stock-search` edge function
4. Build and deploy `stock-data` edge function
5. Update `src/lib/api.ts` with new types and fetchers
6. Update `src/hooks/use-stock-data.ts` with new hooks
7. Migrate `ModernNavbar` (search)
8. Migrate `DashboardView` (hero + pillars + markers)
9. Migrate `ScreenerView` (stock grid)
10. Migrate `StockDetailPage` + `StockDetailView` + `MarkerSection`
11. Migrate `PortfolioView`
12. Delete `mock-data.ts` and all legacy imports
13. End-to-end testing

---

## Technical Notes

- The Railway engine uses Alpha Vantage for all data (prices + financials). The edge functions will also use Alpha Vantage for on-demand lookups. With a premium key (75 req/min), this is sufficient for real-time usage.
- Yahoo Finance API is used only for live price snapshots (free, no key needed) to avoid burning Alpha Vantage quota on price-only requests.
- The `stock_scores` table acts as a cache layer -- Railway batch-updates it, and the frontend reads from it. This decouples the scoring engine from the web app.
- All existing UI styling, animations, and TradingView charts remain unchanged.
