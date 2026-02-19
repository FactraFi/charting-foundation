

## Improve FactraAI Response Length and Formatting

### What Changes

**1. Shorten responses to ~100 words** by updating the system prompt in the backend function to enforce brevity.

**2. Style assistant message markdown** with green accent colors for headers, bullet points, and key highlights to match the app's theme.

---

### Technical Details

**File 1: `supabase/functions/chat/index.ts`** (lines 28-35)

Update the system prompt to enforce the 100-word limit and clean formatting:

```
You are FactraAI, a professional financial markets assistant built into the FactraFi platform.

RESPONSE RULES:
- Keep every response under 100 words. Be extremely concise.
- Use short bullet points for key data points.
- Use bold (**text**) to highlight key metrics and numbers.
- Use markdown headers (##) only when categorizing distinct sections.
- Never write long paragraphs. Prefer 1-2 sentence summaries.
- End with a one-line disclaimer when giving analysis.

You specialize in stock analysis, market sentiment, quantitative strategies, portfolio allocation, and news summarization. Be data-driven and professional. This is not financial advice.
```

**File 2: `src/components/AIView.tsx`** (line 254)

Add custom CSS classes to the `ReactMarkdown` wrapper to style headers, bullets, and bold text with the green primary accent color:

```tsx
<div className="text-sm prose prose-sm prose-invert max-w-none leading-relaxed
  [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary
  [&_strong]:text-primary [&_strong]:font-semibold
  [&_li]:marker:text-primary
  [&_ul]:space-y-1 [&_ol]:space-y-1
  [&_p]:mb-2 [&_p:last-child]:mb-0
  [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2
  [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2">
  <ReactMarkdown>{msg.content}</ReactMarkdown>
</div>
```

This uses Tailwind arbitrary variant selectors to target markdown-rendered elements:
- Headers (`h1`, `h2`, `h3`) get the green primary color
- Bold text (`strong`) gets the green primary color
- Bullet point markers get the green primary color
- Spacing is tightened for a clean, compact look

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Update system prompt to enforce 100-word limit and clean formatting |
| `src/components/AIView.tsx` | Add green accent styling to markdown elements via Tailwind classes |
