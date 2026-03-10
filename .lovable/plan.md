

## Fix Score Breakdown Layout & Restore Missing Sections

### Problems Identified
1. **Pillar cards** are in a 2x2 grid — need to be in a **single row of 4** as shown in the reference diagram
2. **Score box is oversized** — the `text-6xl` score and `max-w-sm` box take too much vertical space
3. **Missing sections below** — V-Score History chart, TradingView price chart, and metric strip cards were removed during prior edits and need to be restored

### Changes — `src/components/StockDetailView.tsx`

**1. Shrink the FactraFi Score box**
- Reduce score font from `text-6xl` to `text-5xl`
- Reduce box padding from `p-6` to `p-4`
- Remove `max-w-sm` constraint, let the box fill its container width
- Tighten vertical spacing

**2. Pillar cards: 4 columns in one row**
- Change grid from `grid-cols-2` to `grid-cols-4` on desktop
- Reduce pillar card padding from `p-4` to `p-3`
- Reduce score font from `text-3xl` to `text-2xl`
- Keep 2-col on mobile

**3. Adjust connector lines**
- Update the horizontal/vertical connector percentages to distribute evenly across 4 columns in a single row

**4. Restore missing sections after the score panel**
- **V-Score History** — bar chart (Recharts) showing pillar trends over 20 days (using existing simulated `vScoreHistory` data)
- **TradingView Price Chart** — the `TradingViewWidget` component already exists in the file, just needs to be rendered in a section
- **Metrics Strip** — row of 6 metric cards (Performance, Valuation, Growth, Profitability, Technicals, Risk) using the existing `deriveMetricLabel` function and `metricsStrip` data

### Layout Result
```text
┌─────────────────────────────────────────────────────────────────┐
│  MarkerSection (3-column header)                                │
├────────────────────────────┬────────────────────────────────────┤
│  FactraFi Score (compact)  │  Why This Score? (AI Enhanced)     │
│       66 /100              │  Summary + 4 pillar analysis cards │
│  ──connector lines──       │                                    │
│  FUND  RISK  SENT  MOM    │                                    │
│  (all 4 in one row)       │                                    │
├────────────────────────────┴────────────────────────────────────┤
│  V-Score History (bar chart)                                    │
├─────────────────────────────────────────────────────────────────┤
│  Price Chart (TradingView)                                      │
├─────────────────────────────────────────────────────────────────┤
│  Metric Cards Strip (6 cards in a row)                          │
└─────────────────────────────────────────────────────────────────┘
```

