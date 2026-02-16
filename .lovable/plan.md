

# Fix: Debt/Equity Always Showing N/A

## Root Cause

In `supabase/functions/stock-data/index.ts` line 45, the code references a **wrong field name** from Alpha Vantage:

```
// Current (WRONG)
debt_to_equity: parseFloat(d.DebtToEquityRatio ?? "0") / 100 || null,
```

The correct Alpha Vantage OVERVIEW field name is `DebtEquityRatio`, not `DebtToEquityRatio`. Since the field doesn't exist, it always falls back to `"0"`, which becomes `0 / 100 = 0`, and `0 || null = null`.

Additionally, dividing by 100 is incorrect -- Alpha Vantage already returns the D/E ratio as a plain number (e.g., `"41.04"` means 0.41x), not as a percentage. The division by 100 was wrong.

## Fix

**One-line change** in `supabase/functions/stock-data/index.ts`, line 45:

```
// Fixed (CORRECT field name, no /100)
debt_to_equity: parseFloat(d.DebtEquityRatio) || null,
```

Also fix the corresponding raw value used in scoring (line 62):

```
// Current
_raw_debt_to_equity_ratio: parseFloat(d.DebtToEquityRatio ?? "0") / 100 || null,

// Fixed
_raw_debt_to_equity_ratio: parseFloat(d.DebtEquityRatio) || null,
```

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/stock-data/index.ts` | Line 45: Fix field name from `DebtToEquityRatio` to `DebtEquityRatio`, remove `/100`. Line 62: Same fix for `_raw_debt_to_equity_ratio`. |

No frontend changes needed -- all display components already handle `debt_to_equity` correctly via `.toFixed(2)`. The edge function just needs to be redeployed after the fix.

