import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const INITIAL_CAPITAL = 10000;

export const useStartOfDayLiquidity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["start-of-day-liquidity", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_history")
        .select("total_net_liquidity")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.total_net_liquidity ?? INITIAL_CAPITAL;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
