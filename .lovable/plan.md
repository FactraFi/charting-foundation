

# Fix Inconsistent Fonts on Portfolio Page

## Problem
The Portfolio page mixes `font-brand` (Space Grotesk) and the default `font-sans` (Inter) inconsistently across headings, KPI values, table headers, and section titles. The reference screenshots show a clean, bold aesthetic with consistent typography.

## Approach
Standardize the page to use `font-brand` (Space Grotesk) for all headings, card titles, KPI labels, and numeric values, while keeping body/description text in `font-sans` (Inter). Add `font-bold` to all section headings and key labels for visual weight.

## Changes (single file: `src/components/PortfolioView.tsx`)

### 1. Page header (line 132)
- Already uses `font-bold font-brand` -- no change needed.

### 2. KPI card values (lines 145, 159, 173, 185)
- Already use `font-bold font-brand` -- no change needed.

### 3. KPI card labels (lines 144, 158, 172, 184)
- Already use `font-bold` with uppercase tracking -- no change needed.

### 4. Card section titles ("Performance", "Allocation", "Portfolio Health", "Holdings", "Recent Activity")
- Lines 199, 279, 319, 367, 402: These `CardTitle` elements use `text-sm font-bold` but are missing `font-brand`. Add `font-brand` to all of them for consistency.

### 5. Table headers (line 373-381)
- `TableHead` elements currently use default font. Add `font-brand font-bold` to each `TableHead` for bolder, consistent column headers.

### 6. Holding row ticker name (line 61)
- Add `font-brand` alongside existing `font-bold`.

### 7. Holding row numeric cells (lines 66-71)
- Add `font-brand` to the `font-medium` and `font-bold` cells for tabular values.

### 8. Recent Activity ticker (line 418)
- Add `font-brand` to the ticker label.

### 9. Recent Activity total value (line 426)
- Add `font-brand` to the transaction amount.

### 10. Portfolio Health labels ("Beta", "Sharpe Ratio") and values (lines 348-354)
- Add `font-brand` to the value spans.

### 11. Empty state text
- Keep as `font-sans` (Inter) since these are descriptive paragraphs.

## Summary
All headings, section titles, ticker labels, and numeric values will use `font-brand` (Space Grotesk) with appropriate bold weights. Descriptive/body text stays in Inter. This matches the bold, clean aesthetic shown in the reference images.

