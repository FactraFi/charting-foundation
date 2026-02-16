import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StockData } from "@/lib/api";

export const useStockSummary = (stock: StockData | null) =>
  useQuery<string>({
    queryKey: ["stock-summary", stock?.ticker],
    queryFn: async () => {
      if (!stock) throw new Error("No stock data");
      const { data, error } = await supabase.functions.invoke("stock-summary", {
        body: { stock },
      });
      if (error) throw error;
      return data.summary as string;
    },
    enabled: !!stock,
    staleTime: 5 * 60_000,
    retry: 1,
  });
