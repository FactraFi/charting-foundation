

# Replace Ticker Initials with Company Logos

## Overview

Replace all instances of the single-letter ticker initial avatars (e.g., "N" for NVDA) with actual company logos fetched from the Logo.dev API using the public key provided.

## Approach

Create a reusable `CompanyLogo` component, then replace every `ticker[0]` avatar across 5 files.

## New Component

**Create: `src/components/CompanyLogo.tsx`**

A small reusable component that renders the Logo.dev image with a fallback to the initial letter if the image fails to load.

```tsx
const LOGO_DEV_PUBLIC_KEY = 'pk_IzlBLDwbTDmjauKaJCedig';

interface CompanyLogoProps {
  ticker: string;
  size?: number;       // width/height in pixels
  className?: string;  // pass-through for styling
}

const CompanyLogo = ({ ticker, size = 32, className }) => {
  // img with onError fallback to show ticker[0] initial
  return (
    <img
      src={`https://img.logo.dev/ticker/${ticker}?token=${LOGO_DEV_PUBLIC_KEY}`}
      alt={ticker}
      width={size}
      height={size}
      className={className}  // e.g. "rounded-full"
      onError={(e) => { /* hide img, show fallback initial */ }}
    />
  );
};
```

The component handles loading errors gracefully by falling back to the current initial-letter circle.

## Files to Modify

Each file has `ticker[0]` inside a styled div acting as an avatar. Replace the inner text with the `CompanyLogo` component while keeping the container styling.

| File | Location | Context |
|------|----------|---------|
| `src/components/DashboardView.tsx` | Line 280 | Hero stock avatar (64px circle) |
| `src/components/MarkerSection.tsx` | Line 82 | Stock detail header (64px circle) |
| `src/components/ScreenerView.tsx` | Lines 43, 150 | Stock cards (48px) and industry card previews (32px) |
| `src/components/PortfolioView.tsx` | Line 70 | Holdings table row (32px rounded square) |
| `src/components/ModernNavbar.tsx` | Line 114 | Search result dropdown (24px square) |

## Example Replacement

Before:
```tsx
<div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
  {stock.ticker[0]}
</div>
```

After:
```tsx
<div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
  <CompanyLogo ticker={stock.ticker} size={64} className="rounded-full object-cover" />
</div>
```

## Summary

| File | Action |
|------|--------|
| `src/components/CompanyLogo.tsx` | Create new reusable logo component with fallback |
| `src/components/DashboardView.tsx` | Replace initial at line 280 |
| `src/components/MarkerSection.tsx` | Replace initial at line 82 |
| `src/components/ScreenerView.tsx` | Replace initials at lines 43, 150 |
| `src/components/PortfolioView.tsx` | Replace initial at line 70 |
| `src/components/ModernNavbar.tsx` | Replace initial at line 114 |

