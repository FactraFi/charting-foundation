CREATE TABLE public.score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  v_score integer,
  fundamentals integer,
  momentum integer,
  risk integer,
  sentiment integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticker, snapshot_date)
);

ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for score_history"
  ON public.score_history FOR SELECT TO public USING (true);

CREATE INDEX idx_score_history_ticker_date
  ON public.score_history (ticker, snapshot_date DESC);