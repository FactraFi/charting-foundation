

## Bug Fix Plan — 12 Bugs

### Bug 1: PillarCard ref warning
**File**: `StockDetailView.tsx:102-121`
Wrap `PillarCard` with `React.forwardRef`. Forward the ref to the outer `<div>`.

### Bug 2: Inverted risk labels
**Files**: `StockDetailView.tsx:69`, `DashboardView.tsx:160`
Both `getPillarLabel` functions have inverted risk logic. A high risk **score** = low risk (good). Fix: `score >= 70 ? 'Low' : score >= 40 ? 'Moderate' : 'High'`. Also align `deriveMetricLabel` (line 83) to use the same thresholds: `stock.risk >= 70 ? "LOW RISK" : stock.risk >= 40 ? "MODERATE" : "HIGH RISK"`. Same fix in `DashboardView.tsx:154` for `getPillarColor`.

### Bug 3: Wire ⌘K shortcut
**File**: `ModernNavbar.tsx`
Add a `useEffect` with a `keydown` listener for `(e.metaKey || e.ctrlKey) && e.key === 'k'`. On match, `e.preventDefault()` and focus the search input via a ref. Add an `inputRef` to the search `<input>`.

### Bug 4: Remove misleading notifications
**File**: `ModernNavbar.tsx:21-24`
Remove hardcoded `NOTIFICATIONS` array. Show "No notifications" empty state instead. Remove the pulsing dot indicator.

### Bug 6: AI chat auth
**File**: `AIView.tsx:19-26`
Import `supabase` client. Before the fetch call, get the session token via `supabase.auth.getSession()`. Use `Bearer ${session.access_token}` instead of the publishable key.

### Bug 7: Simplify screener handleSelectStock
**File**: `ScreenerView.tsx:211-214`
Replace the massive object construction with just `navigate(`/stock/${ticker}`)` — but since `onSelectStock` already does that in the parent, simplify to `onSelectStock({ ticker } as StockData)` or change the callback signature to accept just a ticker string. Cleanest: just pass ticker directly since the parent only uses `stock.ticker`.

### Bug 8: Screener P/E shows N/A
**File**: `ScreenerView.tsx`
The `stock_scores` table doesn't have `pe_ratio`, and the batch price endpoint may not return it. Since this data isn't available in any current data source, replace the "P/E Ratio" label with "Style" (available from `stock_scores.style`) or remove the P/E field entirely. Alternative: add `pe_ratio` to `ScreenerStock` interface and populate from `BatchPriceData` if the price endpoint returns it.

### Bug 9: startOfDayLiquidity default
**File**: `PortfolioView.tsx:119`
Change destructure from `= INITIAL_CAPITAL` to `= null` and guard the P&L calculation. Show "--" when `startOfDayLiquidity` is null/loading. The hook already returns `INITIAL_CAPITAL` when no history exists, so the default should be `undefined` to distinguish "loading" from "no data".

### Bug 12: Auth state variable naming
**File**: `AuthScreen.tsx`
Rename `resetSent` to `confirmationSent` (and `setResetSent` to `setConfirmationSent`) to accurately describe its dual purpose for both password reset and signup confirmation flows.

### Bug 13: TradingView cleanup
**Files**: `StockDetailView.tsx:26-55`, `DashboardView.tsx:29-59`
Store the widget instance in a ref. In the `useEffect` cleanup, call `widget.remove()` (TradingView's cleanup method) before setting `innerHTML = ""`.

### Bug 14: Portfolio XIRR placeholder
**File**: `DashboardView.tsx:222-226`
This requires computing XIRR from transactions — a non-trivial calculation. For now, hide the misleading "Portfolio XIRR" label. Replace with "Positions" count showing `holdings.length` active positions, which is real data.

### Bug 15: SSE variable reassignment
**File**: `AIView.tsx:66-68`
Change `for (let raw of ...)` to use a separate processed variable: `const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;` and use `line` for subsequent checks.

