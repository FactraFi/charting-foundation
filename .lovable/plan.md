

## Side-by-Side V-Score + Price Chart & Fix Time Range Buttons

### Bug: 30D/60D/90D Buttons

The buttons correctly update state and the hook accepts the `days` param. However, the `snapshot-scores` function was only called with `backfill_days=19`, so the database only has ~20 days of history. Selecting 60D or 90D returns the same 20 rows. **Fix**: Re-run `snapshot-scores` with `backfill_days: 89` to populate 90 days of data.

### Layout Change

Currently V-Score History and Price Chart are stacked vertically. Move them side-by-side in a `grid grid-cols-1 lg:grid-cols-2` container:
- **Left**: V-Score History (keep all existing content — header, time range buttons, line chart, toggle legend)
- **Right**: Price Chart (TradingView widget)

Both panels share the same height. Reduce the TradingView chart height from `480px` to match the V-Score panel height (~400px total including header/legend).

### File Changes

| File | Change |
|------|--------|
| `src/components/StockDetailView.tsx` | Wrap V-Score History (lines 289-356) and Price Chart (lines 358-367) in a single `grid grid-cols-1 lg:grid-cols-2 gap-4` div. Adjust heights so both panels match. |
| Edge function call | Invoke `snapshot-scores` with `{ backfill_days: 89 }` to seed 90 days of history |
| `src/hooks/use-score-history.ts` | Increase `.limit(days)` to `.limit(days + 5)` as a safety buffer for date boundaries |

