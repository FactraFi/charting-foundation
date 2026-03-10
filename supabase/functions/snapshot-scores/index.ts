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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }

    const backfillDays = body.backfill_days || 0; // e.g. 19 to seed history

    // Fetch all current scores
    const { data: scores, error } = await sb
      .from("stock_scores")
      .select("ticker, v_score, fundamentals, momentum, risk, sentiment")
      .not("v_score", "is", null);

    if (error) throw error;
    if (!scores || scores.length === 0) {
      return new Response(JSON.stringify({ message: "No scores to snapshot", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    let totalInserted = 0;

    // If backfill mode, create synthetic history for past N days
    const daysToProcess = backfillDays > 0 ? backfillDays : 0;

    for (let dayOffset = daysToProcess; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split("T")[0];

      const rows = scores.map((s: any) => {
        // For backfill days (not today), apply small random variations
        const jitter = dayOffset > 0;
        const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
        const vary = (v: number | null) => {
          if (v === null) return null;
          if (!jitter) return v;
          // More variation for older days
          const spread = Math.min(8, 2 + dayOffset * 0.3);
          return clamp(v + (Math.random() * spread * 2 - spread));
        };

        return {
          ticker: s.ticker,
          snapshot_date: dateStr,
          v_score: vary(s.v_score),
          fundamentals: vary(s.fundamentals),
          momentum: vary(s.momentum),
          risk: vary(s.risk),
          sentiment: vary(s.sentiment),
        };
      });

      // Batch upsert in chunks of 500
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error: upsertErr } = await sb
          .from("score_history")
          .upsert(chunk, { onConflict: "ticker,snapshot_date" });
        if (upsertErr) {
          console.error(`Upsert error for ${dateStr}:`, upsertErr);
        } else {
          totalInserted += chunk.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Snapshot complete. ${totalInserted} records upserted across ${daysToProcess + 1} days.`,
        processed: totalInserted,
        days: daysToProcess + 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("snapshot-scores error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
