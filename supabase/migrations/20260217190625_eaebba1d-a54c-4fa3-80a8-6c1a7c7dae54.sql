
-- 1. Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ticker text NOT NULL,
  quantity numeric NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY', 'SELL')),
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('FILLED', 'QUEUED', 'CANCELLED')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_orders_user_id ON public.orders (user_id);

-- 2. Modify portfolio_history table
ALTER TABLE public.portfolio_history
  DROP COLUMN cash_balance,
  DROP COLUMN invested_value,
  DROP COLUMN total_value;

ALTER TABLE public.portfolio_history
  ADD COLUMN total_net_liquidity numeric NOT NULL DEFAULT 0;
