const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itemName } = await req.json();

    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Item name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedItemName = itemName.trim().slice(0, 200);
    console.log('Suggesting category for:', sanitizedItemName);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch product mappings to help with suggestions
    const mappingsResponse = await fetch(`${supabaseUrl}/rest/v1/product_category_mappings?select=product_name,keywords,category_id,categories!inner(id,name,icon,parent_id)`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });
    const mappings = mappingsResponse.ok ? await mappingsResponse.json() : [];

    // Fetch all categories for context
    const categoriesResponse = await fetch(`${supabaseUrl}/rest/v1/categories?select=id,name,icon,parent_id&order=name`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });
    const allCategories = categoriesResponse.ok ? await categoriesResponse.json() : [];

    // Build a mapping context for the AI
    let mappingContext = '';
    if (mappings && mappings.length > 0) {
      mappingContext = '\n\nHere are some product-to-category mappings to help guide your suggestion:\n';
      mappings.forEach((m: any) => {
        const cat = m.categories;
        mappingContext += `- "${m.product_name}" → ${cat.icon || ''} ${cat.name}`;
        if (m.keywords && m.keywords.length > 0) {
          mappingContext += ` (keywords: ${m.keywords.join(', ')})`;
        }
        mappingContext += '\n';
      });
    }

    // Build category hierarchy for context
    let categoryContext = '\n\nAvailable categories:\n';
    if (allCategories) {
      const buildTree = (parentId: string | null, indent = '') => {
        return allCategories
          .filter((c: any) => c.parent_id === parentId)
          .map((c: any) => {
            const line = `${indent}${c.icon || ''} ${c.name} (id: ${c.id})`;
            const children = buildTree(c.id, indent + '  ');
            return line + (children ? '\n' + children : '');
          })
          .join('\n');
      };
      categoryContext += buildTree(null);
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a helpful inventory categorization assistant. Given a product name, suggest the most appropriate category ID from the available categories.${mappingContext}${categoryContext}

Return ONLY a JSON object with this structure:
{
  "categoryId": "uuid-of-suggested-category",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Brief explanation"
}

Rules:
- Always return a valid category ID from the list above
- Prefer subcategories over parent categories when appropriate
- Use the product mappings as strong hints
- If uncertain, choose a broader category and set confidence to "low"`;

    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Suggest a category for this item: "${sanitizedItemName}"` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Not enough credits. Please add credits in Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse JSON from AI response
    let suggestion;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      suggestion = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI suggestion');
    }

    // Validate the suggestion
    if (!suggestion.categoryId || !suggestion.confidence || !suggestion.reasoning) {
      throw new Error('Invalid suggestion format from AI');
    }

    // Verify category exists
    const category = allCategories?.find((c: any) => c.id === suggestion.categoryId);
    if (!category) {
      throw new Error('AI suggested an invalid category ID');
    }

    console.log('Category suggestion successful:', suggestion);

    return new Response(
      JSON.stringify({
        categoryId: suggestion.categoryId,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
        categoryName: category.name,
        categoryIcon: category.icon,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-category:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
