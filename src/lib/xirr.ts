/**
 * XIRR — Extended Internal Rate of Return (Newton-Raphson)
 *
 * cashFlows: array of { amount, date }
 *   Negative = money going OUT (deposits / buys)
 *   Positive = money coming IN  (withdrawals / sells / terminal value)
 */

export interface CashFlow {
  amount: number;
  date: Date;
}

const DAYS_PER_YEAR = 365.25;
const MAX_ITER = 100;
const TOLERANCE = 1e-7;

/** Net-present-value at rate r */
function npv(flows: CashFlow[], rate: number, t0: number): number {
  let total = 0;
  for (const f of flows) {
    const years = (f.date.getTime() - t0) / (DAYS_PER_YEAR * 86400000);
    total += f.amount / Math.pow(1 + rate, years);
  }
  return total;
}

/** Derivative of NPV with respect to rate */
function dnpv(flows: CashFlow[], rate: number, t0: number): number {
  let total = 0;
  for (const f of flows) {
    const years = (f.date.getTime() - t0) / (DAYS_PER_YEAR * 86400000);
    total -= years * f.amount / Math.pow(1 + rate, years + 1);
  }
  return total;
}

/**
 * Calculate XIRR using Newton-Raphson.
 * Returns annualized rate as a decimal (e.g. 0.12 = 12%) or null if it can't converge.
 */
export function calcXirr(cashFlows: CashFlow[]): number | null {
  if (cashFlows.length < 2) return null;

  // All on the same day → can't compute
  const t0 = cashFlows[0].date.getTime();
  const allSameDay = cashFlows.every(
    (f) => Math.abs(f.date.getTime() - t0) < 86400000
  );
  if (allSameDay) return null;

  // Need both positive and negative flows
  const hasNeg = cashFlows.some((f) => f.amount < 0);
  const hasPos = cashFlows.some((f) => f.amount > 0);
  if (!hasNeg || !hasPos) return null;

  let rate = 0.1; // initial guess 10%

  for (let i = 0; i < MAX_ITER; i++) {
    const v = npv(cashFlows, rate, t0);
    const dv = dnpv(cashFlows, rate, t0);

    if (Math.abs(dv) < 1e-12) break;

    const newRate = rate - v / dv;

    // Clamp to prevent divergence
    if (newRate < -0.99) {
      rate = (rate + -0.99) / 2;
      continue;
    }

    if (Math.abs(newRate - rate) < TOLERANCE) return newRate;
    rate = newRate;
  }

  // Fallback: check if final rate gives near-zero NPV
  if (Math.abs(npv(cashFlows, rate, t0)) < 0.01) return rate;
  return null;
}

/**
 * Convenience: compute Portfolio P&L
 */
export const INITIAL_CAPITAL = 10_000;

export function computePortfolioPnl(totalEquity: number) {
  const pnl = totalEquity - INITIAL_CAPITAL;
  const pct = (pnl / INITIAL_CAPITAL) * 100;
  return { pnl, pct };
}
