import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, url } = await req.json();
    const userQuery = (query || url || "").toString().trim();
    if (!userQuery) {
      return new Response(JSON.stringify({ error: "query or url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth (optional in demo). Try to get user from JWT.
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabaseAuth.auth.getUser(jwt);
    const userId = userData?.user?.id;

    // Step 1: Use AI to normalize query into product keywords
    const normalizeRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Extract product info from user input (text, description, or URL). Return JSON only.",
          },
          { role: "user", content: `Input: "${userQuery}"\nReturn the core product type, category, and 3-6 keywords for matching against an inventory.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_product",
            description: "Extract product details",
            parameters: {
              type: "object",
              properties: {
                product_name: { type: "string", description: "Concise product name" },
                category: { type: "string", description: "Generic category (e.g. Footwear, Kitchen, Electronics)" },
                keywords: { type: "array", items: { type: "string" }, description: "Lowercase keywords for matching" },
                estimated_price: { type: "number", description: "Estimated retail price USD" },
                estimated_co2_kg: { type: "number", description: "Estimated CO2 footprint of producing this item, kg" },
              },
              required: ["product_name", "keywords", "estimated_price", "estimated_co2_kg"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_product" } },
      }),
    });

    if (!normalizeRes.ok) {
      const t = await normalizeRes.text();
      console.error("AI error", normalizeRes.status, t);
      if (normalizeRes.status === 429 || normalizeRes.status === 402) {
        return new Response(JSON.stringify({ error: normalizeRes.status === 429 ? "Rate limited, try again shortly." : "AI credits exhausted." }), {
          status: normalizeRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const normalizeData = await normalizeRes.json();
    const args = JSON.parse(normalizeData.choices[0].message.tool_calls[0].function.arguments);
    const keywords: string[] = (args.keywords || []).map((k: string) => k.toLowerCase());

    // Step 2: Query owned items
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    let ownedItems: any[] = [];
    let borrowableItems: any[] = [];

    if (userId) {
      const orFilter = keywords.map((k) => `name.ilike.%${k}%,description.ilike.%${k}%`).join(",");
      const { data: owned } = await supabaseAdmin
        .from("inventory_items")
        .select("id, name, description, quantity, location, image_urls, original_price")
        .eq("user_id", userId)
        .eq("is_eliminated", false)
        .or(orFilter)
        .limit(10);
      ownedItems = owned || [];

      // Borrowable from friends
      const { data: friends } = await supabaseAdmin
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      const friendIds = (friends || []).map((f: any) => f.user_id === userId ? f.friend_id : f.user_id);
      if (friendIds.length > 0) {
        const { data: borrow } = await supabaseAdmin
          .from("inventory_items")
          .select("id, name, user_id, image_urls, sharing_price")
          .in("user_id", friendIds)
          .eq("is_available_for_sharing", true)
          .or(orFilter)
          .limit(10);
        borrowableItems = borrow || [];
      }
    }

    // Step 3: Build recommendation
    const ownedQty = ownedItems.reduce((s, i) => s + (i.quantity || 1), 0);
    let recommendation: "skip" | "borrow" | "consider" | "buy" = "buy";
    let reason = "Nothing similar found in your inventory or your friends'. If you truly need it, go ahead.";

    if (ownedQty > 0) {
      recommendation = "skip";
      reason = `You already own ${ownedQty} similar item${ownedQty > 1 ? "s" : ""}. Buying another adds clutter and waste.`;
    } else if (borrowableItems.length > 0) {
      recommendation = "borrow";
      reason = `${borrowableItems.length} friend${borrowableItems.length > 1 ? "s have" : " has"} this available to borrow. Save money and resources.`;
    }

    return new Response(JSON.stringify({
      product: args,
      ownedItems,
      borrowableItems,
      recommendation,
      reason,
      moneySaved: recommendation === "skip" || recommendation === "borrow" ? args.estimated_price : 0,
      co2Saved: recommendation === "skip" || recommendation === "borrow" ? args.estimated_co2_kg : 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("before-you-buy error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
