

## Convert V-Score History to Interactive Line Chart

### Changes

**1. `src/hooks/use-score-history.ts`**
- Add `v_score` to the select query and returned data type (`ScoreHistoryPoint`)
- Accept `days` parameter (default 30) — the hook already does this but the component hardcodes 20
- Include `"Total"` (v_score) field in the returned data points

**2. `src/components/StockDetailView.tsx`**

**Chart conversion:**
- Replace `BarChart`/`Bar` imports with `LineChart`/`Line` from recharts
- Render 5 lines: Total (v_score), Fundamentals, Momentum, Risk, Sentiment — each with a distinct color

**Toggle buttons (legend):**
- Add local state: `visibleLines` — a `Set<string>` initialized with all 5 series names
- Below the chart, render 5 toggle buttons (colored dots + label). Clicking toggles that series in/out of `visibleLines`
- Each `<Line>` is conditionally rendered or hidden based on the set

**Time range selector:**
- Add local state: `days` (default 30)
- Top-right corner of the card header: 3 buttons — 30D, 60D, 90D — styled as pills, active one highlighted
- Pass `days` to `useScoreHistory(stock.ticker, days)`

**Fallback removal:**
- Remove the inline mock data fallback (lines 130-143) — show skeleton or "No data" if empty

**3. `supabase/functions/snapshot-scores/index.ts`**
- Already stores `v_score` — no changes needed

**4. Database**
- `score_history` table already has `v_score` column — no migration needed

### Visual Design
- Line colors: Total = primary, Fundamentals = emerald, Momentum = cyan, Risk = amber, Sentiment = violet
- Toggle buttons: small rounded pills with colored dot, dimmed when inactive
- Time range buttons: compact pills in top-right, matching existing card styling

