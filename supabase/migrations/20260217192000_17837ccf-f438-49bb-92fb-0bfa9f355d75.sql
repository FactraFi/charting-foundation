
-- 1. Create spy_daily_cache table
CREATE TABLE public.spy_daily_cache (
  date date NOT NULL PRIMARY KEY,
  close_price numeric NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.spy_daily_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for spy_daily_cache"
  ON public.spy_daily_cache FOR SELECT USING (true);

-- 2. Add a CHECK constraint for orders.status that includes FAILED
-- First drop the existing constraint if any, then add new one
DO $$
BEGIN
  -- Try to drop existing check constraint on status column
  BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('QUEUED', 'FILLED', 'CANCELLED', 'FAILED'));

-- 3. Rewrite execute_trade to be market-hours-aware
CREATE OR REPLACE FUNCTION public.execute_trade(p_ticker text, p_type text, p_shares numeric, p_price numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid;
  v_cash numeric;
  v_total numeric;
  v_existing_shares numeric;
  v_existing_avg numeric;
  v_existing_id uuid;
  v_new_shares numeric;
  v_new_avg numeric;
  v_now_et timestamp;
  v_dow int;
  v_time time;
  v_market_open boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_price <= 0 THEN
    RAISE EXCEPTION 'Invalid price: must be greater than zero';
  END IF;

  -- Determine if US market is open (9:30-16:00 ET, Mon-Fri)
  v_now_et := (now() AT TIME ZONE 'America/New_York');
  v_dow := EXTRACT(ISODOW FROM v_now_et);  -- 1=Mon, 7=Sun
  v_time := v_now_et::time;
  v_market_open := (v_dow BETWEEN 1 AND 5) AND (v_time >= '09:30:00' AND v_time < '16:00:00');

  IF NOT v_market_open THEN
    -- Market closed: queue the order, don't touch cash/holdings
    INSERT INTO public.orders (user_id, ticker, side, quantity, status)
      VALUES (v_uid, p_ticker, p_type, p_shares, 'QUEUED');
    RETURN;
  END IF;

  -- Market is open: execute immediately
  SELECT cash_balance INTO v_cash FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  v_total := p_shares * p_price;

  SELECT id, shares, avg_cost INTO v_existing_id, v_existing_shares, v_existing_avg
    FROM public.holdings WHERE user_id = v_uid AND ticker = p_ticker;

  IF p_type = 'buy' THEN
    IF v_cash < v_total THEN RAISE EXCEPTION 'Insufficient buying power'; END IF;
    UPDATE public.profiles SET cash_balance = cash_balance - v_total WHERE id = v_uid;
    IF v_existing_id IS NOT NULL THEN
      v_new_shares := v_existing_shares + p_shares;
      v_new_avg := (v_existing_avg * v_existing_shares + v_total) / v_new_shares;
      UPDATE public.holdings SET shares = v_new_shares, avg_cost = v_new_avg, updated_at = now() WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.holdings (user_id, ticker, shares, avg_cost) VALUES (v_uid, p_ticker, p_shares, p_price);
    END IF;
  ELSIF p_type = 'sell' THEN
    IF v_existing_id IS NULL OR v_existing_shares < p_shares THEN RAISE EXCEPTION 'Insufficient shares'; END IF;
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

  INSERT INTO public.transactions (user_id, ticker, type, shares, price) VALUES (v_uid, p_ticker, p_type, p_shares, p_price);
  INSERT INTO public.orders (user_id, ticker, side, quantity, status) VALUES (v_uid, p_ticker, p_type, p_shares, 'FILLED');
END;
$function$;
