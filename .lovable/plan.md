

## Root Cause Analysis and Fix for Missing Holdings

### What Happened

The `process-queued-orders` edge function ran this morning and marked 9 orders as **FILLED**, but it failed silently mid-execution -- it updated order statuses but **did not** create corresponding transactions or update holdings/cash. Here is the evidence:

- **Holdings table**: completely empty for all users
- **Orders table**: 9 orders from today are marked `FILLED` (across 2 users)
- **Transactions table**: zero entries for today -- none of those "filled" orders produced a transaction
- **Cash balances**: unchanged (e.g., user `2b4a7d28` still shows exactly $10,000, despite "filling" 11 shares)
- **Edge function logs**: no logs available, suggesting the function either timed out or crashed without logging

The function processes each order as a sequence of independent database calls (read profile, update cash, upsert holding, insert transaction, update order status). Because these are **not wrapped in a database transaction**, a partial failure leaves the data in an inconsistent state. In this case, the order status was updated to FILLED but the actual trade operations (cash deduction, holding creation, transaction logging) were lost.

Additionally, prior holdings from Feb 17-18 that were created through the `execute_trade` RPC (which does work correctly) are also gone. This means the batch processor likely **deleted existing holdings** during a failed sell-flow path or the holdings were wiped by another mechanism.

---

### The Fix (3 Parts)

### Part 1: Restore missing holdings from transaction history

Create a new database function `rebuild_holdings_from_transactions` that:
- Reads all transactions for every user
- Computes net shares per ticker (summing buys, subtracting sells)
- Computes weighted average cost for remaining shares
- Replaces the holdings table contents with the correct calculated values
- Recalculates correct cash balances (starting from $10,000 base)

This will be run once as a data recovery step, then kept available as a safety net.

### Part 2: Rewrite `process-queued-orders` to use an atomic database function

Replace the current edge function's multi-step JS logic with a single **database function** called `fill_queued_order` that runs inside a PostgreSQL transaction. This ensures all-or-nothing execution:

```text
BEGIN transaction
  1. Verify order is still QUEUED
  2. Fetch user cash balance
  3. Validate funds (buy) or shares (sell)
  4. Update cash balance
  5. Upsert/delete holding
  6. Insert transaction record
  7. Update order status to FILLED
COMMIT (or ROLLBACK on any failure -> mark FAILED)
```

The edge function will then simply:
1. Fetch prices for all QUEUED order tickers
2. Call `fill_queued_order(order_id, price)` for each order
3. Return results

If any step fails, the entire order rolls back and is marked FAILED -- no more phantom "FILLED" orders with no actual trade.

### Part 3: Add error logging and safeguards

- Add `console.log` statements in the edge function to track each order's processing
- Add a pre-check: if the function detects orders that were marked FILLED but have no matching transaction, log a warning

---

### Technical Details

**New database function: `fill_queued_order(p_order_id uuid, p_price numeric)`**

A SECURITY DEFINER PL/pgSQL function that:
- Runs in a single transaction (automatic in PL/pgSQL)
- Looks up the order, validates status is QUEUED
- Performs the buy/sell logic (same as `execute_trade` but using service-level access)
- Inserts a transaction record
- Updates order status to FILLED
- On any exception, marks order FAILED and re-raises

**Modified file: `supabase/functions/process-queued-orders/index.ts`**

Simplified to:
1. Fetch all QUEUED orders
2. Batch-fetch prices from Yahoo
3. For each order, call `supabase.rpc('fill_queued_order', { p_order_id, p_price })`
4. Collect results and return summary

**Data recovery: one-time SQL to rebuild holdings**

A database function that replays all transactions to reconstruct correct holdings and cash balances for every user.

### Files Changed

| File / Resource | Change |
|------|--------|
| Database migration | Create `fill_queued_order` function (atomic order processing) |
| Database migration | Create `rebuild_holdings_from_transactions` function (data recovery) |
| `supabase/functions/process-queued-orders/index.ts` | Simplify to price-fetch + RPC calls instead of manual multi-step logic |
| One-time SQL execution | Run `rebuild_holdings_from_transactions()` to restore all missing data |

