
-- Create portfolio_history table
CREATE TABLE public.portfolio_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_value numeric NOT NULL,
  cash_balance numeric NOT NULL,
  invested_value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate snapshots
CREATE UNIQUE INDEX idx_portfolio_history_user_date ON public.portfolio_history (user_id, date);

-- Enable RLS
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own history
CREATE POLICY "Users can read own portfolio history"
  ON public.portfolio_history
  FOR SELECT
  USING (auth.uid() = user_id);
