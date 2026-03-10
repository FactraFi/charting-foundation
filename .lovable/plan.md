

## Side-by-Side Layout: Score + Breakdown | Why This Score

### Current State
The FactraFi Total Score (lines 148-203) and the "Why This Score?" section (lines 270-335) are stacked vertically as separate full-width blocks.

### Plan

**File: `src/components/StockDetailView.tsx`**

1. **Wrap the Scorecard and Why This Score in a single horizontal container**
   - Replace the current vertical stacking with a `flex` row (`lg:flex-row`, stacked on mobile).
   - **Left panel (~45%)**: The existing FactraFi Total Score box + connector lines + 4 pillar cards. Keep as-is but constrain width.
   - **Right panel (~55%)**: Move the entire "Why This Score?" block here. Reduce font sizes to fit:
     - Title: `text-xl` (from `text-2xl`)
     - Summary: `text-sm` (from `text-lg`)
     - PillarCard title: `text-sm` (from `text-lg`)
     - Bullet text: `text-xs` (from base)
     - Pillar grid gap: `gap-4` (from `gap-8`)
     - Container padding: `p-5` (from `p-8`)

2. **Remove the old standalone "Why This Score?" section** (lines 270-335) since it moves into the right panel.

3. **PillarCard component** — Add an optional `compact` prop that applies smaller text sizes when rendered in the side-by-side layout.

### Layout Result
```text
┌─────────────────────────────┬──────────────────────────────────┐
│   FACTRAFI TOTAL SCORE      │  Why This Score?    AI ENHANCED  │
│         66 /100             │  Summary text...                 │
│   ----connector lines----   │  01. Fundamentals    03. Risk    │
│ FUND | RISK | SENT | MOM   │  02. Momentum        04. Sent    │
└─────────────────────────────┴──────────────────────────────────┘
```

On mobile (`< lg`), columns stack vertically as before.

