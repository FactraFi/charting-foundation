

## Unify Score & Why This Score into One Card

### Problem
The left panel (score + pillars) has no background card wrapper, while the right panel has `bg-background border border-border rounded-xl p-4`. They look like separate sections instead of one cohesive block.

### Change — `src/components/StockDetailView.tsx`

**Wrap the entire `flex-row` container (line 150) in a single card div** with the same styling as the right panel (`bg-background border border-border rounded-xl p-5 relative overflow-hidden group`), including the hover gradient overlay.

Then **remove** the card styling from the right panel (line 211) — strip `bg-background border border-border rounded-xl p-4 relative overflow-hidden group` and the gradient overlay div (line 212), since the parent now provides it.

Also remove the `border-2 border-border` and `bg-background rounded-xl` from the score box (line 155) since it's now inside the shared card — keep hover effects but remove the redundant border/background.

### Result
One unified card containing both the score breakdown on the left and the analysis on the right, matching the screenshot reference.

