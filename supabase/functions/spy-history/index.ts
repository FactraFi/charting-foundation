import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache freshness: is most recent fetched_at < 12 hours ago?
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("spy_daily_cache")
      .select("fetched_at")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isFresh = recent && recent.fetched_at > twelveHoursAgo;

    if (!isFresh) {
      // Fetch 30 days of SPY from Yahoo Finance
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/SPY?period1=${thirtyDaysAgo}&period2=${now}&interval=1d`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

      if (res.ok) {
        const json = await res.json();
        const result = json.chart?.result?.[0];
        const timestamps: number[] = result?.timestamp ?? [];
        const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];

        const rows = timestamps
          .map((ts, i) => ({
            date: new Date(ts * 1000).toISOString().split("T")[0],
            close_price: closes[i],
            fetched_at: new Date().toISOString(),
          }))
          .filter((r) => r.close_price != null);

        if (rows.length > 0) {
          // Upsert into cache
          const { error: upsertErr } = await supabase
            .from("spy_daily_cache")
            .upsert(rows, { onConflict: "date" });
          if (upsertErr) console.error("Cache upsert error:", upsertErr);
        }
      } else {
        console.error("Yahoo SPY fetch failed:", res.status);
      }
    }

    // Return cached data
    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const { data: prices, error } = await supabase
      .from("spy_daily_cache")
      .select("date, close_price")
      .gte("date", thirtyDaysAgoDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ prices: prices ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("spy-history error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
