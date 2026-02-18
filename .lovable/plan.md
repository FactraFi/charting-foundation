

## Fix: Remove Auto-Scroll in FactraAI Tab

**Problem:** The FactraAI chat tab auto-scrolls the page when messages load, pushing the navigation bar off-screen. Other tabs don't have this issue.

**Cause:** A `useEffect` in `AIView.tsx` (lines 103-108) calls `messagesEndRef.current?.scrollIntoView()` whenever the `messages` array changes. `scrollIntoView` scrolls the entire page, not just the chat container.

**Solution:** Replace `scrollIntoView` with a container-scoped `scrollTo` call so only the chat message list scrolls internally.

---

### Technical Details

**File: `src/components/AIView.tsx`**

1. Add a new ref: `const chatContainerRef = useRef<HTMLDivElement>(null);`
2. Attach `chatContainerRef` to the scrollable chat container div (the one with class `overflow-y-auto` around line 220).
3. Replace the `useEffect` scroll logic:

```typescript
// Before:
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

// After:
chatContainerRef.current?.scrollTo({
  top: chatContainerRef.current.scrollHeight,
  behavior: "smooth",
});
```

4. The `messagesEndRef` div at the bottom of messages can be removed since it's no longer needed.

| File | Change |
|------|--------|
| `src/components/AIView.tsx` | Add `chatContainerRef`, attach to chat container, replace `scrollIntoView` with container `scrollTo`, remove unused `messagesEndRef` |

