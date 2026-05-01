// Find similar marketplace items using Lovable AI semantic ranking.
// Public endpoint (no auth required) — only reads publicly-shared items.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CandidateItem {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  sharing_price: number | null;
  condition: string | null;
  brand: string | null;
  tags: string[] | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");
    const limitParam = parseInt(url.searchParams.get("limit") || "4", 10);
    const limit = Math.min(Math.max(limitParam, 1), 8);

    if (!itemId) {
      return new Response(JSON.stringify({ error: "itemId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the target item
    const { data: target, error: targetErr } = await supabase
      .from("inventory_items")
      .select("id, name, description, category_id, sharing_price, condition, brand, tags")
      .eq("id", itemId)
      .maybeSingle();

    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build candidate pool: publicly shareable items, excluding the target
    let candidatesQuery = supabase
      .from("inventory_items")
      .select("id, name, description, category_id, sharing_price, condition, brand, tags")
      .eq("is_available_for_sharing", true)
      .eq("is_donated", false)
      .eq("is_sold", false)
      .eq("is_eliminated", false)
      .neq("id", itemId)
      .limit(60);

    // Prefer same category if known to keep the prompt focused & cheap
    if (target.category_id) {
      candidatesQuery = candidatesQuery.eq("category_id", target.category_id);
    }

    let { data: candidates } = await candidatesQuery;

    // Fallback: if same-category pool is too small, broaden to all items
    if (!candidates || candidates.length < limit) {
      const { data: broad } = await supabase
        .from("inventory_items")
        .select("id, name, description, category_id, sharing_price, condition, brand, tags")
        .eq("is_available_for_sharing", true)
        .eq("is_donated", false)
        .eq("is_sold", false)
        .eq("is_eliminated", false)
        .neq("id", itemId)
        .limit(60);
      candidates = broad || [];
    }

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ ids: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If candidate pool is small, just return them all (skip AI call)
    if (candidates.length <= limit) {
      return new Response(
        JSON.stringify({ ids: candidates.map((c: CandidateItem) => c.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Compose AI ranking request via Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fall back to first N candidates if AI key missing
      return new Response(
        JSON.stringify({ ids: candidates.slice(0, limit).map((c: CandidateItem) => c.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetSummary = {
      name: target.name,
      description: target.description,
      brand: target.brand,
      condition: target.condition,
      tags: target.tags,
      price: target.sharing_price,
    };

    const candidateSummaries = (candidates as CandidateItem[]).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      brand: c.brand,
      condition: c.condition,
      tags: c.tags,
      price: c.sharing_price,
    }));

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You rank product listings by how similar they are to a target product. Consider product type, intended use, brand affinity, price range, and condition. Return only the most relevant alternatives a shopper would also consider.",
          },
          {
            role: "user",
            content: `TARGET PRODUCT:\n${JSON.stringify(targetSummary)}\n\nCANDIDATES:\n${JSON.stringify(candidateSummaries)}\n\nReturn the top ${limit} most similar candidates by id, ranked best first.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_similar",
              description: "Return the ranked ids of the most similar candidates.",
              parameters: {
                type: "object",
                properties: {
                  ids: {
                    type: "array",
                    items: { type: "string" },
                    description: `Top ${limit} candidate ids, ranked best first.`,
                  },
                },
                required: ["ids"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_similar" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429 || aiResp.status === 402) {
        // Graceful fallback: return first N candidates
        return new Response(
          JSON.stringify({
            ids: candidates.slice(0, limit).map((c: CandidateItem) => c.id),
            fallback: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      return new Response(
        JSON.stringify({
          ids: candidates.slice(0, limit).map((c: CandidateItem) => c.id),
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let rankedIds: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        if (Array.isArray(parsed.ids)) rankedIds = parsed.ids;
      } catch (e) {
        console.error("Failed to parse tool call args", e);
      }
    }

    // Validate ids exist in candidate pool, then trim
    const candidateIds = new Set(candidates.map((c: CandidateItem) => c.id));
    rankedIds = rankedIds.filter((id) => candidateIds.has(id)).slice(0, limit);

    // Pad with remaining candidates if AI returned too few
    if (rankedIds.length < limit) {
      for (const c of candidates as CandidateItem[]) {
        if (rankedIds.length >= limit) break;
        if (!rankedIds.includes(c.id)) rankedIds.push(c.id);
      }
    }

    return new Response(JSON.stringify({ ids: rankedIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-similar-items error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
