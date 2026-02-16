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
    const { stock } = await req.json();
    if (!stock?.ticker) {
      return new Response(JSON.stringify({ error: "stock data required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a financial analyst. Given this stock data, produce a structured breakdown for the "Why This Score?" section.

Stock: ${stock.name} (${stock.ticker})
Sector: ${stock.sector} | Industry: ${stock.industry}
V-Score: ${stock.v_score}/100
Why Explanation: ${stock.why_explanation || "No explanation available."}

Pillar Scores:
- Fundamentals: ${stock.fundamentals ?? "N/A"}/100
- Momentum: ${stock.momentum ?? "N/A"}/100
- Risk: ${stock.risk ?? "N/A"}/100
- Sentiment: ${stock.sentiment ?? "N/A"}/100

Key Metrics:
- P/E: ${stock.pe_ratio ?? "N/A"}
- Forward P/E: ${stock.forward_pe ?? "N/A"}
- D/E: ${stock.debt_to_equity ?? "N/A"}
- ROE: ${stock.roe ?? "N/A"}
- Profit Margin: ${stock.profit_margin ?? "N/A"}
- Revenue Growth: ${stock.revenue_growth ?? "N/A"}
- Beta: ${stock.beta ?? "N/A"}
- Analyst Target: $${stock.analyst_target ?? "N/A"}
- Analyst Rating: ${stock.analyst_rating ?? "N/A"}
- Day Change: ${stock.day_change_pct}%
- Signal: ${stock.signal}

Elaborate the why_explanation into a rich, specific summary and 4 pillar breakdowns. Each pillar should have 1-3 bullets with a short bold label and a concise explanation incorporating the actual metrics. Be specific with numbers, don't be generic.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a concise financial analyst. Return structured data via the provided tool." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "why_score_breakdown",
              description: "Return structured pillar breakdown for a stock's V-Score.",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "1-2 sentence elaborated summary of why the stock has this score. Include the score number.",
                  },
                  fundamentals: {
                    type: "object",
                    properties: {
                      bullets: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string", description: "Short bold label like 'Financial Health' or 'Key Metrics'" },
                            text: { type: "string", description: "1-2 sentence explanation with specific numbers" },
                          },
                          required: ["label", "text"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["bullets"],
                    additionalProperties: false,
                  },
                  momentum: {
                    type: "object",
                    properties: {
                      bullets: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            text: { type: "string" },
                          },
                          required: ["label", "text"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["bullets"],
                    additionalProperties: false,
                  },
                  risk: {
                    type: "object",
                    properties: {
                      bullets: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            text: { type: "string" },
                          },
                          required: ["label", "text"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["bullets"],
                    additionalProperties: false,
                  },
                  sentiment: {
                    type: "object",
                    properties: {
                      bullets: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            text: { type: "string" },
                          },
                          required: ["label", "text"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["bullets"],
                    additionalProperties: false,
                  },
                },
                required: ["summary", "fundamentals", "momentum", "risk", "sentiment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "why_score_breakdown" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const breakdown = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(breakdown), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("why-score error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
