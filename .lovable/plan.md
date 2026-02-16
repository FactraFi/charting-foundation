

# Rebalance Modal: Interactive Pie Chart

## Overview

Replace the slider-based allocation UI in the Rebalance Portfolio modal with an interactive pie chart. Users will click on a pie slice to select it, then use a single slider (or +/- buttons) to adjust that slice's allocation. The pie chart visually updates in real-time, and the total must still equal 100%.

## Design

```text
+--------------------------------------------+
|  Rebalance Portfolio                    X   |
|  Adjust target allocations. Total = 100%.   |
|                                             |
|         [Interactive Pie Chart]             |
|          Click a slice to select            |
|                                             |
|  Legend (clickable):                        |
|   * NVDA  32%    * AMD   22%               |
|   * MSFT  22%    * AAPL  15%               |
|   * PLTR   9%                              |
|                                             |
|  Selected: NVDA                             |
|  [---- slider ----]  32%                    |
|                                             |
|  Total: 100%                                |
|  [Cancel]            [Apply Rebalance]      |
+--------------------------------------------+
```

- The pie chart uses the same `PIE_COLORS` already defined in `PortfolioView.tsx`
- Clicking a slice or legend item selects that stock
- A single slider below adjusts the selected stock's allocation
- When adjusting one slice, the others proportionally redistribute to keep total at 100%
- The "Total: 100%" indicator and Apply button use the same validation logic as today

## Technical Changes

### File: `src/components/PortfolioView.tsx`

**Modify the `RebalanceModal` component (lines ~97-140):**

1. Add `selectedIndex` state (default 0) to track which slice is selected
2. Replace the list of 5 sliders with:
   - A Recharts `PieChart` with `Pie` using `onClick` on each `Cell` to set `selectedIndex`
   - A color-coded legend row (clickable) showing ticker + percentage
   - A single `Slider` for the selected stock's allocation
3. Update the `updateAlloc` function: when the selected slice changes by delta, distribute the inverse delta proportionally across the other slices (clamped to 0-100), ensuring the total stays at 100%
4. Keep the existing Cancel / Apply Rebalance buttons and total validation

**No new files or dependencies needed** -- Recharts `PieChart`, `Pie`, `Cell`, `ResponsiveContainer` are already imported in this file, and `Slider` is already imported from the UI library.

### Proportional Redistribution Logic

When the user drags the slider for the selected stock from `oldVal` to `newVal`:
- `delta = newVal - oldVal`
- The remaining stocks share `-delta` proportionally based on their current values
- Each is clamped to `[0, 100]`
- Final adjustment applied to the largest remaining stock to guarantee sum = 100

