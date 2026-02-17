

## Fix: Unify Day's P&L Calculation Across Screens

**Problem:** The Dashboard and Portfolio screens compute Day's P&L using two completely different formulas, resulting in mismatched numbers (-$2.76 vs $4.70 for the same account at the same time).

- **Dashboard** sums `(currentPrice - previousClose) * shares` across holdings only (ignores cash changes from today's trades).
- **Portfolio** computes `(cash + marketValue) - lastSnapshotValue`, which depends on when the last portfolio snapshot was taken.

**Solution:** Standardize both screens on a single, correct formula. The account-level approach (`netLiquidity - startOfDayLiquidity`) is the right one, as it captures the full picture including cash movements from trades. Both screens should use this same calculation.

---

### Technical Details

**1. Update DashboardView.tsx**

- Import `useStartOfDayLiquidity` hook (already used in PortfolioView).
- Replace the current `daysPnl` from `useHoldingsWithPrices` with the account-level formula:
  ```
  netLiquidity = cashBalance + totalMarketValue
  daysPnl = netLiquidity - startOfDayLiquidity
  ```
- Add a percentage display: `daysPnlPct = (daysPnl / startOfDayLiquidity) * 100`
- Update the Day's P&L tile to show the percentage alongside the dollar value, matching the Portfolio screen format.

**2. Update useHoldingsWithPrices hook (cleanup)**

- Remove the `daysPnl` field from the hook's return value since it should no longer be used for the KPI display. This prevents future confusion about which P&L number to use.
- Note: The per-holding `totalReturn` calculation in the Holdings table rows is separate and correct (it shows per-stock total return, not day's P&L).

**3. Verify startOfDayLiquidity baseline**

- The `useStartOfDayLiquidity` hook fetches the most recent `portfolio_history.total_net_liquidity` row. If no snapshot exists yet (new account), it defaults to $10,000 (initial capital). This is correct behavior.
- The `snapshot-portfolio` edge function runs daily to capture end-of-day values, which then become the next day's baseline.

### Files Changed

| File | Change |
|------|--------|
| `src/components/DashboardView.tsx` | Import `useStartOfDayLiquidity`, compute Day's P&L as `netLiquidity - startOfDayLiquidity` |
| `src/hooks/use-holdings-prices.ts` | Remove `daysPnl` from return value |
| `src/components/PortfolioView.tsx` | No changes needed (already correct) |

