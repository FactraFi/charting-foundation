import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export interface DbHolding {
  id: string;
  user_id: string;
  ticker: string;
  shares: number;
  avg_cost: number;
  created_at: string;
  updated_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  ticker: string;
  type: string;
  shares: number;
  price: number;
  created_at: string;
}

export const usePortfolio = () => {
  const { user } = useAuth();

  const holdingsQuery = useQuery({
    queryKey: ["holdings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as DbHolding[];
    },
    enabled: !!user,
  });

  return holdingsQuery;
};

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
      return (data ?? []) as DbTransaction[];
    },
    enabled: !!user,
  });
};

export const useExecuteTrade = () => {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const executeTrade = useCallback(
    async (params: {
      ticker: string;
      shares: number;
      price: number;
      type: "buy" | "sell";
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc("execute_trade", {
        p_ticker: params.ticker,
        p_type: params.type,
        p_shares: params.shares,
        p_price: params.price,
      });

      if (error) throw new Error(error.message);

      await refreshProfile();
      qc.invalidateQueries({ queryKey: ["holdings"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["queued-orders"] });
    },
    [user, refreshProfile, qc]
  );

  return executeTrade;
};
