// Inventory Assistant — conversational add/edit/query of items via Lovable AI tool calling
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; tool_calls?: any[]; name?: string };

// ---------- Tool schemas ----------
const tools = [
  {
    type: "function",
    function: {
      name: "add_items",
      description:
        "Create one or more items in the user's inventory. Use this once you have enough info (at minimum a name for each).",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Items to add. Repeat the same item N times only if user wants distinct rows; otherwise set quantity.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                brand: { type: "string" },
                description: { type: "string" },
                category: { type: "string", description: "Category name (will be matched/created)" },
                color: { type: "string" },
                size: { type: "string" },
                dimensions: { type: "string" },
                quantity: { type: "number" },
                original_price: { type: "number" },
                purchase_date: { type: "string", description: "YYYY-MM-DD" },
                condition: { type: "string", enum: ["new", "like_new", "good", "fair", "poor"] },
                usage_frequency: { type: "string", enum: ["daily", "weekly", "monthly", "rarely", "never"] },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
        },
        required: ["items"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_items",
      description: "Find items the user already owns. Returns up to 25 matches with their ids.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text. Matches name, brand, description." },
          limit: { type: "number" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_item",
      description: "Update a single existing item by its id. Only include fields you want to change.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          brand: { type: "string" },
          description: { type: "string" },
          category: { type: "string", description: "Category name (will be matched/created)" },
          color: { type: "string" },
          size: { type: "string" },
          dimensions: { type: "string" },
          quantity: { type: "number" },
          original_price: { type: "number" },
          purchase_date: { type: "string" },
          condition: { type: "string", enum: ["new", "like_new", "good", "fair", "poor"] },
          usage_frequency: { type: "string", enum: ["daily", "weekly", "monthly", "rarely", "never"] },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_item",
      description: "Delete a single item by its id. Only do this when the user explicitly confirms.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_summary",
      description:
        "Quick overview of the user's inventory: total items, total value, top categories, top brands. Useful to answer general questions.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "save_user_default",
      description:
        "Remember a default preference about the user (e.g., 'shoe_size'='8.5', 'preferred_brand'='Nike') so we don't ask again next time.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
        },
        required: ["key", "value"],
        additionalProperties: false,
      },
    },
  },
];

// ---------- Tool implementations ----------
async function getOrCreateCategory(supa: any, userId: string, name: string): Promise<string | null> {
  if (!name) return null;
  const trimmed = name.trim();
  // Try exact (case-insensitive) match in user's or default categories
  const { data: existing } = await supa
    .from("categories")
    .select("id, name, user_id")
    .ilike("name", trimmed)
    .limit(5);
  if (existing && existing.length) {
    // Prefer user's own
    const own = existing.find((c: any) => c.user_id === userId);
    if (own) return own.id;
    return existing[0].id;
  }
  const { data: created, error } = await supa
    .from("categories")
    .insert({ name: trimmed, user_id: userId })
    .select("id")
    .single();
  if (error) return null;
  return created.id;
}

