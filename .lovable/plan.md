

# Restore Missing Portfolio Components (Empty State)

## Problem

The portfolio page was simplified during the auth migration. Several sections visible in the original design are now missing:

- **KPI cards**: Should show Net Liquidity, Day's P&L, Total Return, and Buying Power (currently shows Positions, Mode, Currency, Buying Power)
- **Performance chart**: Area chart with time period tabs (1W, 1M, 3M, YTD, 1Y, ALL) -- entirely missing
- **Portfolio Health card**: Shows Beta, Sharpe Ratio, and a health score circle -- missing
- **Recent Activity sidebar**: Shows recent trades (Buy/Sell/Dividend) -- missing
- **Holdings table columns**: Missing Mkt Value and Total Return columns; has Buy/Sell buttons instead of an action menu

## Plan

All changes are in a single file: `src/components/PortfolioView.tsx`

### 1. KPI Row (empty values)

Replace the current 4 KPI cards with:

| Card | Empty Value |
|------|-------------|
| Net Liquidity | Shows cash_balance (real from profile) |
| Day's P&L | $0.00 / 0% when no holdings |
| Total Return | $0.00 / 0% when no holdings |
| Buying Power | cash_balance (real from profile) |

When holdings exist, Net Liquidity and returns will be computed from live prices.

### 2. Performance Chart Section

Add a card with:
- Title "Performance" with a sparkle/activity icon
- Time period toggle buttons: 1W, 1M, 3M, YTD, 1Y, ALL
- Empty state message: "No performance history yet" when no holdings/trades exist
- When holdings exist, show an empty chart area (no mock data)

### 3. Allocation + Portfolio Health (Right Column)

Restore the two-card right column beside the performance chart:
- **Allocation**: Donut chart showing sector breakdown (computed from holdings sectors when available, empty state otherwise)
- **Portfolio Health**: Shows portfolio Beta, Sharpe Ratio, and a circular score indicator -- all showing "--" or "N/A" when empty

### 4. Holdings Table

Update columns to match the original design:
- Asset, Qty, Avg Cost, Price, Mkt Value, Total Return, Action
- Add Mkt Value (shares x price) and Total Return (dollar + percentage) columns
- Replace inline Buy/Sell buttons with a "..." action menu

### 5. Recent Activity Sidebar

Add a card showing recent trades:
- Pulls from holdings data (or a future trades table)
- Shows empty state "No recent activity" when no trades exist

### 6. Layout

Use a grid layout matching the screenshot:
- Top: 4 KPI cards in a row
- Middle: Performance chart (left ~60%) + Allocation and Portfolio Health stacked (right ~40%)
- Bottom: Holdings table (left ~65%) + Recent Activity (right ~35%)

### Technical Details

- File modified: `src/components/PortfolioView.tsx`
- No new dependencies needed (recharts AreaChart already available)
- All sections show real data from DB when available, empty/zero states otherwise
- No mock or hardcoded data values

