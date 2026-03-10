import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export interface ScoreHistoryPoint {
  name: string;
  date: string;
  Fundamentals: number;
  Momentum: number;
  Risk: number;
  Sentiment: number;
}

export const useScoreHistory = (ticker: string | undefined, days = 20) =>
  useQuery<ScoreHistoryPoint[]>({
    queryKey: ["score-history", ticker, days],
    queryFn: async () => {
      if (!ticker) return [];
      const cutoff = subDays(new Date(), days).toISOString().split("T")[0];

      // Use .from() with type assertion since score_history may not be in generated types yet
      const { data, error } = await (supabase as any)
        .from("score_history")
        .select("snapshot_date, fundamentals, momentum, risk, sentiment")
        .eq("ticker", ticker)
        .gte("snapshot_date", cutoff)
        .order("snapshot_date", { ascending: true })
        .limit(days);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return (data as any[]).map((row) => ({
        name: format(new Date(row.snapshot_date + "T00:00:00"), "MMM d"),
        date: row.snapshot_date,
        Fundamentals: row.fundamentals ?? 0,
        Momentum: row.momentum ?? 0,
        Risk: row.risk ?? 0,
        Sentiment: row.sentiment ?? 0,
      }));
    },
    enabled: !!ticker,
    staleTime: 5 * 60_000,
  });
