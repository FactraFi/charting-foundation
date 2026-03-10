import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { calcXirr, type CashFlow } from "@/lib/xirr";

/**
 * Computes XIRR (annualized return) using a closed-system 2-flow model:
 *   Flow 1: −$10,000 on account creation date
 *   Flow 2: +currentNetLiquidity today
 *
 * Internal trades (buys/sells) are NOT external cash flows — they're
 * rebalancing within the same $10k deposit.
 */
export const usePortfolioXirr = (currentNetLiquidity: number) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["portfolio-xirr", user?.id, currentNetLiquidity],
    queryFn: async () => {
      if (!profile) return null;

      const accountCreated = new Date(profile.created_at);
      const flows: CashFlow[] = [
        { amount: -10_000, date: accountCreated },
        { amount: currentNetLiquidity, date: new Date() },
      ];

      return calcXirr(flows);
    },
    enabled: !!user && !!profile && currentNetLiquidity > 0,
    staleTime: 60_000,
  });
};
