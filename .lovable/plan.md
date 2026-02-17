

## Speed Up Price Loading on Screener

### The Problem

Every stock card on the Screener page makes its own individual call to the `stock-data` backend function. That function, for each single ticker, calls:

1. **Yahoo Finance** -- live price (fast, ~200ms)
2. **Alpha Vantage OVERVIEW** -- fundamentals (slow, ~500-1500ms)
3. **Alpha Vantage BALANCE_SHEET** -- debt data (slow, ~500-1500ms)

With ~30 stocks on the screener, that's **~90 external API calls** firing in parallel. Alpha Vantage also has rate limits (5 calls/min on free tier, 75/min on premium), so many of these will fail or queue up.

The screener cards only need **price + daily change** -- they already have V-Scores from the `stock_scores` database table. They don't need fundamentals at all.

### The Fix: A Lightweight Batch Price Endpoint

Create a new backend function called `stock-prices` that:
- Accepts multiple tickers in one request (e.g., `?tickers=AAPL,MSFT,GOOGL`)
- Fetches ONLY Yahoo Finance prices (no Alpha Vantage)
- Returns all prices in a single response

Then update the Screener to use this batch endpoint instead of calling `stock-data` 30 times.

### Technical Details

**New file: `supabase/functions/stock-prices/index.ts`**

```text
Input:  GET /stock-prices?tickers=AAPL,MSFT,GOOGL,META
Output: {
  "AAPL":  { current_price: 255.78, previous_close: 261.73, day_change_pct: -2.27, volume: 56290673 },
  "MSFT":  { current_price: 401.32, previous_close: 401.84, day_change_pct: -0.13, volume: 34091553 },
  ...
}
```

- Fetches Yahoo Finance chart data for each ticker in parallel (no Alpha Vantage)
- Cap at 50 tickers per request for safety
- Each Yahoo call is ~200ms, all run in parallel, so total response time is ~200-500ms vs 30+ seconds today

**New file: `src/hooks/use-batch-prices.ts`**

- A new hook that takes a list of tickers and returns a map of ticker to price data
- Used by ScreenerView instead of individual `useStockData` calls per card

**Modified: `src/components/ScreenerView.tsx`**

- Remove individual `useStockData` call from each `ScreenerCard`
- Fetch all prices in one batch at the `ScreenerView` level
- Pass price data down to each card as a prop

**Modified: `src/lib/api.ts`**

- Add a `fetchBatchPrices` function that calls the new endpoint

### Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| API calls per page load | ~30 (one per card) | 1 (batch) |
| External API calls | ~90 (Yahoo + 2x Alpha Vantage each) | ~30 (Yahoo only, server-side parallel) |
| Time to show prices | 5-30+ seconds | Under 1 second |
| Alpha Vantage rate limit risk | High | None |

### What Stays the Same

- The `stock-data` endpoint remains for the Stock Detail page where full fundamentals are needed
- The `stock_scores` table continues to provide V-Scores for the screener
- Individual stock detail views still load the full data with Alpha Vantage

