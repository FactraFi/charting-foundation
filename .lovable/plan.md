

## Fix: Trade Modal Shows $0 Price From Screener

### The Problem

When you click "Place Order" on a screener card, the `handlePlaceOrder` function constructs a `StockData` object with **hardcoded `current_price: 0`**. The batch price data is already being fetched, but it's not being passed into the trade modal.

### The Fix

Update `handlePlaceOrder` in `ScreenerView.tsx` (line 213-215) to look up the ticker's price from the already-loaded `batchPrices` data and include it in the `StockData` object passed to `onTrade`.

### Technical Details

**File: `src/components/ScreenerView.tsx`**

Change `handlePlaceOrder` to pull the current price from the batch prices map:

```typescript
const handlePlaceOrder = (ticker: string) => {
  const price = batchPrices?.[ticker];
  onTrade({
    ticker,
    name: ticker,
    current_price: price?.current_price ?? 0,
    previous_close: price?.previous_close ?? 0,
    day_change_pct: price?.day_change_pct ?? 0,
    volume: price?.volume ?? 0,
    // ... rest of fields stay as defaults
  }, 'buy');
};
```

Also apply the same fix to `handleSelectStock` (line 208-211) so the stock detail navigation gets the price too.

This is a one-line-area fix -- no new files, no new endpoints, no database changes.
