const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PriceData {
  current_price: number;
  previous_close: number;
  day_change_pct: number;
  volume: number;
}

async function fetchYahooPrice(ticker: string): Promise<PriceData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status}`);
  const json = await res.json();
  const meta = json.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("No Yahoo data");
  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  return {
    current_price: price,
    previous_close: prevClose,
    day_change_pct: Math.round(changePct * 100) / 100,
    volume: meta.regularMarketVolume ?? 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tickersParam = url.searchParams.get("tickers") || "";
    const tickers = tickersParam
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 50); // Cap at 50

    if (tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: "tickers parameter required (comma-separated)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all prices in parallel
    const results = await Promise.allSettled(
      tickers.map((t) => fetchYahooPrice(t).then((data) => ({ ticker: t, ...data })))
    );

    const prices: Record<string, PriceData> = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        const { ticker, ...data } = r.value;
        prices[ticker] = data;
      }
    }

    return new Response(JSON.stringify(prices), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stock-prices error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
