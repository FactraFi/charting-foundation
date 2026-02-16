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
    const url = new URL(req.url);
    const query = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 20);

    if (!query || query.length < 1) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Search local stock_universe first (case-insensitive)
    const upperQ = query.toUpperCase();
    const { data: localResults } = await sb
      .from("stock_universe")
      .select("ticker, name, sector, industry, market_cap")
      .or(`ticker.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(limit);

    const results = (localResults || []).map((r) => ({
      ticker: r.ticker,
      name: r.name || r.ticker,
      sector: r.sector || "",
      industry: r.industry || "",
    }));

    // If not enough local results, try Alpha Vantage SYMBOL_SEARCH
    if (results.length < limit) {
      const ALPHA_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
      if (ALPHA_KEY) {
        try {
          const avUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_KEY}`;
          const avRes = await fetch(avUrl);
          if (avRes.ok) {
            const avData = await avRes.json();
            const matches = avData.bestMatches || [];
            const existingTickers = new Set(results.map((r) => r.ticker));

            for (const match of matches) {
              if (results.length >= limit) break;
              const t = match["1. symbol"];
              const region = match["4. region"];
              // Only US stocks
              if (region !== "United States" && region !== "United States/Canada") continue;
              if (existingTickers.has(t)) continue;
              // Skip tickers with dots (preferred shares etc)
              if (t.includes(".")) continue;

              const entry = {
                ticker: t,
                name: match["2. name"] || t,
                sector: "",
                industry: "",
              };
              results.push(entry);
              existingTickers.add(t);

              // Auto-insert into stock_universe for future lookups (fire and forget)
              sb.from("stock_universe")
                .upsert(
                  { ticker: t, name: entry.name, sector: "", industry: "" },
                  { onConflict: "ticker" }
                )
                .then(() => {});
            }
          }
        } catch (e) {
          console.error("Alpha Vantage search error:", e);
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stock-search error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
