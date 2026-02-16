import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StockData } from "@/lib/api";

export interface WhyScoreBullet {
  label: string;
  text: string;
}

export interface WhyScorePillar {
  bullets: WhyScoreBullet[];
}

export interface WhyScoreData {
  summary: string;
  fundamentals: WhyScorePillar;
  momentum: WhyScorePillar;
  risk: WhyScorePillar;
  sentiment: WhyScorePillar;
}

export const useWhyScore = (stock: StockData | null) =>
  useQuery<WhyScoreData>({
    queryKey: ["why-score", stock?.ticker],
    queryFn: async () => {
      if (!stock) throw new Error("No stock data");
      const { data, error } = await supabase.functions.invoke("why-score", {
        body: { stock },
      });
      if (error) throw error;
      return data as WhyScoreData;
    },
    enabled: !!stock?.has_scores,
    staleTime: 5 * 60_000,
    retry: 1,
  });
