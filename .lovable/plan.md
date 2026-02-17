

## Fix: Total Equity Tile on Markets Dashboard

### The Problem

The "Total Equity" tile currently displays only the cash balance (`$8,615.82` in the screenshot) and labels it "Cash balance". Total equity should be **cash + market value of all stock holdings**, and the subtitle should read "Net Worth".

### The Fix

**File: `src/components/DashboardView.tsx`**

1. Import `useHoldingsWithPrices` from `@/hooks/use-holdings-prices`
2. Call `useHoldingsWithPrices(holdings ?? [])` to get `totalMarketValue` and `daysPnl`
3. Compute `totalEquity = cashBalance + totalMarketValue`
4. Update the Total Equity tile value from `cashBalance` to `totalEquity`
5. Change the subtitle text from "Cash balance" to "Net Worth"
6. Also update the Day's P&L tile to show the actual `daysPnl` value from the hook (instead of hardcoded "--")

### What Changes

| Element | Before | After |
|---------|--------|-------|
| Total Equity value | Cash only | Cash + holdings market value |
| Total Equity subtitle | "Cash balance" | "Net Worth" |
| Day's P&L value | Hardcoded "--" | Actual day's P&L from holdings |

### No New Files or Endpoints

This reuses the existing `useHoldingsWithPrices` hook which already computes `totalMarketValue` and `daysPnl`. The hook uses the batch price data via `fetchStockData` for each unique ticker in holdings (typically a small number).

