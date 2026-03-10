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
    expect(rate!).toBeCloseTo(0, 2);
  });

  it("returns ≈ 100% when portfolio doubles in 1 year", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 20000, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(1.0, 1);
  });

  it("returns ≈ -50% when portfolio halves in 1 year", () => {
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 5000, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(-0.5, 1);
  });

  // Closed-system model: intermediate trades should NOT be included
  // The 2-flow model (deposit + terminal) is the correct approach
  it("2-flow model matches simple return for 1 year", () => {
    const initial = 10000;
    const terminal = 11500; // 15% gain
    const flows: CashFlow[] = [
      { amount: -initial, date: new Date("2025-01-01") },
      { amount: terminal, date: new Date("2026-01-01") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    // For exactly 1 year, XIRR should equal simple return
    expect(rate!).toBeCloseTo((terminal / initial) - 1, 2);
  });

  it("annualizes correctly for 6-month period", () => {
    // $10k → $11k in 6 months = 10% in half year ≈ 21% annualized
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 11000, date: new Date("2025-07-02") }, // ~6 months
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    // Annualized should be > 10% (simple) due to compounding
    expect(rate!).toBeGreaterThan(0.10);
    expect(rate!).toBeLessThan(0.25);
  });

  it("handles very short period (1 week)", () => {
    // $10k → $10.1k in 1 week = 1% weekly ≈ huge annualized
    const flows: CashFlow[] = [
      { amount: -10000, date: new Date("2025-01-01") },
      { amount: 10100, date: new Date("2025-01-08") },
    ];
    const rate = calcXirr(flows);
    expect(rate).not.toBeNull();
    // Annualized 1% weekly is very large
    expect(rate!).toBeGreaterThan(0.5);
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
    const { pnl, pct } = computePortfolioPnl(11000);
    expect(pnl).toBe(1000);
    expect(pct).toBeCloseTo(10, 2);
  });

  it("returns correct negative P&L", () => {
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

/* ─── Closed-system XIRR vs P&L cross-check ──────────── */

describe("XIRR and P&L cross-check", () => {
  it("XIRR positive when P&L positive (1 year)", () => {
    const equity = 12000;
    const { pnl } = computePortfolioPnl(equity);
    const xirr = calcXirr([
      { amount: -INITIAL_CAPITAL, date: new Date("2025-01-01") },
      { amount: equity, date: new Date("2026-01-01") },
    ]);
    expect(pnl).toBeGreaterThan(0);
    expect(xirr).not.toBeNull();
    expect(xirr!).toBeGreaterThan(0);
  });

  it("XIRR negative when P&L negative (1 year)", () => {
    const equity = 8000;
    const { pnl } = computePortfolioPnl(equity);
    const xirr = calcXirr([
      { amount: -INITIAL_CAPITAL, date: new Date("2025-01-01") },
      { amount: equity, date: new Date("2026-01-01") },
    ]);
    expect(pnl).toBeLessThan(0);
    expect(xirr).not.toBeNull();
    expect(xirr!).toBeLessThan(0);
  });

  it("XIRR ≈ 0 when P&L = 0 (1 year)", () => {
    const equity = INITIAL_CAPITAL;
    const { pnl } = computePortfolioPnl(equity);
    const xirr = calcXirr([
      { amount: -INITIAL_CAPITAL, date: new Date("2025-01-01") },
      { amount: equity, date: new Date("2026-01-01") },
    ]);
    expect(pnl).toBe(0);
    expect(xirr).not.toBeNull();
    expect(xirr!).toBeCloseTo(0, 2);
  });

  it("for 1 year, XIRR equals simple return percentage / 100", () => {
    const equity = 13500;
    const { pct } = computePortfolioPnl(equity);
    const xirr = calcXirr([
      { amount: -INITIAL_CAPITAL, date: new Date("2025-01-01") },
      { amount: equity, date: new Date("2026-01-01") },
    ]);
    expect(xirr).not.toBeNull();
    // For exactly 1 year, XIRR should match simple return
    expect(xirr! * 100).toBeCloseTo(pct, 1);
  });
});
