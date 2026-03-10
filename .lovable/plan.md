

## Visual Enhancements: Move Trade Buttons Into Header & Resize Markers

### Changes

**1. `src/components/MarkerSection.tsx`**
- **Remove** the Watchlist button (lines 88-90) and the Refresh button (lines 91-93).
- **Accept new props**: `onTrade` callback and `stock` data (already has stock).
- **Add Buy/Sell buttons** in place of the removed Watchlist/Refresh buttons, inline with the ticker name. Style: green outlined "Buy TICKER" and red outlined "Sell TICKER" buttons, matching the screenshot reference.
- **Reduce right-side markers width**: Change the right panel from `flex-1` (line 115) to a fixed/max-width (e.g., `max-w-[380px] w-full`) so the left side gets more space.
- Update the `MarkerSectionProps` interface to include optional `onTrade`.

**2. `src/components/StockDetailView.tsx`**
- **Remove** the standalone Buy/Sell button block (lines 146-160) since buttons will now live inside MarkerSection.
- **Pass `onTrade`** prop down to `<MarkerSection>`.

### Layout Result
- Left side (ticker, price, summary, trade buttons) expands to take more horizontal space.
- Right side (markers grid) becomes narrower/fixed-width.
- Buy/Sell buttons sit next to the ticker symbol where Watchlist used to be.

