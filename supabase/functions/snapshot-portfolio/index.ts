import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchYahooPrice(ticker: string): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Yahoo error ${res.status} for ${ticker}`);
  const json = await res.json();
  return json.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get all profiles (includes cash-only users)
    const { data: profiles, error: pErr } = await sb
      .from("profiles")
      .select("id, cash_balance");
    if (pErr) throw pErr;

    // Get all holdings
    const { data: holdingsData, error: hErr } = await sb
      .from("holdings")
      .select("user_id, ticker, shares");
    if (hErr) throw hErr;

    // Group holdings by user
    const userHoldings = new Map<string, { ticker: string; shares: number }[]>();
    for (const h of holdingsData ?? []) {
      if (!userHoldings.has(h.user_id)) userHoldings.set(h.user_id, []);
      userHoldings.get(h.user_id)!.push({ ticker: h.ticker, shares: h.shares });
    }

    // Fetch all unique ticker prices in parallel
    const allTickers = [...new Set((holdingsData ?? []).map((h) => h.ticker))];
    const priceMap = new Map<string, number>();
    const priceResults = await Promise.allSettled(
      allTickers.map(async (t) => {
        const price = await fetchYahooPrice(t);
        return { ticker: t, price };
      })
    );
    for (const r of priceResults) {
      if (r.status === "fulfilled") priceMap.set(r.value.ticker, r.value.price);
    }

    // Build upsert rows for ALL users
    const today = new Date().toISOString().split("T")[0];
    const rows = (profiles ?? []).map((p) => {
      const holdings = userHoldings.get(p.id) ?? [];
      const invested = holdings.reduce((sum, h) => {
        const price = priceMap.get(h.ticker) ?? 0;
        return sum + price * h.shares;
      }, 0);
      const cash = p.cash_balance ?? 0;
      return {
        user_id: p.id,
        date: today,
        total_net_liquidity: cash + invested,
      };
    });

    if (rows.length > 0) {
      const { error: uErr } = await sb
        .from("portfolio_history")
        .upsert(rows, { onConflict: "user_id,date" });
      if (uErr) throw uErr;
    }

    return new Response(
      JSON.stringify({ success: true, snapshots: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("snapshot-portfolio error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
