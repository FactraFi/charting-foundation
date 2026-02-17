

## Fix: Order Side Case Mismatch

**Problem:** The `orders` table has a check constraint requiring the `side` column to be uppercase (`'BUY'` or `'SELL'`), but the `execute_trade` database function inserts the value as-is from the frontend (`'buy'` / `'sell'` in lowercase). This causes the error: *"new row for relation 'orders' violates check constraint 'orders_side_check'"*.

**Solution:** Update the `execute_trade` database function to uppercase the `p_type` value before inserting into the `orders` table. This is a single-line fix in two places within the function (the QUEUED insert and the FILLED insert).

---

### Technical Details

**Database migration** -- Recreate the `execute_trade` function with `UPPER(p_type)` used in both `INSERT INTO public.orders` statements:

1. The "market closed" path (line inserting with status `'QUEUED'`): change `p_type` to `UPPER(p_type)`
2. The "market open" path (line inserting with status `'FILLED'`): change `p_type` to `UPPER(p_type)`

No frontend or edge function changes are needed -- the root cause is entirely in the database function.

