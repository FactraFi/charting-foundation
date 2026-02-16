

# Authentication, User Accounts, and Real Data Implementation

## Overview

This plan covers four major changes:

1. Add a `/login` route with the existing AuthScreen (minus the dev skip button)
2. Wire up real authentication (signup, login, logout) via Lovable Cloud
3. Create a `profiles` table with a $10,000 starting paper-trading balance and a `holdings` table for portfolio trades
4. Replace all hardcoded mock data (Total Equity, Day's P&L, Buying Power, Portfolio XIRR, holdings, performance history) with real data from the database

---

## 1. Login Page as a Route

- Create `/login` route in `src/App.tsx`
- Create `src/pages/LoginPage.tsx` that renders the existing `AuthScreen` component
- Remove the `[DEV] Skip Login` button from `AuthScreen.tsx`
- Update `AppLayout.tsx` to check for authenticated session and redirect unauthenticated users to `/login`

## 2. Real Authentication (Signup, Login, Logout)

### Database Migration

Create a `profiles` table to store user-specific data:

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  cash_balance numeric NOT NULL DEFAULT 10000.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

Create a `holdings` table to store paper trades:

```sql
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  shares numeric NOT NULL DEFAULT 0,
  avg_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker)
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own holdings"
  ON public.holdings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
  ON public.holdings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON public.holdings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON public.holdings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

Create a trigger to auto-create a profile on signup:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, cash_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    10000.00
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Auth Context

- Create `src/contexts/AuthContext.tsx` with an `AuthProvider` that wraps the app
- Uses `supabase.auth.onAuthStateChange` and `supabase.auth.getSession` to track auth state
- Exposes `user`, `session`, `profile`, `signUp`, `signIn`, `signOut`, `loading`

### AuthScreen Changes (`src/components/AuthScreen.tsx`)

- Remove the `[DEV] Skip Login` button
- Replace the `onLogin` callback with real `supabase.auth.signUp` / `supabase.auth.signInWithPassword` calls
- Pass `full_name` in signup metadata so the trigger can populate `profiles.full_name`
- Replace the dummy forgot-password flow with `supabase.auth.resetPasswordForEmail`

### AppLayout / Route Protection (`src/components/AppLayout.tsx`)

- Use `AuthContext` to check if user is logged in
- If not authenticated, redirect to `/login`
- Display the real user name from `profile` in the navbar instead of "John Doe"

### ModernNavbar (`src/components/ModernNavbar.tsx`)

- Replace hardcoded "John Doe" / "john.doe@example.com" with real profile data from `AuthContext`
- Wire the "Sign Out" button to `signOut()` from context

## 3. Remove All Mock Data

### Dashboard Metrics Strip (`src/components/DashboardView.tsx`, lines 177-218)

Currently hardcoded:
- Total Equity: `$124,592.00`
- Day's P&L: `+$1,840.50`
- Buying Power: `$42,000.00`
- Portfolio XIRR: `+24.8%`

Replace with real computed values:
- **Total Equity** = cash_balance + sum(holdings shares x live price) -- computed from profile + holdings + live prices
- **Day's P&L** = sum(shares x (current_price - previous_close)) -- from live stock data
- **Buying Power** = cash_balance from profiles table
- **Portfolio XIRR** = show "N/A" or "--" until real trade history exists to calculate it

### Portfolio View (`src/components/PortfolioView.tsx`)

Currently hardcoded:
- `INITIAL_HOLDINGS` array (NVDA, AMD, MSFT, AAPL, PLTR with mock shares/costs)
- `PERF_HISTORY` array (mock monthly values)
- KPI cards with static labels

Replace with:
- Fetch holdings from `holdings` table for the authenticated user
- Show empty state when user has no holdings ("Your portfolio is empty. Start trading!")
- Remove `PERF_HISTORY` mock data; show empty chart or "No history yet" message
- Compute real allocation percentages from (shares x price) / total portfolio value

### Trade Modal (`src/components/TradeModal.tsx`)

Currently just shows a fake success animation. Replace with real logic:
- On **Buy**: deduct `quantity x price` from `profiles.cash_balance`, upsert into `holdings` table (update avg_cost and shares)
- On **Sell**: add `quantity x price` to `profiles.cash_balance`, reduce shares in `holdings` (delete row if shares reach 0)
- Validate sufficient cash (buy) or sufficient shares (sell) before executing

## 4. New/Modified Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/AuthContext.tsx` | Create | Auth provider with session, profile, holdings |
| `src/pages/LoginPage.tsx` | Create | Route wrapper for AuthScreen |
| `src/pages/ResetPasswordPage.tsx` | Create | Password reset page at `/reset-password` |
| `src/hooks/use-portfolio.ts` | Create | Hook to fetch holdings + profile cash balance |
| `src/App.tsx` | Modify | Add `/login` and `/reset-password` routes, wrap with AuthProvider |
| `src/components/AppLayout.tsx` | Modify | Auth gate -- redirect to /login if not authenticated |
| `src/components/AuthScreen.tsx` | Modify | Remove dev skip, wire real signup/login |
| `src/components/ModernNavbar.tsx` | Modify | Show real user name from profile |
| `src/components/DashboardView.tsx` | Modify | Replace hardcoded metrics with computed values from portfolio hook |
| `src/components/PortfolioView.tsx` | Modify | Replace INITIAL_HOLDINGS and PERF_HISTORY with DB data, add empty state |
| `src/components/TradeModal.tsx` | Modify | Execute real paper trades against DB |

### Database Tables Created

| Table | Purpose |
|-------|---------|
| `profiles` | User profile with $10,000 starting cash_balance |
| `holdings` | User's paper trading positions (ticker, shares, avg_cost) |

