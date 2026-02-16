

# Replace Stock Description with AI-Generated Summary

## What Changes

The current text under the ticker (e.g., "NVIDIA Corporation -- TECHNOLOGY / SEMICONDUCTORS. Signal: Hold.") will be replaced with a short AI-generated summary that analyzes all three marker categories (Technical, Fundamental, Sentiment) in 25 words or fewer, matching the reference design.

## Design

The summary line will look like:
> **Summary:** Fundamentals remain pristine with record earnings growth. Momentum signals a breakout above resistance. Risk is moderate despite volatility...

It will be generated on-demand using Lovable AI when the stock detail page loads, with a brief "Generating summary..." placeholder while loading.

---

## Technical Plan

### 1. Create `stock-summary` Edge Function

A new non-streaming edge function that:
- Accepts stock data (scores, metrics, signal) in the request body
- Sends a tightly constrained prompt to Lovable AI (Gemini 3 Flash) asking for a 25-word max summary analyzing fundamentals, momentum, risk, and sentiment
- Uses tool calling to extract structured output (just the summary string)
- Returns `{ summary: "..." }`
- Handles 429/402 errors gracefully

### 2. Create `useStockSummary` Hook

A new React Query hook in `src/hooks/use-stock-summary.ts` that:
- Takes a `StockData` object
- Calls the `stock-summary` edge function via `supabase.functions.invoke`
- Caches the result per ticker (staleTime: 5 minutes)
- Returns `{ summary, isLoading }`

### 3. Update `MarkerSection.tsx`

- Remove line 100-103 (the "stock.name -- sector / industry. Signal: ..." text)
- Replace with a "Summary:" label (underlined, like the reference image) followed by the AI summary text
- Show "Generating summary..." in muted text while loading
- Fall back to a basic description if the AI call fails

### 4. Update `supabase/config.toml`

Add the new `stock-summary` function entry with `verify_jwt = false`.

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/stock-summary/index.ts` | Create: AI summary edge function |
| `src/hooks/use-stock-summary.ts` | Create: React Query hook |
| `src/components/MarkerSection.tsx` | Modify: replace description with AI summary |
| `supabase/config.toml` | Update: add function config |

