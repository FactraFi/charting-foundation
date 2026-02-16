

# Wake Up Railway Engine and Universal Stock Scoring

## Problem

The `stock_scores` table is completely empty -- zero stocks have scores. The Railway engine only scores ~50 hardcoded tickers via `POST /calculate-scores`. The user wants **every US stock** to show scores instantly.

## Strategy: Three-Layer Scoring Architecture

To make scores appear "almost instantaneously" for any of the ~8,000+ US stocks, we need three layers working together:

```text
Layer 1: BATCH SEED (one-time + scheduled)
  Railway engine -> POST /calculate-scores -> writes ~50 core tickers to stock_scores
  New batch-seed edge function -> processes S&P 500 + popular tickers in batches

Layer 2: ON-DEMAND SCORING (real-time, per user request)  
  User searches "SHOP" -> stock-data edge function -> no cached score found ->
  triggers on-demand score calculation -> returns data with score immediately ->
  caches result in stock_scores for future requests

Layer 3: BACKGROUND REFRESH (scheduled via cron)
  Nightly cron job refreshes all cached scores that are >24h old
```

## Detailed Implementation

### Step 1: Trigger Railway Engine to Seed Initial Scores

Call your Railway engine's `POST /calculate-scores` endpoint to populate the first ~50 stocks. This is a one-time "wake up" call. We will:

- Create a simple edge function `trigger-railway` that calls `RAILWAY_DOMAIN/calculate-scores`
- The Railway engine already writes results to the `stock_scores` table via Supabase
- Invoke it once to seed the database immediately

### Step 2: Build On-Demand Score Calculator (Edge Function)

Create a new edge function `calculate-score` that computes a V-Score for **any single ticker** on the fly. This replicates a simplified version of your Railway engine's scoring logic directly in the edge function, using Alpha Vantage data:

