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
    const RAILWAY_DOMAIN = Deno.env.get("RAILWAY_DOMAIN");
    if (!RAILWAY_DOMAIN) {
      return new Response(JSON.stringify({ error: "RAILWAY_DOMAIN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const railwayUrl = `${RAILWAY_DOMAIN.startsWith("http") ? RAILWAY_DOMAIN : `https://${RAILWAY_DOMAIN}`}/calculate-scores`;
    console.log(`Triggering Railway engine at: ${railwayUrl}`);

    const res = await fetch(railwayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "lovable-wakeup" }),
    });

    const body = await res.text();
    console.log(`Railway response: ${res.status} - ${body.substring(0, 500)}`);

    return new Response(
      JSON.stringify({
        success: res.ok,
        status: res.status,
        message: res.ok ? "Railway engine triggered successfully" : `Railway returned ${res.status}`,
        response_preview: body.substring(0, 500),
      }),
      {
        status: res.ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("trigger-railway error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
