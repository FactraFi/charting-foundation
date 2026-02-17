

## Fix: Show Market Cap and P/E Ratio on Screener Cards

### The Problem

The screener cards hardcode "---" (em dash) for Market Cap and P/E Ratio (lines 82 and 86 of ScreenerView.tsx). The data source for screener cards is the `stock_scores` table, which doesn't contain these fields. Meanwhile, the MarkerSection on the stock detail page gets them from the full `stock-data` endpoint (which calls Alpha Vantage).

### Available Data

- **Market Cap**: Already stored in the `stock_universe` database table (e.g., "3.8T", "139.1B"). No external API call needed.
- **P/E Ratio**: Not stored in any cached table. Only available via Alpha Vantage (slow, rate-limited). Not worth fetching for every screener card.

### The Fix

**1. Fetch Market Cap from the database (no API calls)**

Modify `fetchScoredUniverse` in `src/lib/api.ts` to join `stock_universe` and pull `market_cap` alongside scores. Since both tables share the `ticker` column, we can do a simple left join or a second query merged client-side.

**2. Add Market Cap to the ScreenerStock interface and cards**

Update the `ScreenerStock` interface in `ScreenerView.tsx` to include `market_cap`, then display it on the card instead of "---".

**3. P/E Ratio -- show "N/A" instead of "---"**

Since P/E isn't available without slow API calls, change the display from "---" to "N/A" to be consistent with the rest of the app. Alternatively, we can remove the P/E field from screener cards entirely and only show it on the detail page.

### Technical Details

**File: `src/lib/api.ts`**

Update `fetchScoredUniverse` to also fetch market_cap by querying `stock_universe`:

```typescript
export const fetchScoredUniverse = async (): Promise<StockScoreRow[]> => {
  // Fetch scores
  const { data: scores, error } = await supabase
    .from("stock_scores")
    .select("*")
    .not("v_score", "is", null)
    .order("v_score", { ascending: false });
  if (error) throw error;

  // Fetch market caps from stock_universe
  const { data: universe } = await supabase
    .from("stock_universe")
    .select("ticker, market_cap");

  // Merge market_cap into scores
  const capMap = new Map((universe || []).map(u => [u.ticker, u.market_cap]));
  return (scores || []).map(s => ({
    ...s,
    market_cap: capMap.get(s.ticker) || null,
  }));
};
```

**File: `src/lib/api.ts` (StockScoreRow type)**

Add `market_cap` to the `StockScoreRow` interface:

```typescript
export interface StockScoreRow {
  // ...existing fields...
  market_cap: string | null;
}
```

**File: `src/components/ScreenerView.tsx`**

- Add `market_cap` to the `ScreenerStock` interface
- Pass `market_cap` from universe data into screener stocks
- Display `stock.market_cap || 'N/A'` instead of "---" on the card
- Change P/E Ratio to show "N/A"

### What This Does NOT Do

- Does not add any new API calls or slow things down
- Does not fetch P/E ratio (that requires Alpha Vantage and would re-introduce the speed problem we just fixed)
- P/E is still visible on the stock detail page where the full data is loaded

