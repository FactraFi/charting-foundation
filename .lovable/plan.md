

# Fix: AI Summary Not Showing on Dashboard

## Root Cause

The old text (`"NVIDIA Corporation — TECHNOLOGY / SEMICONDUCTORS. Signal: Hold."`) exists in **two places**:

1. `src/components/MarkerSection.tsx` (line 102-108) -- already updated with AI summary (works correctly)
2. `src/components/DashboardView.tsx` (line 309-312) -- **still has the old hardcoded text**

Since you are currently on the "/" route (Dashboard), you are seeing the DashboardView version, which was never updated.

## Solution

Update `src/components/DashboardView.tsx` to use the same `useStockSummary` hook:

1. Import `useStockSummary` from `@/hooks/use-stock-summary`
2. Call `useStockSummary(activeStock)` in the component
3. Replace lines 309-312 (the old description paragraph) with the same summary pattern used in MarkerSection:
   - Show "Summary:" label (bold, underlined)
   - Show "Generating summary..." while loading
   - Show AI-generated summary text when ready
   - Fall back to old text only if the summary call fails

## Technical Details

### File to modify

| File | Change |
|------|--------|
| `src/components/DashboardView.tsx` | Add `useStockSummary` import and hook call; replace lines 309-312 with AI summary UI |

### Code change (DashboardView.tsx)

- Add import: `import { useStockSummary } from "@/hooks/use-stock-summary";`
- Inside the component, add: `const { data: summary, isLoading: summaryLoading } = useStockSummary(activeStock);`
- Replace the description paragraph with the summary pattern matching MarkerSection

This is a small, focused fix -- the edge function and hook already exist and work correctly.
