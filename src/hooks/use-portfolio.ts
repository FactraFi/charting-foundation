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

      const { ticker, shares, price, type } = params;
      const total = shares * price;

      // Get current profile
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("cash_balance")
        .eq("id", user.id)
        .maybeSingle();
      if (pErr || !profile) throw new Error("Could not fetch profile");

      if (type === "buy") {
        if (profile.cash_balance < total)
          throw new Error("Insufficient buying power");

        // Deduct cash
        const { error: cashErr } = await supabase
          .from("profiles")
          .update({ cash_balance: profile.cash_balance - total })
          .eq("id", user.id);
        if (cashErr) throw cashErr;

        // Upsert holding
        const { data: existing } = await supabase
          .from("holdings")
          .select("*")
          .eq("user_id", user.id)
          .eq("ticker", ticker)
          .maybeSingle();

        if (existing) {
          const newShares = (existing as DbHolding).shares + shares;
          const newAvg =
            ((existing as DbHolding).avg_cost * (existing as DbHolding).shares + total) / newShares;
          await supabase
            .from("holdings")
            .update({ shares: newShares, avg_cost: newAvg, updated_at: new Date().toISOString() })
            .eq("id", (existing as DbHolding).id);
        } else {
          await supabase.from("holdings").insert({
            user_id: user.id,
            ticker,
            shares,
            avg_cost: price,
          });
        }
      } else {
        // Sell
        const { data: existing } = await supabase
          .from("holdings")
          .select("*")
          .eq("user_id", user.id)
          .eq("ticker", ticker)
          .maybeSingle();

        if (!existing || (existing as DbHolding).shares < shares)
          throw new Error("Insufficient shares");

        // Add cash
        const { error: cashErr } = await supabase
          .from("profiles")
          .update({ cash_balance: profile.cash_balance + total })
          .eq("id", user.id);
        if (cashErr) throw cashErr;

        const remaining = (existing as DbHolding).shares - shares;
        if (remaining <= 0) {
          await supabase.from("holdings").delete().eq("id", (existing as DbHolding).id);
        } else {
          await supabase
            .from("holdings")
            .update({ shares: remaining, updated_at: new Date().toISOString() })
            .eq("id", (existing as DbHolding).id);
        }
      }

      // Refresh data
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ["holdings"] });
    },
    [user, refreshProfile, qc]
  );

  return executeTrade;
};
