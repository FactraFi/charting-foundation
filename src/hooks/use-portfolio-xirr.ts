import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calcXirr, type CashFlow } from "@/lib/xirr";

/**
 * Fetches ALL user transactions and computes XIRR (annualized return).
 * Cash flows:
 *   - Initial deposit of $10,000 on profile creation date (negative)
 *   - Each BUY  → negative (money spent)
 *   - Each SELL → positive (money received)
 *   - Terminal value = current net liquidity (positive, today)
 */
export const usePortfolioXirr = (currentNetLiquidity: number) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["portfolio-xirr", user?.id, currentNetLiquidity],
    queryFn: async () => {
      if (!profile) return null;

      // Fetch ALL transactions (no limit)
      const { data: txns, error } = await supabase
        .from("transactions")
        .select("type, shares, price, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const accountCreated = new Date(profile.created_at);
      const flows: CashFlow[] = [
        { amount: -10_000, date: accountCreated }, // initial deposit
      ];

      for (const tx of txns ?? []) {
        const total = tx.shares * tx.price;
        const date = new Date(tx.created_at);
        if (tx.type === "buy") {
          flows.push({ amount: -total, date });
        } else if (tx.type === "sell") {
          flows.push({ amount: total, date });
        }
      }

      // Terminal value (today)
      flows.push({ amount: currentNetLiquidity, date: new Date() });

      return calcXirr(flows);
    },
    enabled: !!user && !!profile && currentNetLiquidity > 0,
    staleTime: 60_000,
  });
};
