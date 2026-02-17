import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PriceResult {
  current_price: number;
}

async function fetchPrice(ticker: string): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Yahoo error ${res.status} for ${ticker}`);
  const json = await res.json();
  const price = json.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!price) throw new Error(`No price for ${ticker}`);
  return price;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all QUEUED orders
    const { data: orders, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "QUEUED")
      .order("created_at", { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: "No queued orders" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch prices for all unique tickers
    const tickers = [...new Set(orders.map((o: any) => o.ticker))];
    const priceMap = new Map<string, number>();
    await Promise.allSettled(
      tickers.map(async (t) => {
        try {
          priceMap.set(t, await fetchPrice(t));
        } catch (e) {
          console.error(`Price fetch failed for ${t}:`, e);
        }
      })
    );

    let filled = 0;
    let failed = 0;

    for (const order of orders) {
      const price = priceMap.get(order.ticker);
      if (!price) {
        // Can't get price, mark failed
        await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
        failed++;
        continue;
      }

      // Fetch user's current cash and holdings
      const { data: profile } = await supabase
        .from("profiles")
        .select("cash_balance")
        .eq("id", order.user_id)
        .single();

      if (!profile) {
        await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
        failed++;
        continue;
      }

      const total = order.quantity * price;

      if (order.side === "buy") {
        // Overdraft check
        if (profile.cash_balance < total) {
          await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
          failed++;
          continue;
        }

        // Deduct cash
        await supabase
          .from("profiles")
          .update({ cash_balance: profile.cash_balance - total })
          .eq("id", order.user_id);

        // Upsert holding
        const { data: existing } = await supabase
          .from("holdings")
          .select("id, shares, avg_cost")
          .eq("user_id", order.user_id)
          .eq("ticker", order.ticker)
          .maybeSingle();

        if (existing) {
          const newShares = existing.shares + order.quantity;
          const newAvg = (existing.avg_cost * existing.shares + total) / newShares;
          await supabase
            .from("holdings")
            .update({ shares: newShares, avg_cost: newAvg, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("holdings").insert({
            user_id: order.user_id,
            ticker: order.ticker,
            shares: order.quantity,
            avg_cost: price,
          });
        }
      } else if (order.side === "sell") {
        // Check shares
        const { data: holding } = await supabase
          .from("holdings")
          .select("id, shares")
          .eq("user_id", order.user_id)
          .eq("ticker", order.ticker)
          .maybeSingle();

        if (!holding || holding.shares < order.quantity) {
          await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
          failed++;
          continue;
        }

        // Add cash
        await supabase
          .from("profiles")
          .update({ cash_balance: profile.cash_balance + total })
          .eq("id", order.user_id);

        const newShares = holding.shares - order.quantity;
        if (newShares <= 0) {
          await supabase.from("holdings").delete().eq("id", holding.id);
        } else {
          await supabase
            .from("holdings")
            .update({ shares: newShares, updated_at: new Date().toISOString() })
            .eq("id", holding.id);
        }
      }

      // Log transaction
      await supabase.from("transactions").insert({
        user_id: order.user_id,
        ticker: order.ticker,
        type: order.side,
        shares: order.quantity,
        price: price,
      });

      // Mark filled
      await supabase.from("orders").update({ status: "FILLED" }).eq("id", order.id);
      filled++;
    }

    return new Response(
      JSON.stringify({ message: `Processed: ${filled} filled, ${failed} failed` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-queued-orders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
