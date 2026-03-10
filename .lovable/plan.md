

## Improve V-Score History Chart Visual Quality

### Problems Identified
1. **Fundamentals line color** (`hsl(142, 71%, 45%)` green) is too similar to the Total bar color (`hsl(var(--primary))` — also green)
2. **Legend buttons are left-aligned** instead of centered under the chart
3. **Wasted left space** — chart has unnecessary padding/margins
4. **Overall polish** — needs better spacing, grid styling, and proportions

### Changes — `src/components/StockDetailView.tsx`

**1. Fix color clash — change bar color and Fundamentals color**
- Total bars: change from green-ish primary to a neutral slate/gray tone (`hsl(var(--muted-foreground) / 0.25)`) so bars act as a subtle backdrop
- Fundamentals line: change to a brighter, distinct green (`hsl(150, 80%, 55%)`) — clearly different from the muted bars

**2. Center-align the legend**
- Change `flex flex-wrap gap-2 mt-3` to `flex flex-wrap gap-2 mt-3 justify-center`

**3. Better chart proportions & space usage**
- Increase chart height from `h-56` to `h-64` for more breathing room
- Remove left padding waste: set `YAxis` width to 30 and add `margin={{ left: -10 }}` on the ComposedChart
- Reduce XAxis tick count with `interval="preserveStartEnd"` to avoid crowding on 60D/90D views

**4. Polish grid and tooltip**
- Use lighter, dotted grid lines with lower opacity
- Style tooltip with subtle backdrop blur
- Reduce bar opacity slightly and add a thin border stroke for definition

**5. Update legend color array to match new Fundamentals + Total colors**

### No other files change.

