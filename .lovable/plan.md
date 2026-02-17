

## Upgrade Trading System: Limit Orders and Reserved Cash

### Overview

This upgrade adds three database-level changes to support limit orders with reserved cash, ensuring buying power correctly accounts for funds already committed to pending orders.

### Database Changes

**1. Add `reserved_cash` column to `profiles` table**

A new `numeric` column defaulting to `0` will track funds reserved for pending buy limit orders.

**2. Create `orders` table**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | References the user, not nullable |
| ticker | text | Stock symbol |
| side | text | `BUY` or `SELL` |
| order_type | text | `MARKET` or `LIMIT` |
| limit_price | numeric | Nullable (null for market orders) |
| quantity | numeric | Number of shares |
| status | text | `PENDING`, `FILLED`, `CANCELLED`, `QUEUED` |
| created_at | timestamptz | Default `now()` |

RLS policies will restrict users to only see and insert their own orders.

**3. Update `execute_trade` function**

The buying power check changes from:

```
IF v_cash < v_total
```

to:

```
IF (v_cash - v_reserved) < v_total
```

where `v_reserved` is the user's current `reserved_cash` value.

**4. Update the UI**

- **TradeModal**: The "Available" display will show `cash_balance - reserved_cash` instead of just `cash_balance`.
- **PortfolioView / DashboardView**: The "Buying Power" KPI will also reflect `cash_balance - reserved_cash`.
- No changes to how limit orders are placed in the modal UI (it already has the Market/Limit toggle) -- but limit orders will now be recorded in the `orders` table with status `PENDING` instead of executing immediately.

### Technical Details

**Migration SQL** (single migration):

```sql
-- 1. Add reserved_cash to profiles
ALTER TABLE public.profiles
  ADD COLUMN reserved_cash numeric NOT NULL DEFAULT 0;

-- 2. Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticker text NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY', 'SELL')),
  order_type text NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
  limit_price numeric,
  quantity numeric NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'QUEUED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Update execute_trade to account for reserved_cash
CREATE OR REPLACE FUNCTION public.execute_trade(
  p_ticker text, p_type text, p_shares numeric, p_price numeric
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid;
  v_cash numeric;
  v_reserved numeric;
  v_total numeric;
  v_existing_shares numeric;
  v_existing_avg numeric;
  v_existing_id uuid;
  v_new_shares numeric;
  v_new_avg numeric;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_price <= 0 THEN RAISE EXCEPTION 'Invalid price: must be greater than zero'; END IF;

  SELECT cash_balance, reserved_cash INTO v_cash, v_reserved
    FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  v_total := p_shares * p_price;

  SELECT id, shares, avg_cost INTO v_existing_id, v_existing_shares, v_existing_avg
    FROM public.holdings WHERE user_id = v_uid AND ticker = p_ticker;

  IF p_type = 'buy' THEN
    IF (v_cash - v_reserved) < v_total THEN
      RAISE EXCEPTION 'Insufficient buying power';
    END IF;
    UPDATE public.profiles SET cash_balance = cash_balance - v_total WHERE id = v_uid;
    IF v_existing_id IS NOT NULL THEN
      v_new_shares := v_existing_shares + p_shares;
      v_new_avg := (v_existing_avg * v_existing_shares + v_total) / v_new_shares;
      UPDATE public.holdings SET shares = v_new_shares, avg_cost = v_new_avg, updated_at = now()
        WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.holdings (user_id, ticker, shares, avg_cost)
        VALUES (v_uid, p_ticker, p_shares, p_price);
    END IF;
  ELSIF p_type = 'sell' THEN
    IF v_existing_id IS NULL OR v_existing_shares < p_shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;
    UPDATE public.profiles SET cash_balance = cash_balance + v_total WHERE id = v_uid;
    v_new_shares := v_existing_shares - p_shares;
    IF v_new_shares <= 0 THEN
      DELETE FROM public.holdings WHERE id = v_existing_id;
    ELSE
      UPDATE public.holdings SET shares = v_new_shares, updated_at = now() WHERE id = v_existing_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid trade type: %', p_type;
  END IF;

  INSERT INTO public.transactions (user_id, ticker, type, shares, price)
    VALUES (v_uid, p_ticker, p_type, p_shares, p_price);
END;
$$;
```

**Code changes:**

- **`src/contexts/AuthContext.tsx`**: Add `reserved_cash` to the `Profile` interface.
- **`src/components/TradeModal.tsx`**: Show buying power as `cash_balance - reserved_cash`. For limit orders, insert into the `orders` table with status `PENDING` and increase `reserved_cash` instead of calling `execute_trade`. Market orders continue to call `execute_trade` as before.
- **`src/hooks/use-portfolio.ts`**: Add a `useOrders` hook to fetch orders for the current user.
- **`src/components/PortfolioView.tsx`** and **`src/components/DashboardView.tsx`**: Update buying power displays to subtract `reserved_cash`.

