

## Stretch Left Panel Pillar Cards to Match Right Panel Height

### Problem
The left panel (FactraFi Score + 4 pillar cards) is shorter than the right panel ("Why This Score?"). The pillar cards at the bottom need to stretch vertically so both panels have equal height.

### Changes — `src/components/StockDetailView.tsx`

**1. Make the left panel use `flex-1` on the pillar grid to fill remaining space**
- The left panel container (line 152) already uses `flex flex-col`. Add `flex-1` to the pillar cards grid container (line 190) so it stretches to fill remaining vertical space.
- Change the pillar cards from `grid` to `flex` or keep grid but add `flex-1` and make each card use `flex-1` to stretch vertically.

**2. Ensure both panels stretch equally**
- Add `items-stretch` to the parent flex row (line 150) — this is the default for flex but being explicit ensures both children match height.
- On the left panel div (line 152), ensure it has `flex-1` behavior within the row by keeping `lg:w-[42%]` but also ensuring it stretches to full height.

**3. Pillar card stretching**
- Change the pillar grid (line 190) to include `flex-1` so it grows to fill the remaining space in the left column.
- Each pillar card (line 192) gets `flex flex-col justify-between` so content distributes evenly within the stretched card.
- The grid itself needs `auto-rows-fr` or the cards need `h-full` to actually stretch within the grid.

### Summary of class changes
- Line 150 (`flex flex-col lg:flex-row gap-5`): No change needed, `align-items: stretch` is default.
- Line 190 (pillar grid): Add `flex-1` so it grows to fill leftover height in the flex column.
- Line 192 (each pillar card): Add `flex flex-col justify-between h-full` to stretch content.

