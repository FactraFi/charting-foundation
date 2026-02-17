

# Update Stock Summary to 50-Word Analyst Takeaways

## Problem

Current summaries just echo raw scores (e.g., "Strong 85/100 fundamentals and 76 momentum...") that users can already see in the Markers section. They provide no real insight.

## Solution

Update three parts of `supabase/functions/stock-summary/index.ts`:

1. **User prompt (line 25)**: Change instruction from "Write a 25-word-max analyst summary covering fundamentals, momentum, and sentiment. Be specific and data-driven. No disclaimers." to: "In 50 words or fewer, give a plain-English analyst takeaway: what is the investment case or concern for this stock right now? Focus on outlook, key drivers, and catalysts. Do NOT restate raw scores or numbers. No disclaimers."

2. **System message (line 36)**: Change from "You are a concise equity analyst. Return only the summary text, nothing else." to: "You are a concise equity analyst. Provide actionable takeaways in plain English. Never restate raw scores or numbers the user can already see. Return only the summary text."

3. **Tool parameter description (line 48)**: Change from "25-word max analyst summary" to "50-word max plain-English analyst takeaway focusing on outlook and key drivers"

## Expected Result

**Before:** "Strong 85/100 fundamentals and 76 momentum support long-term growth, though 39/100 sentiment and high 2.31 beta warrant caution despite a 4.1 analyst rating."

**After:** "NVIDIA's AI chip dominance and data center revenue surge position it as the top AI infrastructure play. However, elevated valuation multiples and cooling market sentiment suggest near-term volatility. Watch upcoming earnings and hyperscaler capex guidance for the next catalyst."

No frontend changes needed -- the summary is already rendered dynamically via the `useStockSummary` hook.

