import { describe, it, expect } from "vitest";
import { calcXirr, computePortfolioPnl, INITIAL_CAPITAL, type CashFlow } from "@/lib/xirr";

/* ─── XIRR calculation tests ─────────────────────────── */

describe("calcXirr", () => {
  it("returns null for fewer than 2 cash flows", () => {
    expect(calcXirr([{ amount: -10000, date: new Date("2025-01-01") }])).toBeNull();
    expect(calcXirr([])).toBeNull();
  });

  it("returns null when all flows are on the same day", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 10000, date: new Date("2025-01-01") },
    ];
    expect(calcXirr(flows)).toBeNull();
  });

  it("returns null when all flows are negative (no positive)", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: -5000, date: new Date("2025-07-01") },
    ];
    expect(calcXirr(flows)).toBeNull();
  });

  it("returns ≈ 0% when portfolio is unchanged after 1 year", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 10000, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(0, 2); // ~0%
  });

  it("returns ≈ 100% when portfolio doubles in 1 year", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 20000, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(1.0, 1); // ~100%
  });

  it("returns ≈ -50% when portfolio halves in 1 year", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 5000, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(-0.5, 1); // ~-50%
  });

  it("handles multiple cash flows correctly", () => {
    // Deposit $10k, buy $5k stock after 6 months, end with $16k after 1 year
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: -5000, date: new Date("2025-07-01") },
      { amount: 16000, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    // With a $15k total investment returning $16k → modest positive return
    expect(rate!).toBeGreaterThan(0);
    expect(rate!).toBeLessThan(0.5);
  });
});

/* ─── Portfolio P&L tests ─────────────────────────────── */

describe("computePortfolioPnl", () => {
  it("returns $0 P&L and 0% when equity equals initial capital", () => {
    const { pnl, pct } = computePortfolioPnl(INITIAL_CAPITAL);
    expect(pnl).toBe(0);
    expect(pct).toBe(0);
  });

  it("returns correct positive P&L", () => {
    // Cash $5000 + holdings $6000 = $11000 equity
    const { pnl, pct } = computePortfolioPnl(11000);
    expect(pnl).toBe(1000);
    expect(pct).toBeCloseTo(10, 2);
  });

  it("returns correct negative P&L", () => {
    // Cash $3000 + holdings $5000 = $8000 equity
    const { pnl, pct } = computePortfolioPnl(8000);
    expect(pnl).toBe(-2000);
    expect(pct).toBeCloseTo(-20, 2);
  });

  it("handles large gains", () => {
    const { pnl, pct } = computePortfolioPnl(25000);
    expect(pnl).toBe(15000);
    expect(pct).toBeCloseTo(150, 2);
  });

  it("handles near-zero equity", () => {
    const { pnl, pct } = computePortfolioPnl(100);
    expect(pnl).toBe(-9900);
    expect(pct).toBeCloseTo(-99, 2);
  });
});

/* ─── Total Return consistency ────────────────────────── */

describe("Total Return consistency", () => {
  it("netLiquidity - INITIAL_CAPITAL matches pnl", () => {
    const netLiquidity = 12345.67;
    const expectedPnl = netLiquidity - INITIAL_CAPITAL;
    const expectedPct = (expectedPnl / INITIAL_CAPITAL) * 100;

    const { pnl, pct } = computePortfolioPnl(netLiquidity);
    expect(pnl).toBeCloseTo(expectedPnl, 2);
    expect(pct).toBeCloseTo(expectedPct, 2);
  });

  it("percentage = totalReturn / INITIAL_CAPITAL * 100", () => {
    const equity = 15432.10;
    const { pnl, pct } = computePortfolioPnl(equity);
    expect(pct).toBeCloseTo((pnl / INITIAL_CAPITAL) * 100, 2);
  });
});
