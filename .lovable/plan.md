

## Problem Analysis

After examining the code, data, and logic, here are the specific mathematical errors:

### What each metric SHOULD mean

| Metric | Definition | Formula |
|--------|-----------|---------|
| **Total Equity** | Total portfolio value (cash + holdings at market price) | `cash_balance + Σ(shares × current_price)` |
| **Portfolio P&L** | Total gain/loss since inception | `Total Equity − $10,000` |
| **Buying Power** | Available cash for new trades | `cash_balance` |
| **Portfolio XIRR** | Annualized return rate | Newton-Raphson on (initial deposit → terminal value) |

### Bug 1: XIRR double-counts cash flows (CRITICAL)

The `usePortfolioXirr` hook treats every buy as a NEW deposit and every sell as a withdrawal. But this is a **closed system** — the user deposited $10k once and trades are internal movements of that same money.

**Current (wrong) model**: `[-$10k, -$6.5k buy, +$2.5k sell, +terminal]`
This tells the solver the user invested $16.5k total — completely wrong.

**Correct model**: Only two external flows exist:
- Flow 1: `−$10,000` on account creation date
- Flow 2: `+currentNetLiquidity` today

Buys and sells are internal rebalancing, NOT external deposits/withdrawals.

### Bug 2: Portfolio page still shows "Day's P&L" (inconsistent with Dashboard)

The Dashboard was changed to "Portfolio P&L" but the Portfolio page (`PortfolioView.tsx:172`) still shows "Day's P&L" using `startOfDayLiquidity`. The user explicitly asked to remove Day's P&L in favor of Portfolio P&L. Both pages should show the same metric.

### Bug 3: Portfolio page duplicates metrics

Portfolio page shows both "Day's P&L" AND "Total Return" — these are confusingly similar. Since Day's P&L should be removed, replace it with Portfolio P&L (same as Dashboard) for consistency.

---

### Changes

#### 1. Fix XIRR hook (`src/hooks/use-portfolio-xirr.ts`)

Remove all buy/sell transaction processing. The hook should only create two cash flows:
```
flows = [
  { amount: -10000, date: profile.created_at },
  { amount: +currentNetLiquidity, date: today }
]
```
Remove the Supabase query for transactions entirely — it's not needed.

#### 2. Fix Portfolio page metrics (`src/components/PortfolioView.tsx`)

- Replace "Day's P&L" (line 172) with "Portfolio P&L" using `computePortfolioPnl(netLiquidity)` — same logic as Dashboard
- Rename "Total Return" to "Total Return" and keep it (it's the same number, just rename the 2nd card to something else or merge them)
- Actually: replace the 4 KPI cards to match Dashboard exactly: **Net Liquidity**, **Portfolio P&L**, **Total Return** (same as P&L but in $), **Buying Power**. Since P&L and Total Return are identical, replace the Day's P&L card with XIRR instead.
- Remove `useStartOfDayLiquidity` import since it's no longer used anywhere.

Final Portfolio KPI layout:
1. **Net Liquidity** — `cashBalance + totalMarketValue`
2. **Portfolio P&L** — `netLiquidity - $10,000` (with % shown)
3. **Portfolio XIRR** — annualized return from the fixed hook
4. **Buying Power** — `cashBalance`

#### 3. Update regression tests (`src/test/portfolio-numbers.test.ts`)

Add new test cases:
- **XIRR for closed system**: 2-flow model only (deposit + terminal), verify annualized return matches simple compound growth formula
- **Verify XIRR ignores intermediate trades**: same result with or without buy/sell flows (since they shouldn't be included)
- **Cross-check**: for a 1-year period with no trades, XIRR ≈ simple return `(terminal / initial) - 1`
- **Dashboard-Portfolio consistency**: same inputs produce same P&L numbers

#### 4. Cleanup unused hook

If `useStartOfDayLiquidity` is no longer imported anywhere, leave the file but remove the import from `PortfolioView.tsx`.

---

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/use-portfolio-xirr.ts` | Remove transaction query, use 2-flow model |
| `src/components/PortfolioView.tsx` | Replace Day's P&L with XIRR, use `computePortfolioPnl`, remove `useStartOfDayLiquidity` |
| `src/test/portfolio-numbers.test.ts` | Add closed-system XIRR tests, cross-check tests |

