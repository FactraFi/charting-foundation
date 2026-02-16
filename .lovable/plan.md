

# Two Quick Fixes: Tab Order and AI Auto-Scroll

## 1. Reorder Navigation Tabs (Remove Strategy)

**File:** `src/components/ModernNavbar.tsx` (lines 14-19)

Current order: Markets | Screener | FactraAI | Strategy | Portfolio

Update the `routes` array to remove Strategy and keep the desired order:

```ts
const routes = [
  { path: '/', label: 'Markets', icon: LayoutDashboard },
  { path: '/screener', label: 'Screener', icon: Search },
  { path: '/ai', label: 'FactraAI', icon: Cpu },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
];
```

## 2. Fix FactraAI Auto-Scroll on Tab Load

**File:** `src/components/AIView.tsx` (lines 104-106)

The `useEffect` calls `scrollIntoView` whenever `messages` changes -- including on initial mount when the default assistant greeting is set. This causes the page to scroll down and hide the header.

Fix: track whether it is the first render and skip the scroll on mount.

```tsx
const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

This ensures the scroll-to-bottom only fires after user interaction (sending a message), not on initial page load.

## Summary

| File | Change |
|------|--------|
| `src/components/ModernNavbar.tsx` | Remove Strategy from `routes` array |
| `src/components/AIView.tsx` | Skip `scrollIntoView` on first render |

