import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stock } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Stock: ${stock.ticker} (${stock.name})
Price: $${stock.current_price}, Day Change: ${stock.day_change_pct}%
Signal: ${stock.signal}, V-Score: ${stock.v_score ?? 'N/A'}/100
Fundamentals: ${stock.fundamentals ?? 'N/A'}/100, Momentum: ${stock.momentum ?? 'N/A'}/100
Risk: ${stock.risk ?? 'N/A'}/100, Sentiment: ${stock.sentiment ?? 'N/A'}/100
P/E: ${stock.pe_ratio ?? 'N/A'}, Beta: ${stock.beta ?? 'N/A'}
Analyst Rating: ${stock.analyst_rating ?? 'N/A'}/5

In 50 words or fewer, give a plain-English analyst takeaway: what is the investment case or concern for this stock right now? Focus on outlook, key drivers, and catalysts. Do NOT restate raw scores or numbers. No disclaimers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a concise equity analyst. Provide actionable takeaways in plain English. Never restate raw scores or numbers the user can already see. Return only the summary text." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "stock_summary",
              description: "Return a concise stock summary.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "50-word max plain-English analyst takeaway focusing on outlook and key drivers" },
                },
                required: ["summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "stock_summary" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let summary: string;

    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      summary = args.summary;
    } else {
      summary = data.choices?.[0]?.message?.content?.trim() ?? "Summary unavailable.";
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stock-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
