

# Phase 4: Portfolio Performance and History

## Overview

This phase adds two major capabilities: (1) real-time Day's P&L calculation using live market data, and (2) a portfolio history tracking system with a performance chart.

## Part A: Day's P&L (Real-Time)

### Problem
The KPI cards currently show hardcoded `0` for Day's P&L, Total Return, and Net Liquidity doesn't include holdings market value.

### Approach
Create a custom hook `useHoldingsWithPrices` that fetches live `StockData` for every held ticker using TanStack Query's `useQueries`, then aggregates the results.

### New hook: `src/hooks/use-holdings-prices.ts`

- Accept the `holdings` array from `usePortfolio()`
- Use `useQueries` to call `fetchStockData` for each unique ticker in parallel
- Return aggregated metrics:
  - `totalMarketValue`: sum of `current_price * shares` for all holdings
  - `totalCost`: sum of `avg_cost * shares` for all holdings
  - `daysPnl`: sum of `(current_price - previous_close) * shares` for each holding
  - `totalReturn`: `totalMarketValue - totalCost`
  - `netLiquidity`: `cashBalance + totalMarketValue`
  - `isLoading`: true while any query is still loading
  - `stockDataMap`: a `Map<ticker, StockData>` for use in the allocation pie chart

### Updates to `src/components/PortfolioView.tsx`

- Import and use `useHoldingsWithPrices(holdings)`
- Replace the hardcoded KPI values with real computed values
- Update the pie chart to use market values (shares x current_price) instead of cost basis
- Percentage calculations: `daysPnlPct = daysPnl / (netLiquidity - daysPnl) * 100`, `totalReturnPct = totalReturn / totalCost * 100`

---

## Part B: Portfolio History (Database + Snapshot Function)

### New table: `portfolio_history`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| date | date | NOT NULL |
| total_value | numeric | NOT NULL (cash + holdings market value) |
| cash_balance | numeric | NOT NULL |
| invested_value | numeric | NOT NULL (sum of holdings at market price) |
| created_at | timestamptz | default now() |

- RLS: users can SELECT their own rows only
- Unique constraint on (user_id, date) to prevent duplicate snapshots

### New Edge Function: `snapshot-portfolio`

This function runs on demand (can be scheduled via cron later). It:

1. Fetches all users who have holdings
2. For each user, fetches their holdings and cash balance
3. For each holding, calls Yahoo Finance to get the current price
4. Calculates `invested_value = sum(shares * current_price)` and `total_value = cash + invested_value`
5. Upserts into `portfolio_history` (keyed on user_id + date)

The function uses the service role key to read across all users. Prices are fetched from Yahoo Finance directly (same pattern as the existing `stock-data` function).

---

## Part C: Portfolio History UI

### New hook: `src/hooks/use-portfolio-history.ts`

- Fetches from `portfolio_history` table for the current user
- Accepts a `timePeriod` parameter to filter by date range (1W, 1M, 3M, YTD, 1Y, ALL)
- Returns data sorted by date ascending, formatted for Recharts

### Updates to `src/components/PortfolioView.tsx`

- Replace the "No performance history yet" placeholder with a Recharts `AreaChart`
- The chart shows `total_value` over time on the Y-axis, `date` on the X-axis
- Uses the time period toggle buttons to filter the data
- Shows empty state only when no history records exist
- Styled with the existing dark theme (green gradient fill for positive, red for negative)

---

## Technical Details

### Files created:
- `src/hooks/use-holdings-prices.ts` -- aggregates live prices for all holdings
- `src/hooks/use-portfolio-history.ts` -- fetches portfolio_history for the chart
- `supabase/functions/snapshot-portfolio/index.ts` -- daily snapshot edge function

### Files modified:
- `src/components/PortfolioView.tsx` -- wire up real KPIs and performance chart
- `supabase/config.toml` -- add snapshot-portfolio function config

### Database migration:
- Create `portfolio_history` table with RLS policies
- Add unique index on (user_id, date)

### No new dependencies needed
- `useQueries` is already available from `@tanstack/react-query`
- `AreaChart` components from `recharts` are already installed

