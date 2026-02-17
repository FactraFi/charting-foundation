import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DbOrder {
  id: string;
  user_id: string;
  ticker: string;
  side: string;
  quantity: number;
  status: string;
  created_at: string;
}

export const useQueuedOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["queued-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "QUEUED")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbOrder[];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "CANCELLED" })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queued-orders"] });
    },
  });
};
