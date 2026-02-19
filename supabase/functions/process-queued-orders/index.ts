import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // 1. Fetch all QUEUED orders
    const { data: orders, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "QUEUED")
      .order("created_at", { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!orders || orders.length === 0) {
      console.log("No queued orders found");
      return new Response(JSON.stringify({ message: "No queued orders" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${orders.length} queued orders`);

    // 2. Integrity check: warn about phantom FILLED orders (no matching transaction)
    const { data: phantomOrders } = await supabase
      .from("orders")
      .select("id, ticker, side, quantity, created_at")
      .eq("status", "FILLED");

    if (phantomOrders && phantomOrders.length > 0) {
      const { count: txCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });

      if (txCount === 0 && phantomOrders.length > 0) {
        console.warn(
          `⚠️ INTEGRITY WARNING: ${phantomOrders.length} FILLED orders exist but 0 transactions found. Possible prior data corruption.`
        );
      }
    }

    // 3. Batch-fetch prices for all unique tickers
    const tickers = [...new Set(orders.map((o: any) => o.ticker))];
    const priceMap = new Map<string, number>();
    await Promise.allSettled(
      tickers.map(async (t) => {
        try {
          const price = await fetchPrice(t);
          priceMap.set(t, price);
          console.log(`Price for ${t}: $${price}`);
        } catch (e) {
          console.error(`Price fetch failed for ${t}:`, e);
        }
      })
    );

    // 4. Process each order via atomic RPC
    let filled = 0;
    let failed = 0;
    const results: { orderId: string; ticker: string; result: string }[] = [];

    for (const order of orders) {
      const price = priceMap.get(order.ticker);
      if (!price) {
        console.log(`No price for ${order.ticker}, marking order ${order.id} FAILED`);
        await supabase.from("orders").update({ status: "FAILED" }).eq("id", order.id);
        failed++;
        results.push({ orderId: order.id, ticker: order.ticker, result: "FAILED: no price" });
        continue;
      }

      console.log(`Processing order ${order.id}: ${order.side} ${order.quantity} ${order.ticker} @ $${price}`);

      const { data: rpcResult, error: rpcError } = await supabase.rpc("fill_queued_order", {
        p_order_id: order.id,
        p_price: price,
      });

      if (rpcError) {
        console.error(`Order ${order.id} RPC error:`, rpcError.message);
        failed++;
        results.push({ orderId: order.id, ticker: order.ticker, result: `FAILED: ${rpcError.message}` });
      } else {
        const status = rpcResult as string;
        console.log(`Order ${order.id} result: ${status}`);
        if (status === "FILLED") {
          filled++;
        } else {
          failed++;
        }
        results.push({ orderId: order.id, ticker: order.ticker, result: status });
      }
    }

    const summary = `Processed ${orders.length} orders: ${filled} filled, ${failed} failed`;
    console.log(summary);

    return new Response(
      JSON.stringify({ message: summary, results }),
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
