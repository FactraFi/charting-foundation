

## Database Schema Updates and Daily Cron Job

### 1. Create `orders` Table

A new table to track all orders with their status.

| Column | Type | Details |
|--------|------|---------|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | NOT NULL |
| ticker | text | NOT NULL |
| quantity | numeric | NOT NULL |
| side | text | CHECK: 'BUY' or 'SELL' |
| status | text | CHECK: 'FILLED', 'QUEUED', 'CANCELLED'; default 'QUEUED' |
| created_at | timestamptz | Default now() |

RLS policies: users can SELECT their own orders. INSERT/UPDATE restricted to own rows.

### 2. Modify `portfolio_history` Table

The existing table has columns: `date`, `user_id`, `total_value`, `cash_balance`, `invested_value`, `id`, `created_at`.

We will:
- Drop `cash_balance`, `invested_value`, and `total_value` columns
- Add `total_net_liquidity` (numeric, NOT NULL)
- Keep `id`, `user_id`, `date`, `created_at`
- Keep the existing unique constraint on `(user_id, date)` and the SELECT RLS policy

### 3. Update `snapshot-portfolio` Edge Function

Rewrite to match the simplified schema:
- Still fetches all holdings, gets Yahoo prices, gets cash balances
- Computes `total_net_liquidity = cash + sum(shares * price)` per user
- Also includes users with NO holdings (cash-only users) by querying all profiles
- Upserts into `portfolio_history` with just `user_id`, `date`, `total_net_liquidity`

### 4. Update `use-portfolio-history.ts` Hook

- Change `PortfolioHistoryPoint` interface to `{ date: string; total_net_liquidity: number }`
- Update the select query to fetch `date, total_net_liquidity`

### 5. Update `PortfolioView.tsx` (and any chart references)

- Update any references to `total_value`, `cash_balance`, or `invested_value` to use `total_net_liquidity`

### 6. Set Up Daily Cron Job (4 PM EST)

Use `pg_cron` and `pg_net` extensions to call the `snapshot-portfolio` edge function every day at 21:00 UTC (4 PM EST). This will be run as a SQL insert (not a migration) since it contains project-specific URLs and keys:

```text
Schedule: '0 21 * * *'  (21:00 UTC = 4:00 PM EST)
Action:   HTTP POST to snapshot-portfolio edge function
```

### Technical: Files Changed

| File | Action |
|------|--------|
| Migration SQL | Create `orders` table, alter `portfolio_history` |
| `supabase/functions/snapshot-portfolio/index.ts` | Simplify upsert to `total_net_liquidity` |
| `src/hooks/use-portfolio-history.ts` | Update types and query |
| `src/components/PortfolioView.tsx` | Update chart data keys |
| SQL insert (cron) | Schedule daily job via `pg_cron` + `pg_net` |

