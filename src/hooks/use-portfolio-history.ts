import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, subMonths, subYears, startOfYear } from "date-fns";

type TimePeriod = "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

function getStartDate(period: TimePeriod): string | null {
  const now = new Date();
  switch (period) {
    case "1W": return subDays(now, 7).toISOString().split("T")[0];
    case "1M": return subMonths(now, 1).toISOString().split("T")[0];
    case "3M": return subMonths(now, 3).toISOString().split("T")[0];
    case "YTD": return startOfYear(now).toISOString().split("T")[0];
    case "1Y": return subYears(now, 1).toISOString().split("T")[0];
    case "ALL": return null;
  }
}

export interface PortfolioHistoryPoint {
  date: string;
  total_value: number;
  cash_balance: number;
  invested_value: number;
}

export const usePortfolioHistory = (timePeriod: TimePeriod) => {
  const { user } = useAuth();
  const startDate = getStartDate(timePeriod);

  return useQuery<PortfolioHistoryPoint[]>({
    queryKey: ["portfolio-history", user?.id, timePeriod],
    queryFn: async () => {
      let query = supabase
        .from("portfolio_history")
        .select("date, total_value, cash_balance, invested_value")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });

      if (startDate) {
        query = query.gte("date", startDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PortfolioHistoryPoint[];
    },
    enabled: !!user,
  });
};
