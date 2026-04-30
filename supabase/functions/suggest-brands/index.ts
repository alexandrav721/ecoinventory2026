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
    const { productName, category } = await req.json();
    
    // Validate inputs
    if (!productName || typeof productName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Product name is required and must be a string' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sanitize and validate input lengths
    const sanitizedProductName = productName.trim();
    if (sanitizedProductName.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Product name cannot be empty' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (sanitizedProductName.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Product name must be less than 255 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (category && (typeof category !== 'string' || category.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Category must be a string less than 100 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const sanitizedCategory = category?.trim() || '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Suggesting brands for:', sanitizedProductName, 'in category:', sanitizedCategory);

    const categoryContext = sanitizedCategory ? ` in the ${sanitizedCategory} category` : '';
    const prompt = `Suggest 5 real, popular brands for "${sanitizedProductName}"${categoryContext}. Return ONLY a JSON array of brand names as strings, nothing else. Example: ["Brand1", "Brand2", "Brand3", "Brand4", "Brand5"]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a product expert. Suggest real, popular brands for products. Always return valid JSON array of strings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse JSON from the AI response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', content);
      // Return generic brands as fallback
      return new Response(
        JSON.stringify({ brands: ['Generic', 'Other', 'Unknown Brand'] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brands = JSON.parse(jsonMatch[0]);
    console.log('Parsed brands:', brands);

    return new Response(
      JSON.stringify({ brands }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-brands function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to suggest brands' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
