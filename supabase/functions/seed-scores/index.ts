import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// S&P 500 tickers (core subset — most liquid)
const SP500_TICKERS = [
  "AAPL","MSFT","AMZN","NVDA","GOOGL","META","TSLA","BRK.B","UNH","XOM",
  "JNJ","JPM","V","PG","MA","HD","CVX","MRK","ABBV","LLY",
  "PEP","KO","AVGO","COST","TMO","MCD","WMT","CSCO","ACN","ABT",
  "DHR","NEE","LIN","TXN","PM","UNP","LOW","RTX","HON","AMGN",
  "IBM","INTC","QCOM","CAT","BA","GE","SBUX","AMD","INTU","ISRG",
  "ADI","MDLZ","GILD","SYK","BLK","ADP","BKNG","VRTX","REGN","MMC",
  "PLD","CI","CB","SO","DUK","CL","MO","ZTS","TGT","BDX",
  "CME","SHW","SCHW","FIS","EQIX","ITW","PNC","USB","AON","NOC",
  "MMM","EMR","NSC","APD","WM","ICE","GD","TJX","CCI","SRE",
  "MCK","HUM","F","GM","ORCL","CRM","NOW","ADBE","PYPL","NFLX",
  "ABNB","UBER","SQ","SNOW","PLTR","RIVN","LCID","COIN","HOOD","SOFI",
  "DIS","CMCSA","T","VZ","TMUS","CHTR","NXPI","MRVL","ON","LRCX",
  "AMAT","KLAC","MU","SNPS","CDNS","PANW","CRWD","FTNT","ZS","NET",
  "DDOG","MNST","MRNA","PFE","BMY","BIIB","AZN","NVO","LLY","SHOP",
  "SE","MELI","NU","GRAB","BABA","JD","PDD","NIO","LI","XPEV",
  "WFC","GS","MS","C","BAC","AXP","COF","DFS","ALLY","SYF",
  "DE","CMI","PCAR","DAL","UAL","LUV","AAL","MAR","HLT","WYNN",
  "LULU","NKE","DECK","CROX","TPR","EL","PVH","RL","VFC","HBI",
  "SPY","QQQ","DIA","IWM","VTI","VOO","ARKK","XLF","XLE","XLK",
  "SMCI","ARM","MSTR","CELH","HIMS","DUOL","RKLB","AFRM","UPST","ASTS",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Scoring logic (same as stock-data) ───────────── */
function calculateVScore(d: any, currentPrice: number) {
  const pe = parseFloat(d.PERatio) || null;
  let peScore = 50;
  if (pe !== null) {
    if (pe > 0 && pe <= 10) peScore = 70;
    else if (pe <= 15) peScore = 90;
    else if (pe <= 20) peScore = 100;
    else if (pe <= 25) peScore = 80;
    else if (pe <= 35) peScore = 60;
    else if (pe <= 50) peScore = 40;
    else peScore = 20;
  }

  const roeVal = (parseFloat(d.ReturnOnEquityTTM) || 0) * 100;
  const roeScore = Math.min(100, Math.max(0, roeVal * 2));
  const pmVal = (parseFloat(d.ProfitMargin) || 0) * 100;
  const pmScore = Math.min(100, Math.max(0, pmVal * 3));
  const rgVal = (parseFloat(d.QuarterlyRevenueGrowthYOY) || 0) * 100;
  const rgScore = Math.min(100, Math.max(0, rgVal * 4));
  const de = (parseFloat(d.DebtToEquityRatio ?? "0") || 0) / 100;
  const deScore = Math.max(0, 100 - de * 30);

  const fundamentals = Math.round(peScore * 0.25 + roeScore * 0.25 + pmScore * 0.2 + rgScore * 0.15 + deScore * 0.15);

  const high52 = parseFloat(d["52WeekHigh"]) || 0;
  const low52 = parseFloat(d["52WeekLow"]) || 0;
  let positionScore = 50;
  if (high52 && low52 && currentPrice) {
    const range = high52 - low52;
    if (range > 0) positionScore = Math.min(100, Math.max(0, Math.round(((currentPrice - low52) / range) * 100)));
  }
  const beta = parseFloat(d.Beta) || 1;
  const betaMomScore = (beta >= 0.8 && beta <= 1.2) ? 90 : (beta >= 0.5 && beta <= 1.5) ? 70 : 40;
  const momentum = Math.round(positionScore * 0.6 + betaMomScore * 0.4);

  const betaPenalty = Math.abs(beta - 1) * 30;
  const debtPenalty = de > 2 ? 30 : de > 1 ? 15 : 0;
  const risk = Math.round(Math.max(0, Math.min(100, 100 - betaPenalty - debtPenalty)));

  const analystRating = calculateAnalystRating(d);
  const analystScore = analystRating !== null ? Math.round(((analystRating - 1) / 4) * 100) : 50;
  const target = parseFloat(d.AnalystTargetPrice) || 0;
  let targetScore = 50;
  if (target && currentPrice > 0) {
    targetScore = Math.min(100, Math.max(0, Math.round(((target - currentPrice) / currentPrice) * 200)));
  }
  const sentiment = Math.round(analystScore * 0.5 + targetScore * 0.5);

  const vScore = Math.round(fundamentals * 0.30 + momentum * 0.25 + risk * 0.20 + sentiment * 0.25);

  const name = d.Name || d.Symbol || "";
  const parts: string[] = [];
  if (fundamentals >= 70) parts.push("strong fundamentals");
  else if (fundamentals < 40) parts.push("weak fundamentals");
  if (momentum >= 70) parts.push("positive momentum");
  if (risk >= 70) parts.push("low risk");
  if (sentiment >= 70) parts.push("bullish sentiment");

  return {
    v_score: Math.min(100, Math.max(0, vScore)),
    fundamentals: Math.min(100, Math.max(0, fundamentals)),
    momentum: Math.min(100, Math.max(0, momentum)),
    risk: Math.min(100, Math.max(0, risk)),
    sentiment: Math.min(100, Math.max(0, sentiment)),
    why_explanation: `${name} scores ${vScore}/100${parts.length ? ` driven by ${parts.join(", ")}` : ""}.`,
    name,
    sector: d.Sector || "",
    industry: d.Industry || "",
  };
}

function calculateAnalystRating(d: any) {
  const sb = parseInt(d.AnalystRatingStrongBuy || "0");
  const b = parseInt(d.AnalystRatingBuy || "0");
  const h = parseInt(d.AnalystRatingHold || "0");
  const s = parseInt(d.AnalystRatingSell || "0");
  const ss = parseInt(d.AnalystRatingStrongSell || "0");
  const total = sb + b + h + s + ss;
  if (!total) return null;
  return (sb * 5 + b * 4 + h * 3 + s * 2 + ss * 1) / total;
}

function formatMarketCap(val: string | undefined): string {
  if (!val) return "N/A";
  const n = parseFloat(val);
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return val;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALPHA_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
    if (!ALPHA_KEY) {
      return new Response(JSON.stringify({ error: "ALPHA_VANTAGE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Parse request body for options
    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }

    const mode = body.mode || "seed"; // "seed" or "refresh"
    const batchSize = Math.min(body.batch_size || 55, 60); // stay under 75 req/min
    const offset = body.offset || 0;

    let tickers: string[];

    if (mode === "refresh") {
      // Refresh stale scores (older than 24h)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: stale } = await sb
        .from("stock_scores")
        .select("ticker")
        .lt("updated_at", cutoff)
        .limit(batchSize);
      tickers = (stale || []).map((r: any) => r.ticker);
    } else {
      // Seed mode: process a slice of S&P 500
      tickers = SP500_TICKERS.slice(offset, offset + batchSize);
    }

    if (tickers.length === 0) {
      return new Response(JSON.stringify({ message: "No tickers to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${tickers.length} tickers (mode=${mode}, offset=${offset})`);

    let processed = 0;
    let errors = 0;

    for (const ticker of tickers) {
      try {
        // Fetch Alpha Vantage overview
        const avUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_KEY}`;
        const res = await fetch(avUrl);
        const d = await res.json();

        if (d.Note) {
          console.log("Rate limited, stopping batch");
          break;
        }

        if (d["Error Message"] || !d.Symbol) {
          errors++;
          await sleep(1000);
          continue;
        }

        // Get a rough current price from Alpha Vantage data (use analyst target as proxy or 0)
        const currentPrice = parseFloat(d.AnalystTargetPrice) || parseFloat(d["50DayMovingAverage"]) || 0;

        const scores = calculateVScore(d, currentPrice);

        // Upsert scores
        await sb.from("stock_scores").upsert(
          {
            ticker,
            name: scores.name,
            sector: scores.sector,
            industry: scores.industry,
            v_score: scores.v_score,
            fundamentals: scores.fundamentals,
            momentum: scores.momentum,
            risk: scores.risk,
            sentiment: scores.sentiment,
            why_explanation: scores.why_explanation,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ticker" }
        );

        // Also upsert to stock_universe
        await sb.from("stock_universe").upsert(
          {
            ticker,
            name: scores.name,
            sector: scores.sector,
            industry: scores.industry,
            market_cap: formatMarketCap(d.MarketCapitalization),
          },
          { onConflict: "ticker" }
        );

        processed++;
        // Rate limit: ~1 request/second to stay well under 75/min
        await sleep(1100);
      } catch (err) {
        console.error(`Error processing ${ticker}:`, err);
        errors++;
        await sleep(1000);
      }
    }

    const nextOffset = offset + batchSize;
    const hasMore = mode === "seed" && nextOffset < SP500_TICKERS.length;

    return new Response(
      JSON.stringify({
        message: `Batch complete. Processed ${processed}, errors ${errors}.`,
        processed,
        errors,
        next_offset: hasMore ? nextOffset : null,
        total_tickers: SP500_TICKERS.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("seed-scores error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
