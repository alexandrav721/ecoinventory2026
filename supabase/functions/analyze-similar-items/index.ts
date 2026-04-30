import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Invalid items data" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare item descriptions for AI analysis
    const itemDescriptions = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      brand: item.brand || 'unknown',
      color: item.color || 'not specified',
      size: item.size || 'not specified',
      category: item.categoryPath || 'uncategorized',
      description: item.description || '',
      condition: item.condition || 'not specified'
    }));

    const systemPrompt = `You are an expert at analyzing inventory items and identifying similar products. 
Your task is to group similar items together based on their type, purpose, and characteristics - even if they have different brands or exact names.

For example:
- Three white sweaters from different brands should be grouped together
- Running shoes of different brands should be grouped together
- Coffee mugs should be grouped together regardless of color or brand

Focus on the practical similarity - items that serve the same purpose or are the same type of product.

Return a JSON array of groups. Each group should have:
- groupName: A descriptive name for the group (e.g., "White Sweaters", "Running Shoes")
- reason: Brief explanation why these items are similar
- itemIds: Array of item IDs in this group

Only create groups with 2 or more items. Return an empty array if no similar items are found.`;

    const userPrompt = `Analyze these inventory items and group similar ones together:\n\n${JSON.stringify(itemDescriptions, null, 2)}`;

    console.log('Calling Lovable AI for similarity analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "group_similar_items",
            description: "Group similar inventory items together",
            parameters: {
              type: "object",
              properties: {
                groups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      groupName: { type: "string" },
                      reason: { type: "string" },
                      itemIds: { 
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["groupName", "reason", "itemIds"],
                    additionalProperties: false
                  }
                }
              },
              required: ["groups"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "group_similar_items" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the structured output from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "group_similar_items") {
      console.error('Unexpected AI response format');
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groups = JSON.parse(toolCall.function.arguments).groups;
    console.log(`Found ${groups.length} similarity groups`);

    return new Response(
      JSON.stringify({ groups }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-similar-items function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});