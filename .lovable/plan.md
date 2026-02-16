

# UI Polish: Three Small Fixes

## 1. Rename "Confidence Score" to "FactraFi Score" on the hero gauge

**File:** `src/components/FactraScoreGauge.tsx` (line 126)

Currently the large variant shows "Confidence Score" while the medium variant shows "FactraFi Score". Change both to always show **"FactraFi Score"**.

Replace the ternary `{isMedium ? "FactraFi Score" : "Confidence Score"}` with just `"FactraFi Score"`.

## 2. Match the Price chart height to V-Score History

**File:** `src/components/StockDetailView.tsx` (line 208)

The Price chart container has a fixed `h-[400px]` but the V-Score History panel has no fixed height (it sizes naturally from its `h-[320px]` inner chart + padding + legend, totaling roughly 460px+). The fix is to remove the fixed height from the Price chart and let it stretch to match the V-Score History height via the grid.

- Line 208: Change `h-[400px]` to `min-h-[400px]` and add `h-full` so the grid stretches both columns equally. The resulting class becomes: `bg-background border border-border rounded-xl p-6 min-h-[400px] h-full relative overflow-hidden flex flex-col group`.

## 3. Make "Summary:" label green

**File:** `src/components/DashboardView.tsx` (line 312)

Change the "Summary:" span from `text-foreground` to `text-primary` so it uses the brand green color.

Replace: `className="font-bold text-foreground underline underline-offset-2"`
With: `className="font-bold text-primary underline underline-offset-2"`

## Files to Modify

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/FactraScoreGauge.tsx` | 126 | Replace ternary with `"FactraFi Score"` |
| `src/components/StockDetailView.tsx` | 208 | Change `h-[400px]` to `min-h-[400px] h-full` |
| `src/components/DashboardView.tsx` | 312 | Change `text-foreground` to `text-primary` |

All three are single-line CSS/text changes with no logic impact.

