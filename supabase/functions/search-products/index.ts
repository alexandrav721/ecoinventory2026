import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function searchProducts(query: string): Promise<Array<{ title: string; description: string; imageUrl: string }>> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

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
          content: `You are a product search assistant. When given a product query, return 5 real, specific product suggestions with accurate details. Format your response as a JSON array of objects with "title", "description", and "imageUrl" fields. The imageUrl should be a placeholder like "https://images.unsplash.com/photo-1234567890?w=400". Make the products realistic and varied.`
        },
        {
          role: 'user',
          content: `Find 5 real products for: "${query}". Return only valid JSON array format.`
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI_API_ERROR_${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse JSON from the AI response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Could not find JSON in response:', content);
    throw new Error('Invalid response format from AI');
  }

  const results = JSON.parse(jsonMatch[0]);
  return results.slice(0, 5);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    // Validate input
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sanitize and validate query length
    const sanitizedQuery = query.trim();
    if (sanitizedQuery.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query cannot be empty', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (sanitizedQuery.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Query must be less than 500 characters', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Searching for products:', sanitizedQuery);

    const results = await searchProducts(sanitizedQuery);

    console.log('Found', results.length, 'product results');

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error searching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search products';
    
    // Check for specific API errors
    if (errorMessage.includes('AI_API_ERROR_402')) {
      return new Response(
        JSON.stringify({ 
          error: 'Payment required. Please add credits to your workspace.',
          results: []
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }, 
          status: 402 
        }
      );
    }
    
    if (errorMessage.includes('AI_API_ERROR_429')) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          results: []
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }, 
          status: 429 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        results: []
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});
