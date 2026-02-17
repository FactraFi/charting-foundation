

## Fix: Day's P&L Still Showing Phantom Loss

### Root Cause

The previous fix used `Math.max(prevClose, avg_cost)` as the baseline, which made the problem **worse** in this case:

- `avg_cost = $182.78` (your purchase price)
- `previous_close = $186.97` (yesterday's close -- higher than your cost)
- `current_price = $182.78`
- `Math.max(186.97, 182.78) = 186.97` -- still using previous close!
- Result: `(182.78 - 186.97) * 6 = -$25.14` -- phantom loss persists

The issue is that when the stock dropped from $186.97 to $182.78 **before** you bought it, you shouldn't inherit that loss.

### Correct Fix

The Day's P&L for any holding should never show a bigger loss than your **total return** on that position. In other words, you can't lose more today than you've lost overall since buying.

**Formula change in `src/hooks/use-holdings-prices.ts`:**

Replace the current baseline logic:
```ts
const baseline = Math.max(prevClose, h.avg_cost);
daysPnl += (price - baseline) * h.shares;
```

With:
```ts
const dailyMove = (price - prevClose) * h.shares;
const totalPnl = (price - h.avg_cost) * h.shares;
// Day's P&L can't exceed total P&L in magnitude for positions opened today
daysPnl += totalPnl >= 0
  ? Math.min(dailyMove, totalPnl)   // cap gains at total gain
  : Math.max(dailyMove, totalPnl);  // cap losses at total loss
```

### How This Works

| Scenario | daily move | total P&L | Day's P&L |
|----------|-----------|-----------|-----------|
| Bought today at current price | -$25.14 | $0.00 | **$0.00** (capped) |
| Held overnight, stock up | +$10 | +$50 | **+$10** (normal) |
| Held overnight, stock down | -$10 | -$5 | **-$5** (capped at total loss) |
| Held overnight, stock down | -$10 | -$50 | **-$10** (normal, total loss is bigger) |

This single change in `src/hooks/use-holdings-prices.ts` ensures Day's P&L never reports a loss bigger than what you've actually lost since opening the position.
