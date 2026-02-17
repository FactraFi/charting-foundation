

## Remove Limit Order UI from TradeModal

### What Changes

**File: `src/components/TradeModal.tsx`**

Remove all limit order related code:

1. Remove state variables: `orderType`, `limitPrice`, and `showTooltip`
2. Remove the `useEffect` that syncs `limitPrice` with `currentPrice` (line 30-32)
3. Remove `setOrderType('market')` and `setShowTooltip(false)` from the reset effect
4. Simplify `effectivePrice` -- just use `currentPrice` directly
5. Remove the entire "Order Type" row (the Market/Limit toggle at lines 118-124)
6. Simplify the price display row (lines 134-155): remove the limit price input, the conditional label, and the tooltip. Replace with a simple "Market Price" label and the current price value
7. Remove `Info` from the lucide-react import

### What Stays

- Buy/Sell toggle
- Quantity input
- Estimated Total
- Available balance display
- Paper Trading badge
- Confirm button and success screen

### No Backend Changes

The `execute_trade` database function does not have any limit order logic currently, so no backend changes are needed.
