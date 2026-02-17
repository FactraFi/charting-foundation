## Fix: Day's P&L Clamping Logic Bug

### Root Cause

The current clamping logic fails when `totalPnl` is exactly `$0.00`:

```
dailyMove = (182.78 - 186.97) * 6 = -$25.14
totalPnl  = (182.78 - 182.78) * 6 =  $0.00

totalPnl >= 0  -->  true  (0 is >= 0)
Math.min(dailyMove, totalPnl)  =  Math.min(-25.14, 0)  =  -$25.14  <-- BUG!
```

`Math.min` selects the more negative number, which is the opposite of what we want.

### How Real Trading Platforms Handle This

Brokerages like Robinhood, Schwab, and Fidelity use a simple rule:

- **Position opened before today**: Day's P&L = (current price - previous close) x shares
- **Position opened today**: Day's P&L = (current price - average cost) x shares

The key insight: if you opened the position today, the "start of day" value for that position is your purchase price, not yesterday's close.

### The Fix

We have `created_at` on each holding record. We can compare it against today's date to choose the correct baseline.

**File: `src/hooks/use-holdings-prices.ts**`

```ts
// Helper: check if a date string is from today
const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

for (const h of holdings) {
  const stock = stockDataMap.get(h.ticker);
  const price = stock?.current_price ?? h.avg_cost;
  const prevClose = stock?.previous_close ?? price;

  totalMarketValue += price * h.shares;
  totalCost += h.avg_cost * h.shares;

  // Positions opened today: baseline is your purchase price
  // Positions held overnight: baseline is previous close
  const baseline = isToday(h.created_at) ? h.avg_cost : prevClose;
  daysPnl += (price - baseline) * h.shares;
}
```

### Walkthrough of Every Scenario

**Scenario 1: Bought today at current price (your case)**

- avg_cost = $182.78, prevClose = $186.97, price = $182.78
- `isToday` = true, so baseline = $182.78 (avg_cost)
- Day's P&L = ($182.78 - $182.78) x 6 = **$0.00**

**Scenario 2: Bought today, price moved up since purchase**

- avg_cost = $180.00, prevClose = $186.97, price = $185.00
- `isToday` = true, so baseline = $180.00 (avg_cost)
- Day's P&L = ($185.00 - $180.00) x 6 = **+$30.00** (real gain since you bought)

**Scenario 3: Bought today, price dropped since purchase**

- avg_cost = $185.00, prevClose = $186.97, price = $182.00
- `isToday` = true, so baseline = $185.00 (avg_cost)
- Day's P&L = ($182.00 - $185.00) x 6 = **-$18.00** (real loss since you bought)

**Scenario 4: Held overnight, stock goes up**

- avg_cost = $170.00, prevClose = $186.97, price = $190.00
- `isToday` = false, so baseline = $186.97 (prevClose)
- Day's P&L = ($190.00 - $186.97) x 6 = **+$18.18** (today's move only)

**Scenario 5: Held overnight, stock goes down**

- avg_cost = $170.00, prevClose = $186.97, price = $183.00
- `isToday` = false, so baseline = $186.97 (prevClose)
- Day's P&L = ($183.00 - $186.97) x 6 = **-$23.82** (today's drop only)

**Scenario 6: Held overnight, stock recovers from a loss**

- avg_cost = $190.00, prevClose = $183.00, price = $185.00
- `isToday` = false, so baseline = $183.00 (prevClose)
- Day's P&L = ($185.00 - $183.00) x 6 = **+$12.00** (today's recovery)

### Why This Is Better Than Clamping

The previous clamping approach had two flaws:

1. The Math.min/Math.max logic was inverted for zero-P&L positions
2. It would incorrectly suppress legitimate daily gains on recovering positions (Scenario 6 above would show $0 instead of +$12)

The date-based approach matches how real brokerages work and handles all edge cases correctly.

### Summary of Changes

Single file change: `src/hooks/use-holdings-prices.ts`

- Add an `isToday()` helper function
- Replace the clamping logic with a simple baseline selection based on whether the position was opened today or held overnight