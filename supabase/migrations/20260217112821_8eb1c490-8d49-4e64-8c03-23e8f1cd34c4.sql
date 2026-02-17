
-- Create transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  ticker text NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  shares numeric NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atomic trade function
CREATE OR REPLACE FUNCTION public.execute_trade(
  p_ticker text,
  p_type text,
  p_shares numeric,
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_cash numeric;
  v_total numeric;
  v_existing_shares numeric;
  v_existing_avg numeric;
  v_existing_id uuid;
  v_new_shares numeric;
  v_new_avg numeric;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current cash balance
  SELECT cash_balance INTO v_cash
    FROM public.profiles
    WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_total := p_shares * p_price;

  -- Get existing holding if any
  SELECT id, shares, avg_cost INTO v_existing_id, v_existing_shares, v_existing_avg
    FROM public.holdings
    WHERE user_id = v_uid AND ticker = p_ticker;

  IF p_type = 'buy' THEN
    IF v_cash < v_total THEN
      RAISE EXCEPTION 'Insufficient buying power';
    END IF;

    -- Deduct cash
    UPDATE public.profiles SET cash_balance = cash_balance - v_total WHERE id = v_uid;

    -- Upsert holding
    IF v_existing_id IS NOT NULL THEN
      v_new_shares := v_existing_shares + p_shares;
      v_new_avg := (v_existing_avg * v_existing_shares + v_total) / v_new_shares;
      UPDATE public.holdings
        SET shares = v_new_shares, avg_cost = v_new_avg, updated_at = now()
        WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.holdings (user_id, ticker, shares, avg_cost)
        VALUES (v_uid, p_ticker, p_shares, p_price);
    END IF;

  ELSIF p_type = 'sell' THEN
    IF v_existing_id IS NULL OR v_existing_shares < p_shares THEN
      RAISE EXCEPTION 'Insufficient shares';
    END IF;

    -- Add cash
    UPDATE public.profiles SET cash_balance = cash_balance + v_total WHERE id = v_uid;

    -- Update or delete holding
    v_new_shares := v_existing_shares - p_shares;
    IF v_new_shares <= 0 THEN
      DELETE FROM public.holdings WHERE id = v_existing_id;
    ELSE
      UPDATE public.holdings
        SET shares = v_new_shares, updated_at = now()
        WHERE id = v_existing_id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid trade type: %', p_type;
  END IF;

  -- Record transaction
  INSERT INTO public.transactions (user_id, ticker, type, shares, price)
    VALUES (v_uid, p_ticker, p_type, p_shares, p_price);
END;
$$;
