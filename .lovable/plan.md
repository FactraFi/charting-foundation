

## Fix: Phantom P&L Caused by $0 Price Trades

### What's Actually Wrong

The Day's P&L logic (isToday baseline) is now correct -- it shows $0.00 for NVDA and META as expected. The $3,443.35 Day's P&L comes entirely from **V and JPM which were recorded with a purchase price of $0.00** in the database.

This happened because the trade modal uses `stock?.current_price || 0` for the price. If the stock data API hadn't finished loading when you submitted the trade, the price was sent as $0. The database function accepted it without complaint, creating holdings at zero cost and deducting $0 from your cash balance.

### Two-Part Fix

**Part 1: Prevent future $0 trades (TradeModal + database)**

- **TradeModal**: Disable the submit button when `currentPrice` is 0 or stock data is still loading
- **Database function**: Add a guard in `execute_trade` to reject trades where `p_price <= 0`

**Part 2: Fix the existing bad data**

Run a SQL migration to correct the V and JPM holdings:
- Update V's `avg_cost` to its current market price (the price at time of purchase)
- Update JPM's `avg_cost` to its current market price
- Update the corresponding transaction records
- Adjust the user's cash balance to reflect what should have been deducted

### Technical Details

**File: `src/components/TradeModal.tsx`**
- Add a check: if `currentPrice <= 0`, disable the Confirm button and show "Waiting for price data..."

**Database migration (SQL):**

```sql
-- Prevent $0 trades at the database level
CREATE OR REPLACE FUNCTION public.execute_trade(...)
  -- Add at the top of the function body:
  IF p_price <= 0 THEN
    RAISE EXCEPTION 'Invalid price: must be greater than zero';
  END IF;
```

**Data fix migration (SQL):**
- Query the current prices for V and JPM via the stock-data edge function
- Update holdings rows where avg_cost = 0 with the correct price
- Update matching transaction rows
- Deduct the correct total cost from the user's cash balance

### Summary

| Change | Purpose |
|--------|---------|
| TradeModal: disable submit when price is 0 | Prevent UI from sending bad data |
| execute_trade: reject p_price <= 0 | Database-level safety net |
| Fix V and JPM holdings data | Correct the existing $0 cost records |
| Adjust cash balance | Reflect what should have been charged |

