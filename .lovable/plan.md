

# Elaborate "Why This Score?" with AI-Powered Pillar Breakdowns

## What Changes

The "Why This Score?" section currently shows either:
- The raw `why_explanation` from the database (a short one-liner like "NVIDIA Corporation scores 66/100 driven by strong fundamentals, positive momentum, low risk.")
- Hardcoded template text based on score thresholds

This will be replaced with AI-elaborated content that takes the `why_explanation` as a seed and produces structured, specific commentary for each pillar -- displayed in the exact 2-column card layout shown in the reference image.

## Design (matching reference image)

```
Why This Score?                                    [AI ENHANCED]

| NVIDIA Corporation scores 66/100 driven by strong fundamentals, positive momentum.

+----------------------------------+  +----------------------------------+
| 01. Fundamentals (85/100)        |  | 03. Risk (61/100)                |
|                                  |  |                                  |
| * Financial Health: Elite score  |  | * Volatility: Moderate volatility|
|   indicates robust balance sheet |  |   -- standard for growth stocks. |
|   and high-quality earnings.     |  |   Beta: 2.31                     |
|                                  |  |                                  |
| * Key Metrics: P/E: 45.2 |      |  +----------------------------------+
|   D/E: N/A | ROE: 107.4%        |  | 04. Sentiment (39/100)           |
+----------------------------------+  |                                  |
| 02. Momentum (76/100)            |  | * Market View: Bearish sentiment |
|                                  |  |   prevails. Target: $253.88      |
| * Price Trends: Strong uptrend   |  +----------------------------------+
|   with buyers in control.        |
+----------------------------------+
```

## Technical Plan

### 1. New Edge Function: `why-score`

Create `supabase/functions/why-score/index.ts` that:
- Accepts stock data (scores, metrics, `why_explanation`) in the request body
- Sends a prompt to Lovable AI (Gemini 3 Flash) with the `why_explanation` as context
- Uses tool calling to extract structured output with 4 pillar objects, each containing a heading bullet and sub-bullets
- Returns structured JSON like:
```json
{
  "summary": "NVIDIA Corporation scores 66/100 driven by strong fundamentals...",
  "pillars": {
    "fundamentals": {
      "bullets": [
        { "label": "Financial Health", "text": "Elite score indicates robust balance sheet..." },
        { "label": "Key Metrics", "text": "P/E: 45.2 | D/E: N/A | ROE: 107.4%" }
      ]
    },
    "momentum": {
      "bullets": [
        { "label": "Price Trends", "text": "Strong uptrend with buyers in control." }
      ]
    },
    "risk": {
      "bullets": [
        { "label": "Volatility", "text": "Moderate volatility -- standard for growth stocks. Beta: 2.31" }
      ]
    },
    "sentiment": {
      "bullets": [
        { "label": "Market View", "text": "Bearish sentiment prevails. Target: $253.88" }
      ]
    }
  }
}
```
- Handles 429/402 errors gracefully

### 2. New Hook: `useWhyScore`

Create `src/hooks/use-why-score.ts`:
- Takes a `StockData` object
- Calls the `why-score` edge function via `supabase.functions.invoke`
- Caches per ticker with 5-minute staleTime
- Returns `{ data, isLoading }`

### 3. Update `StockDetailView.tsx` -- "Why This Score?" Section

Replace lines 241-296 (the entire content block inside "Why This Score?"):

**Summary line**: Use the AI-returned summary (elaborated from `why_explanation`), displayed with the left border-l accent as currently shown.

**Pillar cards**: Replace the current hardcoded template text with AI-generated bullet points rendered in the same 2-column grid layout (01. Fundamentals + 02. Momentum on the left, 03. Risk + 04. Sentiment on the right), matching the reference image exactly.

**Loading state**: Show skeleton placeholders while the AI call is in flight.

**Fallback**: If the AI call fails, fall back to the current hardcoded template text.

### 4. Update `supabase/config.toml`

Add:
```toml
[functions.why-score]
verify_jwt = false
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/why-score/index.ts` | Create: AI elaboration edge function |
| `src/hooks/use-why-score.ts` | Create: React Query hook |
| `src/components/StockDetailView.tsx` | Modify: replace "Why This Score?" content with AI-generated structured output |
| `supabase/config.toml` | Update: add why-score function config |

