

## Persist Active Ticker on Markets Page

**Problem:** The Markets page always resets to NVDA because the selected stock is stored only in component state. When the user refreshes the page or navigates away (e.g., to a stock detail page) and comes back, the selection is lost.

**Solution:** Save the selected ticker to the browser's local storage so it persists across refreshes and navigation. This has zero impact on load time -- local storage reads are instant and no extra network requests are made.

---

### Technical Details

**File: `src/components/DashboardView.tsx`**

1. Initialize `activeTicker` from local storage (falling back to `'NVDA'` for first-time visitors):
   ```ts
   const [activeTicker, setActiveTicker] = useState(
     () => localStorage.getItem('factrafi-active-ticker') || 'NVDA'
   );
   ```

2. In `handleStockSelect`, persist the selection alongside updating state:
   ```ts
   const handleStockSelect = (ticker: string) => {
     setActiveTicker(ticker);
     localStorage.setItem('factrafi-active-ticker', ticker);
     setIsSearchOpen(false);
     setHeroSearchQuery('');
   };
   ```

| File | Change |
|------|--------|
| `src/components/DashboardView.tsx` | Read/write `activeTicker` to `localStorage` in state init and `handleStockSelect` |

