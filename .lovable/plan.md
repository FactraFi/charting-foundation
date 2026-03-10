

## Replace Mock V-Score History with Real Historical Data

### Current State
- The V-Score History chart uses **randomly generated mock data** inline in `StockDetailView.tsx` (lines 127-133)
- The `stock_scores` table stores only the **latest** scores per ticker — no historical snapshots exist
- The `seed-scores` edge function upserts (overwrites) scores on each run, destroying previous values
- There is no `score_history` or equivalent table in the database

### What Needs to Happen

**1. Create a `score_history` table** (database migration)

```sql
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
```

**2. Create a `snapshot-scores` edge function** to snapshot current scores daily

- Reads all rows from `stock_scores`
- Inserts them into `score_history` with today's date (upsert on `ticker, snapshot_date`)
- Designed to be called once daily (via cron or manual trigger)
- This function can also be invoked immediately to backfill today's snapshot

**3. Seed initial historical data**

Since no historical data exists yet, the snapshot function will include a **backfill mode** that creates 19 days of synthetic-but-realistic history by applying small random variations (within +/-5) to current scores. This gives the chart meaningful data from day one. Over time, real daily snapshots replace this.

**4. Create a `useScoreHistory` hook** (`src/hooks/use-score-history.ts`)

- Fetches the last 20 days of score data for a given ticker from `score_history`
- Returns data formatted for the Recharts bar chart
- Uses date formatting (e.g., "Mar 5") instead of "Day 0"

**5. Update `StockDetailView.tsx`**

- Replace the inline mock `vScoreHistory` array with data from `useScoreHistory`
- Show a loading skeleton while data loads
- Format X-axis labels as dates (e.g., "Mar 1", "Mar 2")
- Fall back to current scores if no history exists

**6. Modify `seed-scores` to auto-snapshot**

- After upserting to `stock_scores`, also insert into `score_history` for today's date
- This means every score refresh automatically creates a historical record — no separate cron needed long-term

### File Changes Summary

| File | Action |
|------|--------|
| Database migration | Create `score_history` table with RLS |
| `supabase/functions/seed-scores/index.ts` | Add insert into `score_history` after each upsert |
| `supabase/functions/snapshot-scores/index.ts` | New function: backfill 19 days + daily snapshot |
| `src/hooks/use-score-history.ts` | New hook: fetch last 20 days from `score_history` |
| `src/components/StockDetailView.tsx` | Replace mock data with `useScoreHistory` hook, format dates |

