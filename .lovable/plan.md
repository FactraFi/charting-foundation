

# Create Transactions Table and Atomic Trade Function

## Overview

Create a `transactions` table for permanent trade records and an `execute_trade` database function that performs all trade operations atomically, replacing the current multi-step client-side logic.

## Step 1: Database Migration

Create the `transactions` table and `execute_trade` RPC function in a single migration.

**Table: `transactions`**

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL, references profiles(id) |
| ticker | text | NOT NULL |
| type | text | NOT NULL, check in ('buy','sell') |
| shares | numeric | NOT NULL |
| price | numeric | NOT NULL |
| created_at | timestamptz | default now() |

RLS policies:
- Users can SELECT their own transactions
- Users can INSERT their own transactions (needed for the RPC with security definer, but also as a safety net)

**Function: `execute_trade(p_ticker, p_type, p_shares, p_price)`**

A `SECURITY DEFINER` PL/pgSQL function that:
1. Gets `auth.uid()` for the current user
2. Fetches the user's `cash_balance` from `profiles`
3. Calculates `total = p_shares * p_price`
4. **Buy path**: validates sufficient cash, deducts from balance, upserts into `holdings` (weighted avg cost calculation)
5. **Sell path**: validates sufficient shares, adds to balance, updates/deletes holding
6. Inserts a record into `transactions`
7. All within a single atomic function call (implicit transaction)

## Step 2: Update `use-portfolio.ts`

Replace the entire `useExecuteTrade` hook body. Instead of multiple client-side Supabase calls, make a single RPC call:

```typescript
const { error } = await supabase.rpc("execute_trade", {
  p_ticker: ticker,
  p_type: type,
  p_shares: shares,
  p_price: price,
});
```

Then refresh profile and invalidate queries for both `holdings` and `transactions`.

## Step 3: Add `useTransactions` Hook

Add a new query hook in `use-portfolio.ts` to fetch recent transactions:

```typescript
export const useTransactions = (limit = 10) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
```

## Step 4: Wire Up Recent Activity in `PortfolioView.tsx`

Update the "Recent Activity" card to use `useTransactions()` and display each trade with:
- Buy/Sell icon and color coding (green for buy, red for sell)
- Ticker, shares, price, and relative timestamp (e.g., "2 hours ago")
- Empty state when no transactions exist