async function runTool(name: string, args: any, supa: any, userId: string) {
  try {
    switch (name) {
      case "add_items": {
        const items = Array.isArray(args.items) ? args.items : [];
        const results: any[] = [];
        for (const it of items) {
          const category_id = it.category ? await getOrCreateCategory(supa, userId, it.category) : null;
          const row: any = {
            user_id: userId,
            name: it.name,
            brand: it.brand ?? null,
            description: it.description ?? null,
            category_id,
            color: it.color ?? null,
            size: it.size ?? null,
            dimensions: it.dimensions ?? null,
            quantity: it.quantity ?? 1,
            original_price: it.original_price ?? null,
            purchase_date: it.purchase_date ?? null,
            condition: it.condition ?? null,
            usage_frequency: it.usage_frequency ?? null,
            tags: Array.isArray(it.tags) ? it.tags : [],
          };
          const { data, error } = await supa.from("inventory_items").insert(row).select("id, name").single();
          if (error) results.push({ ok: false, name: it.name, error: error.message });
          else results.push({ ok: true, id: data.id, name: data.name });
        }
        return { added: results.filter((r) => r.ok).length, results };
      }

      case "search_items": {
        const q = (args.query || "").trim();
        const limit = Math.min(Math.max(args.limit ?? 10, 1), 25);
        const { data, error } = await supa
          .from("inventory_items")
          .select("id, name, brand, color, size, quantity, condition, original_price, category_id")
          .eq("user_id", userId)
          .or(`name.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(limit);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, items: data ?? [] };
      }

      case "update_item": {
        const { id, category, ...rest } = args;
        const updates: any = { ...rest };
        if (category !== undefined) {
          updates.category_id = await getOrCreateCategory(supa, userId, category);
        }
        const { data, error } = await supa
          .from("inventory_items")
          .update(updates)
          .eq("id", id)
          .eq("user_id", userId)
          .select("id, name")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, id: data.id, name: data.name };
      }

      case "delete_item": {
        const { error } = await supa
          .from("inventory_items")
          .delete()
          .eq("id", args.id)
          .eq("user_id", userId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }

      case "get_inventory_summary": {
        const { data, error } = await supa
          .from("inventory_items")
          .select("brand, original_price, quantity, category_id, is_donated, is_sold, is_eliminated")
          .eq("user_id", userId)
          .eq("is_donated", false)
          .eq("is_sold", false)
          .eq("is_eliminated", false);
        if (error) return { error: error.message };
        const items = data ?? [];
        const total = items.length;
        const totalValue = items.reduce(
          (s: number, i: any) => s + (Number(i.original_price ?? 0) * Number(i.quantity ?? 1)),
          0
        );
        const brandCounts: Record<string, number> = {};
        items.forEach((i: any) => {
          if (i.brand) brandCounts[i.brand] = (brandCounts[i.brand] ?? 0) + 1;
        });
        const topBrands = Object.entries(brandCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([brand, count]) => ({ brand, count }));
        return { total_items: total, total_value: totalValue, top_brands: topBrands };
      }

      case "save_user_default": {
        // Persist to assistant_user_prefs (per-user key/value)
        const { error } = await supa
          .from("assistant_user_prefs")
          .upsert({ user_id: userId, key: args.key, value: args.value }, { onConflict: "user_id,key" });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }
    }
    return { error: `Unknown tool: ${name}` };
  } catch (e: any) {
    return { error: e?.message ?? String(e) };
  }
}

async function loadUserContext(supa: any, userId: string) {
  const [{ data: profile }, { data: prefs }, { count: itemCount }] = await Promise.all([
    supa.from("profiles").select("full_name, age, gender, interests").eq("id", userId).maybeSingle(),
    supa.from("assistant_user_prefs").select("key, value").eq("user_id", userId),
    supa
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  return { profile, prefs: prefs ?? [], itemCount: itemCount ?? 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supa.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const userMessages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    if (!userMessages.length) {
      return new Response(JSON.stringify({ error: "messages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = await loadUserContext(supa, user.id);
    const prefsLine =
      ctx.prefs.length > 0
        ? `Known user defaults: ${ctx.prefs.map((p: any) => `${p.key}=${p.value}`).join(", ")}.`
        : "No saved user defaults yet.";

    const onboardingLine =
      ctx.itemCount === 0
        ? `IMPORTANT: This user has 0 items in their inventory. If the conversation has just started, greet them with EXACTLY: "Hi! Let's build your home inventory together. What room should we start with — kitchen, bedroom, living room, or somewhere else?" Then walk them through their home room by room, asking about a few key items per room before moving to the next.`
        : `User has ${ctx.itemCount} items already logged.`;

    const systemPrompt = `You are an inventory assistant for a personal home-inventory app.
Your job: help the user add, edit, query, and reason about the items they own.

Style:
- Conversational, warm, concise. Ask one focused follow-up at a time.
- Confirm assumptions before destructive actions (delete, big bulk edits).
- Prefer using saved defaults instead of re-asking. ${prefsLine}
${ctx.profile?.full_name ? `User's name: ${ctx.profile.full_name}.` : ""}

${onboardingLine}

Workflow:
- When the user mentions items they own, gather: name, brand, quantity, size/color (if relevant), and approximate price. Don't demand every field — guess sensibly.
- For shoes/clothes, if user has a saved size default, use it and just confirm.
- After collecting enough, call add_items. Then briefly confirm what was added.
- For "do I have X?" type questions, call search_items.
- For totals/value/brands questions, call get_inventory_summary.
- When the user reveals a stable preference (e.g. "I'm a size 8.5"), call save_user_default so we remember it next time.
- Never invent items the user didn't mention. Never call delete_item without explicit user confirmation.`;

    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...userMessages];

    // Tool-call loop (max 6 iterations to keep latency bounded)
    for (let i = 0; i < 6; i++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit hit, please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp.status === 402) {
          return new Response(
            JSON.stringify({ error: "Lovable AI credits exhausted. Add credits in workspace settings." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const txt = await aiResp.text();
        console.error("AI gateway error", aiResp.status, txt);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await aiResp.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) {
        return new Response(JSON.stringify({ error: "Empty AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If the model called tools, run them and loop back
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls });
        for (const tc of msg.tool_calls) {
          let parsedArgs: any = {};
          try {
            parsedArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          } catch (_e) {
            parsedArgs = {};
          }
          const result = await runTool(tc.function.name, parsedArgs, supa, user.id);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      // No tool calls — return the assistant's reply
      return new Response(
        JSON.stringify({ reply: msg.content ?? "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ reply: "I got stuck in a loop. Try rephrasing your request." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("inventory-assistant error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
