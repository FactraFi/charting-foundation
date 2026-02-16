import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Yahoo Finance live price ─────────────────────── */
async function fetchYahooPrice(ticker: string) {
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
  const volume = meta.regularMarketVolume ?? 0;
  return {
    current_price: price,
    previous_close: prevClose,
    day_change_pct: Math.round(changePct * 100) / 100,
    volume,
  };
}

/* ── Alpha Vantage company overview ───────────────── */
async function fetchAlphaOverview(ticker: string, apiKey: string) {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage error ${res.status}`);
  const d = await res.json();
  if (d.Note || d["Error Message"] || !d.Symbol) return null;
  return {
    name: d.Name ?? ticker,
    sector: d.Sector ?? "",
    industry: d.Industry ?? "",
    market_cap: formatMarketCap(d.MarketCapitalization),
    pe_ratio: parseFloat(d.PERatio) || null,
    forward_pe: parseFloat(d.ForwardPE) || null,
    debt_to_equity: parseFloat(d.DebtToEquityRatio ?? "0") / 100 || null,
    roe: d.ReturnOnEquityTTM ? `${(parseFloat(d.ReturnOnEquityTTM) * 100).toFixed(1)}%` : null,
    roce: d.ReturnOnAssetsTTM ? `${(parseFloat(d.ReturnOnAssetsTTM) * 100).toFixed(1)}%` : null,
    dividend_yield: parseFloat(d.DividendYield) ? parseFloat(d.DividendYield) * 100 : null,
    year_change: d["52WeekHigh"] && d["52WeekLow"] ? null : null,
    profit_margin: d.ProfitMargin ? `${(parseFloat(d.ProfitMargin) * 100).toFixed(1)}%` : null,
    operating_margin: d.OperatingMarginTTM ? `${(parseFloat(d.OperatingMarginTTM) * 100).toFixed(1)}%` : null,
    revenue_growth: d.QuarterlyRevenueGrowthYOY ? `${(parseFloat(d.QuarterlyRevenueGrowthYOY) * 100).toFixed(1)}%` : null,
    eps_growth: d.QuarterlyEarningsGrowthYOY ? `${(parseFloat(d.QuarterlyEarningsGrowthYOY) * 100).toFixed(1)}%` : null,
    beta: parseFloat(d.Beta) || null,
    analyst_target: parseFloat(d.AnalystTargetPrice) || null,
    analyst_rating: d.AnalystRatingStrongBuy ? calculateAnalystScore(d) : null,
  };
}

function calculateAnalystScore(d: Record<string, string>) {
  const sb = parseInt(d.AnalystRatingStrongBuy || "0");
  const b = parseInt(d.AnalystRatingBuy || "0");
  const h = parseInt(d.AnalystRatingHold || "0");
  const s = parseInt(d.AnalystRatingSell || "0");
  const ss = parseInt(d.AnalystRatingStrongSell || "0");
  const total = sb + b + h + s + ss;
  if (!total) return null;
  const weighted = (sb * 5 + b * 4 + h * 3 + s * 2 + ss * 1) / total;
  return Math.round(weighted * 10) / 10;
}

function formatMarketCap(val: string | undefined): string {
  if (!val) return "N/A";
  const n = parseFloat(val);
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return val;
}

function deriveSignal(vScore: number | null, changePct: number): string {
  if (vScore === null) return changePct >= 0 ? "Neutral" : "Caution";
  if (vScore >= 85) return "Strong Buy";
  if (vScore >= 70) return "Buy";
  if (vScore >= 50) return "Hold";
  if (vScore >= 30) return "Sell";
  return "Strong Sell";
}

/* ── Main handler ─────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ticker = (url.searchParams.get("ticker") || "").toUpperCase().trim();
    if (!ticker) {
      return new Response(JSON.stringify({ error: "ticker parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALPHA_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Parallel: Yahoo price + DB scores + Alpha overview
    const [priceResult, scoresResult, alphaResult] = await Promise.allSettled([
      fetchYahooPrice(ticker),
      sb.from("stock_scores").select("*").eq("ticker", ticker).maybeSingle(),
      ALPHA_KEY ? fetchAlphaOverview(ticker, ALPHA_KEY) : Promise.resolve(null),
    ]);

    const price = priceResult.status === "fulfilled" ? priceResult.value : null;
    const scores = scoresResult.status === "fulfilled" ? scoresResult.value.data : null;
    const alpha = alphaResult.status === "fulfilled" ? alphaResult.value : null;

    if (!price) {
      return new Response(JSON.stringify({ error: `Could not fetch price for ${ticker}` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasScores = !!scores?.v_score;

    // Upsert to stock_universe for future search
    if (alpha) {
      sb.from("stock_universe")
        .upsert(
          {
            ticker,
            name: alpha.name,
            sector: alpha.sector,
            industry: alpha.industry,
            market_cap: alpha.market_cap,
          },
          { onConflict: "ticker" }
        )
        .then(() => {});
    }

    const response = {
      ticker,
      name: scores?.name || alpha?.name || ticker,
      sector: scores?.sector || alpha?.sector || "",
      industry: scores?.industry || alpha?.industry || "",
      current_price: price.current_price,
      day_change_pct: price.day_change_pct,
      volume: price.volume,
      previous_close: price.previous_close,
      market_cap: alpha?.market_cap || "N/A",
      pe_ratio: alpha?.pe_ratio || null,
      forward_pe: alpha?.forward_pe || null,
      debt_to_equity: alpha?.debt_to_equity || null,
      roe: alpha?.roe || null,
      roce: alpha?.roce || null,
      dividend_yield: alpha?.dividend_yield || null,
      profit_margin: alpha?.profit_margin || null,
      operating_margin: alpha?.operating_margin || null,
      revenue_growth: alpha?.revenue_growth || null,
      eps_growth: alpha?.eps_growth || null,
      beta: alpha?.beta || null,
      analyst_target: alpha?.analyst_target || null,
      analyst_rating: alpha?.analyst_rating || null,
      year_change: null,
      v_score: scores?.v_score ?? null,
      fundamentals: scores?.fundamentals ?? null,
      momentum: scores?.momentum ?? null,
      risk: scores?.risk ?? null,
      sentiment: scores?.sentiment ?? null,
      signal: deriveSignal(scores?.v_score ?? null, price.day_change_pct),
      has_scores: hasScores,
      why_explanation: scores?.why_explanation || null,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stock-data error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
