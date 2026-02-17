

## Fix: Day's P&L Should Be $0 for Trades Placed While Market Is Closed

### Problem
When you buy a stock after market close, the system compares the current price against the previous day's close. Since the stock may have dropped during that trading day (before you owned it), you see a phantom loss that isn't yours.

**Example:** You buy NVDA at $182.78 (current/after-hours price). The previous close was $186.97. The system reports -$8.38 Day's P&L even though you just bought it and have no real intraday loss.

### Fix
For Day's P&L, the baseline price for each holding should be the **higher of** the previous close and the user's average cost. This way:
- If you bought today (avg_cost >= previous_close in most cases, or close to current price), your Day's P&L contribution is ~$0
- If you held overnight, the normal previous_close logic applies

### Technical Changes

**File: `src/hooks/use-holdings-prices.ts`**

Update the Day's P&L loop (line 46) to use the user's entry price as the floor for the baseline:

```ts
for (const h of holdings) {
  const stock = stockDataMap.get(h.ticker);
  const price = stock?.current_price ?? h.avg_cost;
  const prevClose = stock?.previous_close ?? price;

  // Use the higher of previous_close and avg_cost as baseline.
  // This prevents showing phantom losses for positions opened
  // after the previous close (e.g., during after-hours or same day).
  const baseline = Math.max(prevClose, h.avg_cost);

  totalMarketValue += price * h.shares;
  totalCost += h.avg_cost * h.shares;
  daysPnl += (price - baseline) * h.shares;
}
```

This is a single-line change that ensures:
- **New positions** (bought at or near current price): Day's P&L shows ~$0
- **Existing positions** (held overnight, avg_cost < previous_close): Day's P&L tracks the normal daily move from previous close

