

## Fix 4 Issues: Unused Imports, Missing Trade Buttons, Order Side Badge

### Issue 1: Add Buy/Sell Buttons to StockDetailView

**Problem**: The `onTrade` prop is accepted but never destructured or used -- users cannot trade from the stock detail page.

**Fix in `src/components/StockDetailView.tsx`**:
- Line 122: Destructure `onTrade` from props (currently only `stock` and `onBack` are destructured)
- Add two trade buttons (Buy / Sell) next to the Watchlist and Refresh buttons in the MarkerSection area. Since MarkerSection doesn't accept an `onTrade` prop, the buttons will be added directly in StockDetailView, right below the MarkerSection component (line 145).

The buttons will be styled consistently with the app's design system using the primary color for Buy and destructive for Sell.

### Issue 2: Remove Unused Imports in ModernNavbar

**Problem**: `Settings`, `User`, `CreditCard` are imported but never used.

**Fix in `src/components/ModernNavbar.tsx`**:
- Line 5: Remove `Settings`, `User`, `CreditCard` from the lucide-react import statement.

### Issue 3: Remove Unused Import in ScreenerView

**Problem**: `Star` is imported but never used.

**Fix in `src/components/ScreenerView.tsx`**:
- Line 2: Remove `Star` from the lucide-react import statement.

### Issue 4: Fix Order Side Badge Case Mismatch in PortfolioView

**Problem**: `order.side === "buy"` fails because the database stores sides as uppercase ("BUY"/"SELL").

**Fix in `src/components/PortfolioView.tsx`**:
- Line 406: Change `order.side === "buy"` to `order.side.toUpperCase() === "BUY"` so the badge correctly shows green for buy orders and red for sell orders.

---

### Technical Summary

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/StockDetailView.tsx` | 122 | Destructure `onTrade` from props |
| `src/components/StockDetailView.tsx` | ~145 | Add Buy/Sell buttons below MarkerSection |
| `src/components/ModernNavbar.tsx` | 5 | Remove `Settings`, `User`, `CreditCard` imports |
| `src/components/ScreenerView.tsx` | 2 | Remove `Star` import |
| `src/components/PortfolioView.tsx` | 406 | Case-insensitive side comparison |

