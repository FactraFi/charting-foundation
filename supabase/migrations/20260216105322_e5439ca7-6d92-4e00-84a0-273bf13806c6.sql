
-- Stock scores cache (Railway engine writes here, edge functions read)
CREATE TABLE public.stock_scores (
  ticker TEXT PRIMARY KEY,
  name TEXT,
  sector TEXT,
  industry TEXT,
  v_score INTEGER,
  fundamentals INTEGER,
  momentum INTEGER,
  risk INTEGER,
  sentiment INTEGER,
  style TEXT,
  rank_ic REAL,
  weights TEXT,
  why_explanation TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS with read-only anon access
ALTER TABLE public.stock_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for stock_scores"
  ON public.stock_scores FOR SELECT
  USING (true);

-- Stock universe (searchable ticker directory, grows as users search)
CREATE TABLE public.stock_universe (
  ticker TEXT PRIMARY KEY,
  name TEXT,
  sector TEXT,
  industry TEXT,
  market_cap TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_universe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for stock_universe"
  ON public.stock_universe FOR SELECT
  USING (true);

-- Edge functions need to insert into stock_universe (service role handles this)
