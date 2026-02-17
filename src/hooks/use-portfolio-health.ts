import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PortfolioHealth {
  beta: number | null;
  sharpeRatio: number | null;
  healthScore: number | null;
}

function dailyReturns(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  return returns;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (a[i] - ma) * (b[i] - mb);
  }
  return sum / (n - 1);
}

export const usePortfolioHealth = (): { data: PortfolioHealth; isLoading: boolean } => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["portfolio-health", user?.id],
    queryFn: async (): Promise<PortfolioHealth> => {
      // Fetch last 30 days of portfolio history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      const { data: history, error: histError } = await supabase
        .from("portfolio_history")
        .select("date, total_net_liquidity")
        .eq("user_id", user!.id)
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (histError) throw histError;
      if (!history || history.length < 3) {
        return { beta: null, sharpeRatio: null, healthScore: null };
      }

      // Fetch SPY data from edge function
      const { data: spyData, error: spyError } = await supabase.functions.invoke("spy-history");
      if (spyError) throw spyError;

      const spyPrices: { date: string; close_price: number }[] = spyData?.prices ?? [];
      if (spyPrices.length < 3) {
        return { beta: null, sharpeRatio: null, healthScore: null };
      }

      // Align dates
      const spyMap = new Map(spyPrices.map((s) => [s.date, s.close_price]));
      const alignedPortfolio: number[] = [];
      const alignedSpy: number[] = [];

      for (const h of history) {
        const spyClose = spyMap.get(h.date);
        if (spyClose != null) {
          alignedPortfolio.push(h.total_net_liquidity);
          alignedSpy.push(spyClose);
        }
      }

      const portReturns = dailyReturns(alignedPortfolio);
      const spyReturns = dailyReturns(alignedSpy);

      const n = Math.min(portReturns.length, spyReturns.length);
      if (n < 2) {
        return { beta: null, sharpeRatio: null, healthScore: null };
      }

      const pr = portReturns.slice(0, n);
      const sr = spyReturns.slice(0, n);

      const spyVar = stddev(sr) ** 2;
      const beta = spyVar > 0 ? covariance(pr, sr) / spyVar : null;

      const avgReturn = mean(pr);
      const sd = stddev(pr);
      const sharpeRatio = sd > 0 ? ((avgReturn - 0.0001) / sd) * Math.sqrt(252) : null;

      // Health score: simple 0-100 based on Sharpe
      let healthScore: number | null = null;
      if (sharpeRatio !== null) {
        healthScore = Math.max(0, Math.min(100, Math.round(50 + sharpeRatio * 20)));
      }

      return {
        beta: beta !== null ? Math.round(beta * 100) / 100 : null,
        sharpeRatio: sharpeRatio !== null ? Math.round(sharpeRatio * 100) / 100 : null,
        healthScore,
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  return {
    data: query.data ?? { beta: null, sharpeRatio: null, healthScore: null },
    isLoading: query.isLoading,
  };
};
