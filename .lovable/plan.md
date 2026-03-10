

## Layout Redesign: 3-Column MarkerSection with About & Summary

### Target Layout

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ < [Logo] NVDA  Buy NVDA  Sell NVDA  │  Summary: ...        │  Markers  │
│         $182.65  +2.68%             │                      │  Signal.. │
│         About: NVIDIA designs GPUs  │                      │  Volume.. │
│         used in gaming, AI...       │                      │  Beta..   │
└──────────────────────────────────────────────────────────────────────────┘
```

Three columns: Left (ticker/price/about) | Middle (AI summary) | Right (markers, pushed to far right).

### Changes

**1. `supabase/functions/stock-data/index.ts`** — Add `description` field
- In `fetchAlphaOverview`, capture `d.Description` from the Alpha Vantage OVERVIEW response (this field already exists in the API, just not being returned).
- Add `description: d.Description || null` to the return object.
- Include `description: alpha?.description || null` in the final response payload.

**2. `src/lib/api.ts`** — Add `description` to `StockData` type
- Add `description: string | null` to the `StockData` interface.

**3. `src/components/MarkerSection.tsx`** — Restructure to 3-column layout
- **Left column** (~40%): Back button, logo, ticker + Buy/Sell buttons, price + change badge, and new "About" section showing `stock.description` (company overview from Alpha Vantage). Falls back to `stock.name — sector / industry` if no description.
- **Middle column** (~30%): The AI-generated Summary (moved from left side). Shows the `useStockSummary` content with the "Summary:" label.
- **Right column** (fixed width, pushed right with `ml-auto`): Markers dropdown + metrics grid. Remove `max-w-[380px]`, use a slightly wider fixed width and `ml-auto` to push it to the far right edge of the container.
- Truncate the "About" text to ~3 lines with line-clamp to keep the section compact.

