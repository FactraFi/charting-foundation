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
  const [overviewRes, balanceRes] = await Promise.all([
    fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`),
    fetch(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`),
  ]);
  if (!overviewRes.ok) throw new Error(`Alpha Vantage error ${overviewRes.status}`);
  const d = await overviewRes.json();
  if (d.Note || d["Error Message"] || !d.Symbol) return null;

  // Calculate D/E from balance sheet
  let debtToEquity: number | null = null;
  try {
    const bs = await balanceRes.json();
    const latest = bs?.quarterlyReports?.[0] ?? bs?.annualReports?.[0];
    if (latest) {
      const totalLiabilities = parseFloat(latest.totalLiabilities);
      const equity = parseFloat(latest.totalShareholderEquity);
      if (equity > 0 && !isNaN(totalLiabilities) && !isNaN(equity)) {
        debtToEquity = Math.round((totalLiabilities / equity) * 100) / 100;
      }
    }
  } catch { /* balance sheet unavailable */ }

  return {
    name: d.Name ?? ticker,
    sector: d.Sector ?? "",
    industry: d.Industry ?? "",
    market_cap: formatMarketCap(d.MarketCapitalization),
    pe_ratio: parseFloat(d.PERatio) || null,
    forward_pe: parseFloat(d.ForwardPE) || null,
    debt_to_equity: debtToEquity,
    roe: d.ReturnOnEquityTTM ? `${(parseFloat(d.ReturnOnEquityTTM) * 100).toFixed(1)}%` : null,
    roce: d.ReturnOnAssetsTTM ? `${(parseFloat(d.ReturnOnAssetsTTM) * 100).toFixed(1)}%` : null,
    dividend_yield: parseFloat(d.DividendYield) ? parseFloat(d.DividendYield) * 100 : null,
    profit_margin: d.ProfitMargin ? `${(parseFloat(d.ProfitMargin) * 100).toFixed(1)}%` : null,
    operating_margin: d.OperatingMarginTTM ? `${(parseFloat(d.OperatingMarginTTM) * 100).toFixed(1)}%` : null,
    revenue_growth: d.QuarterlyRevenueGrowthYOY ? `${(parseFloat(d.QuarterlyRevenueGrowthYOY) * 100).toFixed(1)}%` : null,
    eps_growth: d.QuarterlyEarningsGrowthYOY ? `${(parseFloat(d.QuarterlyEarningsGrowthYOY) * 100).toFixed(1)}%` : null,
    beta: parseFloat(d.Beta) || null,
    analyst_target: parseFloat(d.AnalystTargetPrice) || null,
    analyst_rating: d.AnalystRatingStrongBuy ? calculateAnalystScore(d) : null,
    // Raw values for scoring
    _raw_roe: parseFloat(d.ReturnOnEquityTTM) || null,
    _raw_profit_margin: parseFloat(d.ProfitMargin) || null,
    _raw_revenue_growth: parseFloat(d.QuarterlyRevenueGrowthYOY) || null,
    _raw_52wk_high: parseFloat(d["52WeekHigh"]) || null,
    _raw_52wk_low: parseFloat(d["52WeekLow"]) || null,
    _raw_debt_to_equity_ratio: debtToEquity,
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

/* ── On-Demand V-Score Calculator ─────────────────── */
function calculateVScore(alpha: any, currentPrice: number) {
  // --- Fundamentals (30%) ---
  let peScore = 50;
  if (alpha.pe_ratio !== null) {
    const pe = alpha.pe_ratio;
    if (pe > 0 && pe <= 10) peScore = 70;
    else if (pe <= 15) peScore = 90;
    else if (pe <= 20) peScore = 100;
    else if (pe <= 25) peScore = 80;
    else if (pe <= 35) peScore = 60;
    else if (pe <= 50) peScore = 40;
    else peScore = 20;
  }

  const roeVal = alpha._raw_roe !== null ? alpha._raw_roe * 100 : 0;
  const roeScore = Math.min(100, Math.max(0, roeVal * 2));

  const pmVal = alpha._raw_profit_margin !== null ? alpha._raw_profit_margin * 100 : 0;
  const pmScore = Math.min(100, Math.max(0, pmVal * 3));

  const rgVal = alpha._raw_revenue_growth !== null ? alpha._raw_revenue_growth * 100 : 0;
  const rgScore = Math.min(100, Math.max(0, rgVal * 4));

  const de = alpha._raw_debt_to_equity_ratio ?? 0;
  const deScore = Math.max(0, 100 - de * 30);

  const fundamentals = Math.round(peScore * 0.25 + roeScore * 0.25 + pmScore * 0.2 + rgScore * 0.15 + deScore * 0.15);

  // --- Momentum (25%) ---
  let positionScore = 50;
  if (alpha._raw_52wk_high && alpha._raw_52wk_low && currentPrice) {
    const range = alpha._raw_52wk_high - alpha._raw_52wk_low;
    if (range > 0) {
      positionScore = Math.round(((currentPrice - alpha._raw_52wk_low) / range) * 100);
      positionScore = Math.min(100, Math.max(0, positionScore));
    }
  }

  let betaMomScore = 70;
  if (alpha.beta !== null) {
    const b = alpha.beta;
    if (b >= 0.8 && b <= 1.2) betaMomScore = 90;
    else if (b >= 0.5 && b <= 1.5) betaMomScore = 70;
    else betaMomScore = 40;
  }

  const momentum = Math.round(positionScore * 0.6 + betaMomScore * 0.4);

  // --- Risk (20%) — inverted: lower risk = higher score ---
  let riskScore = 70;
  const betaPenalty = alpha.beta !== null ? Math.abs(alpha.beta - 1) * 30 : 15;
  const debtPenalty = de > 2 ? 30 : de > 1 ? 15 : 0;
  riskScore = Math.round(Math.max(0, Math.min(100, 100 - betaPenalty - debtPenalty)));

  // --- Sentiment (25%) ---
  let analystScore = 50;
  if (alpha.analyst_rating !== null) {
    analystScore = Math.round(((alpha.analyst_rating - 1) / 4) * 100);
  }

  let targetScore = 50;
  if (alpha.analyst_target && currentPrice && currentPrice > 0) {
    const upside = ((alpha.analyst_target - currentPrice) / currentPrice) * 100;
    targetScore = Math.min(100, Math.max(0, Math.round(upside * 2)));
  }

  const sentiment = Math.round(analystScore * 0.5 + targetScore * 0.5);

  // --- V-Score ---
  const vScore = Math.round(fundamentals * 0.30 + momentum * 0.25 + riskScore * 0.20 + sentiment * 0.25);

  // --- Why Explanation ---
  const parts: string[] = [];
  if (fundamentals >= 70) parts.push("strong fundamentals");
  else if (fundamentals < 40) parts.push("weak fundamentals");
  if (momentum >= 70) parts.push("positive momentum");
  else if (momentum < 40) parts.push("weak momentum");
  if (riskScore >= 70) parts.push("low risk profile");
  else if (riskScore < 40) parts.push("elevated risk");
  if (sentiment >= 70) parts.push("bullish sentiment");
  else if (sentiment < 40) parts.push("bearish sentiment");

  const why = parts.length > 0
    ? `${alpha.name} scores ${vScore}/100 driven by ${parts.join(", ")}. Fundamentals: ${fundamentals}, Momentum: ${momentum}, Risk: ${riskScore}, Sentiment: ${sentiment}.`
    : `${alpha.name} scores ${vScore}/100 with balanced metrics across all pillars. Fundamentals: ${fundamentals}, Momentum: ${momentum}, Risk: ${riskScore}, Sentiment: ${sentiment}.`;

  return {
    v_score: Math.min(100, Math.max(0, vScore)),
    fundamentals: Math.min(100, Math.max(0, fundamentals)),
    momentum: Math.min(100, Math.max(0, momentum)),
    risk: Math.min(100, Math.max(0, riskScore)),
    sentiment: Math.min(100, Math.max(0, sentiment)),
    why_explanation: why,
  };
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

    // --- On-demand scoring on cache miss ---
    let finalScores = scores;
    const hasScores = !!scores?.v_score;

    if (!hasScores && alpha) {
      // Calculate V-Score on the fly
      const computed = calculateVScore(alpha, price.current_price);
      finalScores = {
        ticker,
        name: alpha.name,
        sector: alpha.sector,
        industry: alpha.industry,
        ...computed,
        updated_at: new Date().toISOString(),
      };

      // Fire-and-forget upsert to cache
      sb.from("stock_scores")
        .upsert(
          {
            ticker,
            name: alpha.name,
            sector: alpha.sector,
            industry: alpha.industry,
            v_score: computed.v_score,
            fundamentals: computed.fundamentals,
            momentum: computed.momentum,
            risk: computed.risk,
            sentiment: computed.sentiment,
            why_explanation: computed.why_explanation,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ticker" }
        )
        .then(() => {});
    }

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
      name: finalScores?.name || alpha?.name || ticker,
      sector: finalScores?.sector || alpha?.sector || "",
      industry: finalScores?.industry || alpha?.industry || "",
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
      v_score: finalScores?.v_score ?? null,
      fundamentals: finalScores?.fundamentals ?? null,
      momentum: finalScores?.momentum ?? null,
      risk: finalScores?.risk ?? null,
      sentiment: finalScores?.sentiment ?? null,
      signal: deriveSignal(finalScores?.v_score ?? null, price.day_change_pct),
      has_scores: !!(finalScores?.v_score),
      why_explanation: finalScores?.why_explanation || null,
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