**Scoring algorithm (matching your Railway engine's 4 pillars):**

- **Fundamentals (0-100)**: Composite of P/E ratio, ROE, profit margin, revenue growth, debt-to-equity -- each normalized to 0-100 and weighted
- **Momentum (0-100)**: Based on 52-week price position, recent price change, and beta-adjusted returns
- **Risk (0-100)**: Based on beta, debt-to-equity, and volatility indicators (lower = better)
- **Sentiment (0-100)**: Based on analyst consensus rating, price target upside, and institutional interest

**V-Score** = weighted average of the 4 pillars (configurable weights, default 30/25/20/25)

The function will:
1. Fetch Alpha Vantage OVERVIEW for the ticker (one API call)
2. Calculate all 4 pillar scores using the normalization logic
3. Compute the weighted V-Score
4. Generate a brief `why_explanation` text
5. Upsert the result into `stock_scores` table (cached for 24h)
6. Return the scores immediately

This means **any stock a user searches for gets scored in ~1-2 seconds** on first view, and instantly on subsequent views.

### Step 3: Modify `stock-data` to Auto-Score on Cache Miss

Update the existing `stock-data` edge function so that when a ticker has no cached score in `stock_scores`, it automatically calls the scoring logic inline (not as a separate function call, but embedded scoring). This eliminates the "Score Pending" state entirely:

```text
stock-data?ticker=SHOP
  |
  |- Fetch Yahoo price (parallel)
  |- Check stock_scores cache (parallel)  
  |- Fetch Alpha Vantage overview (parallel)
  |
  |- If no cached score AND Alpha Vantage data available:
  |    -> Calculate V-Score on the fly using Alpha Vantage data
  |    -> Upsert into stock_scores (fire-and-forget)
  |    -> Return complete response WITH scores
  |
  |- If cached score exists:
  |    -> Return cached scores (instant)
```

### Step 4: Batch-Seed Popular US Stocks

Create a `seed-scores` edge function that processes stocks in batches to pre-populate the database. Given your Alpha Vantage premium key (75 requests/min):

- **S&P 500 tickers** (~500 stocks): Takes ~7 minutes to process all
- **Russell 1000** (~1000 stocks): Takes ~14 minutes
- Process in batches of 60 tickers per invocation (staying under rate limit)
- Each invocation: fetch Alpha Vantage data, calculate scores, upsert to DB
- Can be triggered manually or via cron to gradually build up the scored universe

### Step 5: Set Up Nightly Score Refresh (Cron)

Use `pg_cron` + `pg_net` to schedule a nightly refresh:

- Runs at 2 AM UTC daily
- Calls the `seed-scores` function with "refresh stale" mode
- Re-scores any stocks in `stock_scores` where `updated_at` is older than 24 hours
- Keeps the entire cached universe fresh

### Step 6: Update Frontend for Seamless Experience

- Remove the "Score Pending" / "V-Score pending" UI states since every stock will now have scores
- Update `ScreenerView` to show a richer default grid (S&P 500 stocks with pre-cached scores)
- Update `DashboardView` to confidently display pillar scores for any selected stock
- Add a subtle "Calculating score..." skeleton that appears for ~1-2 seconds on first-ever view of an unscored stock, then shows the real score

### Step 7: Pre-Seed stock_universe with Major US Tickers

Insert the S&P 500 ticker list into `stock_universe` so that search autocomplete works immediately for all major stocks without needing Alpha Vantage API calls. This makes search feel instant.

---

## Technical Details

### On-Demand Scoring Algorithm

The scoring logic embedded in the edge function will normalize Alpha Vantage metrics as follows:

**Fundamentals pillar:**
- P/E Ratio: score = 100 if P/E between 10-20, scales down for extremes
- ROE: score = min(100, ROE_pct * 2) -- higher ROE = better
- Profit Margin: score = min(100, margin_pct * 3)
- Revenue Growth: score = min(100, growth_pct * 4)
- Debt/Equity: score = max(0, 100 - D/E * 30) -- lower debt = better

**Momentum pillar:**
- 52-week position: (current - 52wk_low) / (52wk_high - 52wk_low) * 100
- Beta-adjusted: moderate beta (0.8-1.2) scores highest

**Risk pillar (inverted -- lower risk = higher score):**
- Beta penalty: abs(beta - 1) * 30 deducted
- Debt penalty: D/E > 2 = high risk
- Combines into 0-100 where 100 = lowest risk

**Sentiment pillar:**
- Analyst consensus: 1-5 scale mapped to 0-100
- Price target upside: % above current price * 2, capped at 100

**V-Score** = Fundamentals * 0.30 + Momentum * 0.25 + Risk * 0.20 + Sentiment * 0.25

### Rate Limit Management

- Alpha Vantage premium: 75 requests/minute
- On-demand scoring: 1 request per unique stock (cached after first calculation)
- Batch seeding: throttled to 60 requests/minute with 1-second delays
- Yahoo Finance: no rate limit concerns for price-only queries

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/stock-data/index.ts` | Modify: add inline scoring on cache miss |
| `supabase/functions/trigger-railway/index.ts` | Create: one-shot Railway engine trigger |
| `supabase/functions/seed-scores/index.ts` | Create: batch S&P 500 seeder |
| `supabase/config.toml` | Update: add new function configs |
| `src/components/ScreenerView.tsx` | Update: remove "pending" states, richer default grid |
| `src/components/DashboardView.tsx` | Update: remove "pending" fallbacks |
| `src/components/StockDetailView.tsx` | Update: always show scores |
| Database (pg_cron) | Add: nightly refresh schedule |
| Database (stock_universe) | Seed: S&P 500 tickers for instant search |

### Execution Sequence

1. Build the on-demand scoring logic into `stock-data` edge function
2. Create `trigger-railway` edge function and invoke it to seed first ~50 stocks
3. Create `seed-scores` edge function for batch S&P 500 processing
4. Seed `stock_universe` table with S&P 500 tickers for search
5. Run the batch seeder to pre-populate scores for top 500 stocks
6. Update frontend components to remove "pending" states
7. Set up pg_cron for nightly refresh
8. Test end-to-end: search any stock, see scores in under 2 seconds

