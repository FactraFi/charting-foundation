

## Convert V-Score History to Combo Bar+Line Chart

### Changes in `src/components/StockDetailView.tsx`

**1. Import updates (line 6-8)**
- Add `ComposedChart`, `Bar`, `ReferenceLine` from recharts (replace `LineChart` import)

**2. Chart conversion (lines 316-333)**
- Replace `LineChart` with `ComposedChart`
- Render `Total` as `<Bar>` with semi-transparent primary color fill and rounded top corners
- Keep Fundamentals, Momentum, Risk, Sentiment as `<Line>` components
- Change all `type="monotone"` to `type="linear"` for sharp lines
- Add a `<ReferenceLine>` at the last data point's x-value (today) — a vertical dashed line labeled "Today"

**3. Today indicator logic**
- Derive `todayLabel` from the last item in `scoreHistory` array (`scoreHistory[scoreHistory.length - 1]?.name`)
- Render `<ReferenceLine x={todayLabel} stroke="white" strokeDasharray="4 4" label="Today" />`

### No other files need changes.

