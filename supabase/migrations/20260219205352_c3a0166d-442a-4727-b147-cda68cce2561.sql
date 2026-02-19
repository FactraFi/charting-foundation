
-- ============================================================
-- Part 1: Atomic order-filling function (replaces multi-step JS logic)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fill_queued_order(p_order_id uuid, p_price numeric)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
  v_cash numeric;
  v_total numeric;
  v_existing_id uuid;
  v_existing_shares numeric;
  v_existing_avg numeric;
  v_new_shares numeric;
  v_new_avg numeric;
BEGIN
  -- 1. Lock and validate order is QUEUED
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
  IF v_order.status <> 'QUEUED' THEN
    RAISE EXCEPTION 'Order % is not QUEUED (status: %)', p_order_id, v_order.status;
  END IF;

  IF p_price <= 0 THEN
    RAISE EXCEPTION 'Invalid price: must be greater than zero';
  END IF;

  v_total := v_order.quantity * p_price;

  -- 2. Get user cash (with row lock)
  SELECT cash_balance INTO v_cash FROM public.profiles WHERE id = v_order.user_id FOR UPDATE;
  IF NOT FOUND THEN
    UPDATE public.orders SET status = 'FAILED' WHERE id = p_order_id;
    RETURN 'FAILED: profile not found';
  END IF;

  -- 3. Get existing holding if any
  SELECT id, shares, avg_cost INTO v_existing_id, v_existing_shares, v_existing_avg
    FROM public.holdings WHERE user_id = v_order.user_id AND ticker = v_order.ticker FOR UPDATE;

  IF v_order.side = 'BUY' THEN
    -- Validate funds
    IF v_cash < v_total THEN
      UPDATE public.orders SET status = 'FAILED' WHERE id = p_order_id;
      RETURN 'FAILED: insufficient funds';
    END IF;

    -- Deduct cash
    UPDATE public.profiles SET cash_balance = cash_balance - v_total WHERE id = v_order.user_id;

    -- Upsert holding
    IF v_existing_id IS NOT NULL THEN
      v_new_shares := v_existing_shares + v_order.quantity;
      v_new_avg := (v_existing_avg * v_existing_shares + v_total) / v_new_shares;
      UPDATE public.holdings SET shares = v_new_shares, avg_cost = v_new_avg, updated_at = now() WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.holdings (user_id, ticker, shares, avg_cost) VALUES (v_order.user_id, v_order.ticker, v_order.quantity, p_price);
    END IF;

  ELSIF v_order.side = 'SELL' THEN
    -- Validate shares
    IF v_existing_id IS NULL OR v_existing_shares < v_order.quantity THEN
      UPDATE public.orders SET status = 'FAILED' WHERE id = p_order_id;
      RETURN 'FAILED: insufficient shares';
    END IF;

    -- Add cash
    UPDATE public.profiles SET cash_balance = cash_balance + v_total WHERE id = v_order.user_id;

    -- Update/remove holding
    v_new_shares := v_existing_shares - v_order.quantity;
    IF v_new_shares <= 0 THEN
      DELETE FROM public.holdings WHERE id = v_existing_id;
    ELSE
      UPDATE public.holdings SET shares = v_new_shares, updated_at = now() WHERE id = v_existing_id;
    END IF;
  ELSE
    UPDATE public.orders SET status = 'FAILED' WHERE id = p_order_id;
    RETURN 'FAILED: invalid side ' || v_order.side;
  END IF;

  -- 4. Log transaction
  INSERT INTO public.transactions (user_id, ticker, type, shares, price)
    VALUES (v_order.user_id, v_order.ticker, LOWER(v_order.side), v_order.quantity, p_price);

  -- 5. Mark filled
  UPDATE public.orders SET status = 'FILLED' WHERE id = p_order_id;

  RETURN 'FILLED';

EXCEPTION WHEN OTHERS THEN
  -- On any unexpected error, mark failed (this runs in a new subtransaction context)
  BEGIN
    UPDATE public.orders SET status = 'FAILED' WHERE id = p_order_id;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- can't even update the order, just let it go
  END;
  RAISE;
END;
$function$;

-- ============================================================
-- Part 2: Data recovery function
-- ============================================================
CREATE OR REPLACE FUNCTION public.rebuild_holdings_from_transactions()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_holding RECORD;
  v_total_spent numeric;
  v_count int := 0;
BEGIN
  -- Clear all current holdings
  DELETE FROM public.holdings;

  -- Rebuild holdings from transactions
  FOR v_holding IN
    SELECT
      t.user_id,
      t.ticker,
      SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE -t.shares END) AS net_shares,
      -- Weighted avg cost: only from buy transactions
      CASE
        WHEN SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE 0 END) > 0
        THEN SUM(CASE WHEN t.type = 'buy' THEN t.shares * t.price ELSE 0 END)
             / SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE 0 END)
        ELSE 0
      END AS avg_cost
    FROM public.transactions t
    GROUP BY t.user_id, t.ticker
    HAVING SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE -t.shares END) > 0
  LOOP
    INSERT INTO public.holdings (user_id, ticker, shares, avg_cost)
      VALUES (v_holding.user_id, v_holding.ticker, v_holding.net_shares, v_holding.avg_cost);
    v_count := v_count + 1;
  END LOOP;

  -- Rebuild cash balances from transactions (starting from $10,000)
  FOR v_user IN
    SELECT
      t.user_id,
      10000.00 - SUM(CASE WHEN t.type = 'buy' THEN t.shares * t.price ELSE -(t.shares * t.price) END) AS correct_cash
    FROM public.transactions t
    GROUP BY t.user_id
  LOOP
    UPDATE public.profiles SET cash_balance = v_user.correct_cash WHERE id = v_user.user_id;
  END LOOP;

  RETURN 'Rebuilt ' || v_count || ' holdings, recalculated cash for all users with transactions';
END;
$function$;
