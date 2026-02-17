

## Fix: Day's P&L Percentage Rounding to 0.0%

**Problem:** The Day's P&L shows `-0.0%` because the actual percentage (`-0.047%`) rounds to zero when displayed with only 1 decimal place (`toFixed(1)`). On a ~$10,000 account, small dollar changes produce very small percentages.

**Solution:** Use 2 decimal places (`toFixed(2)`) for the P&L percentage on both screens, so `-0.047%` displays as `-0.05%` instead of `-0.0%`.

---

### Technical Details

| File | Change |
|------|--------|
| `src/components/PortfolioView.tsx` (line 173) | Change `daysPnlPct.toFixed(1)` to `daysPnlPct.toFixed(2)` |
| `src/components/DashboardView.tsx` (line 204) | Already uses `toFixed(2)` -- no change needed |

Single-line fix in PortfolioView only.

