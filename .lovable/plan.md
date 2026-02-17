

## Portfolio Overhaul: KPIs, Market Hours Trading, Open Orders, Holdings, and Charts

This is the same plan as previously approved, with three targeted adjustments incorporated.

---

### Phase 2: KPI Row (Account-Level Math)

Update the top 4 KPI cards in `PortfolioView.tsx`:

| KPI | Formula |
|-----|---------|
| Net Liquidity | `cashBalance + totalMarketValue` |
| Buying Power | `cashBalance` |
| Day's P&L | `currentNetLiquidity - startOfDayLiquidity` (fallback: $10,000) |
| Day's P&L % | `(daysPnl / startOfDayLiquidity) * 100` |
| Total Return | `currentNetLiquidity - 10000` |
| Total Return % | `(totalReturn / 10000) * 100` |

**Changes:**
- Create `src/hooks/use-start-of-day-liquidity.ts` -- fetches the most recent `portfolio_history` row for the current user
- Update `PortfolioView.tsx` KPI cards to use new formulas

---

### Phase 3: Market Hours Trade Execution

**Database changes:**
- Add `'FAILED'` to the `orders.status` CHECK constraint (new enum value for overdraft protection)
- Replace the `execute_trade` function: checks if current time is within US market hours (9:30 AM - 4:00 PM EST, Mon-Fri). If OPEN: execute immediately + insert order as `FILLED`. If CLOSED: insert order as `QUEUED` only.

**New Edge Function: `process-queued-orders`**
- Finds all `QUEUED` orders
- Groups orders by user
- For each order: fetches current market price, then **checks the user's current `cash_balance` before executing** (Adjustment #2)
  - If the user has sufficient cash for a BUY order at the live price: execute (update cash, holdings, transactions) and set status to `FILLED`
  - If insufficient cash: set the order status to `FAILED` and skip to the next order
  - SELL orders: verify the user still holds enough shares; if not, mark `FAILED`
- Uses the service role key to bypass RLS

**Cron schedules (SQL inserts, not migrations):**

Adjustment #1 -- Both cron jobs use `pg_cron`'s timezone-aware scheduling to avoid DST drift:

```text
-- Market open trigger (9:30 AM Eastern, weekdays)
SELECT cron.schedule(
  'morning-order-processor',
  '30 9 * * 1-5',
  $$ ... HTTP POST to process-queued-orders ... $$
);
-- Then update to use America/New_York timezone:
UPDATE cron.job SET timezone = 'America/New_York' WHERE jobname = 'morning-order-processor';

-- Daily portfolio snapshot (4:00 PM Eastern, every day)
UPDATE cron.job SET timezone = 'America/New_York', schedule = '0 16 * * *'
WHERE jobname = 'daily-portfolio-snapshot';
```

This ensures both jobs fire at the correct local Eastern Time regardless of DST changes.

**Frontend updates:**
- Update `TradeModal.tsx` to show "Order Executed" (market open) or "Order Queued for Market Open" (market closed)
- Create `src/lib/market-hours.ts` with `isMarketOpen()` utility

---

### Phase 4: Open Orders UI

New section in `PortfolioView.tsx` placed between the Performance Chart and Holdings table.

**New hook: `src/hooks/use-orders.ts`**
- `useQueuedOrders()`: fetches orders where `status = 'QUEUED'`
- `useCancelOrder()`: updates order status to `CANCELLED`

**UI:**
- Table columns: Ticker, Side (badge), Quantity, Status (blue "Queued for Open" badge), Action (Cancel button)
- Cancel sets status to `CANCELLED` and invalidates query
- Empty state: "No pending orders at this time."

---

### Phase 5: Holdings Table Math

Already correctly implemented -- no changes needed:
- Avg Cost, Mkt Value, Total Return, Total Return % all use the correct formulas
- Zero-quantity positions are removed by `execute_trade`

---

### Phase 6: Charts and Portfolio Health

**Performance Chart and Allocation Chart** -- already correct, no changes needed.

**Portfolio Health (Beta and Sharpe Ratio):**

Adjustment #3 -- SPY data is fetched and cached server-side to avoid API rate limits:

- Create a new Edge Function: `supabase/functions/spy-history/index.ts`
  - Fetches 30-day SPY closing prices from Yahoo Finance
  - Caches the result in a `spy_daily_cache` table (columns: `date`, `close_price`, `fetched_at`)
  - On each call, checks if cached data is less than 12 hours old; if so, returns cached data without hitting Yahoo
  - If stale or missing, fetches fresh data, upserts into the cache table, and returns it
- Create `src/hooks/use-portfolio-health.ts`
  - Calls the `spy-history` edge function (not Yahoo directly)
  - Fetches last 30 days of user's `portfolio_history`
  - Calculates daily returns for both series
  - **Beta** = Covariance(portfolio returns, SPY returns) / Variance(SPY returns)
  - **Sharpe Ratio** = (avg daily return - 0.0001) / stddev * sqrt(252)
- Update the Portfolio Health card in `PortfolioView.tsx` to display computed Beta, Sharpe Ratio, and health score

---

### Technical: Files Changed

| File | Action |
|------|--------|
| Database migration | Add `FAILED` to `orders.status` CHECK; rewrite `execute_trade` function |
| `src/hooks/use-start-of-day-liquidity.ts` | Create -- fetch most recent portfolio_history row |
| `src/hooks/use-orders.ts` | Create -- queued orders query + cancel mutation |
| `src/hooks/use-portfolio-health.ts` | Create -- Beta and Sharpe calculations |
| `src/lib/market-hours.ts` | Create -- `isMarketOpen()` utility |
| `src/components/PortfolioView.tsx` | Update -- KPI formulas, Open Orders section, health metrics |
| `src/components/TradeModal.tsx` | Update -- market hours feedback |
| `supabase/functions/process-queued-orders/index.ts` | Create -- morning order processor with overdraft protection |
| `supabase/functions/spy-history/index.ts` | Create -- cached SPY history endpoint |
| `supabase/config.toml` | Add `process-queued-orders` and `spy-history` function configs |
| Database migration | Create `spy_daily_cache` table |
| SQL insert (cron) | Schedule `process-queued-orders` at 9:30 AM ET weekdays with `America/New_York` timezone |
| SQL update (cron) | Fix existing `daily-portfolio-snapshot` to use `America/New_York` timezone and `0 16 * * *` schedule |

