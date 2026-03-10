

## Plan: Restore Portfolio XIRR with Real Logic + Change Day's P&L to Portfolio P&L + Regression Tests

### Problem Summary

1. **Portfolio XIRR** was replaced with a "Positions" count — the user wants real XIRR calculated from transaction data
2. **Day's P&L** on the Dashboard should be **Portfolio P&L** (total return vs. $10,000 initial capital), not intraday P&L
3. Need regression tests to verify all numbers are consistent

---

### Changes

#### 1. Create XIRR utility function (`src/lib/xirr.ts`)

Implement a Newton-Raphson XIRR calculator:
- Takes an array of `{ amount: number, date: Date }` cash flows
- Returns annualized internal rate of return
- Cash flows: initial -$10,000 deposit, each BUY as negative, each SELL as positive, current portfolio value as final positive flow (today's date)

#### 2. Create `usePortfolioXirr` hook (`src/hooks/use-portfolio-xirr.ts`)

- Fetch all transactions for the user (not limited to 10)
- Build cash flow array:
  - `{ amount: -10000, date: account_created_at }` (initial deposit)
  - Each BUY: `{ amount: -(shares * price), date: created_at }`
  - Each SELL: `{ amount: +(shares * price), date: created_at }`
  - Terminal value: `{ amount: +currentNetLiquidity, date: today }`
- Call XIRR function, return the annualized % return

#### 3. Update Dashboard metrics strip (`DashboardView.tsx`)

**Replace "Positions" (4th tile)** with "Portfolio XIRR":
- Show the XIRR percentage (e.g. "+12.4%")
- Subtitle: "Annualized return"
- Color: green if positive, red if negative
- Keep the click-to-portfolio navigation

**Replace "Day's P&L" (2nd tile)** with "Portfolio P&L":
- Formula: `totalEquity - INITIAL_CAPITAL` (where INITIAL_CAPITAL = 10,000)
- Percentage: `((totalEquity - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100`
- Label: "Portfolio P&L"
- Subtitle: "vs. $10,000 initial"
- Remove the `useStartOfDayLiquidity` dependency from DashboardView since it's no longer needed there

#### 4. Regression tests (`src/test/portfolio-numbers.test.ts`)

Pure unit tests (no React rendering needed):

- **XIRR calculation tests**:
  - Single deposit, no trades, portfolio unchanged → XIRR ≈ 0%
  - Single deposit, portfolio doubled after 1 year → XIRR ≈ 100%
  - Multiple cash flows with known result
  - Edge case: all on same day → returns null/0

- **Portfolio P&L tests**:
  - Cash $10,000 + no holdings → P&L = $0, pct = 0%
  - Cash $5,000 + holdings worth $6,000 → P&L = +$1,000, pct = +10%
  - Cash $3,000 + holdings worth $5,000 → P&L = -$2,000, pct = -20%

- **Total Return consistency** (Portfolio view):
  - Verify `netLiquidity - INITIAL_CAPITAL` matches expected
  - Verify percentage = `totalReturn / INITIAL_CAPITAL * 100`

---

### Files Modified
| File | Change |
|------|--------|
| `src/lib/xirr.ts` | **New** — XIRR Newton-Raphson solver |
| `src/hooks/use-portfolio-xirr.ts` | **New** — hook fetching transactions + computing XIRR |
| `src/components/DashboardView.tsx` | Replace "Day's P&L" → "Portfolio P&L", replace "Positions" → "Portfolio XIRR" |
| `src/test/portfolio-numbers.test.ts` | **New** — regression tests for XIRR, P&L, and total return calculations |

