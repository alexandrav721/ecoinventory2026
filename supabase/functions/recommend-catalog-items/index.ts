import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('gender, age, city, state, interests')
      .eq('id', user.id)
      .single();

    // Get all catalog products
    const { data: allProducts, error: productsError } = await supabaseClient
      .from('product_catalog')
      .select(`
        id,
        name,
        description,
        category_id,
        image_urls,
        typical_price,
        categories (name)
      `)
      .limit(500);

    if (productsError) throw productsError;

    if (!allProducts || allProducts.length === 0) {
      return new Response(
        JSON.stringify({ 
          recommendations: [],
          message: 'No products in catalog'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create profile context for AI
    const profileContext = `User Profile:
- Gender: ${profile?.gender || 'not specified'}
- Age: ${profile?.age || 'not specified'}
- Location: ${profile?.city || 'unknown'}, ${profile?.state || 'unknown'}
- Interests: ${profile?.interests?.join(', ') || 'not specified'}`;

    // Use Lovable AI to rank products
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `${profileContext}

Based on this user profile, recommend the most relevant household inventory items from this list. Consider common needs for someone of this age, gender, location, and interests.

Products:
${allProducts.slice(0, 100).map(p => `- ${p.name}`).join('\n')}

Return ONLY a JSON array of product names (up to 50 items) in order of relevance. Most relevant first.
Example format: ["Product Name 1", "Product Name 2", ...]`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI recommendation failed:', await aiResponse.text());
      // Fallback: return random selection
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      return new Response(
        JSON.stringify({ 
          recommendations: shuffled.slice(0, 50),
          fallback: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let recommendedNames: string[] = [];
    
    if (jsonMatch) {
      try {
        recommendedNames = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }

    // Map recommended names back to full product objects
    const recommendations = recommendedNames
      .map(name => allProducts.find(p => 
        p.name.toLowerCase() === name.toLowerCase() ||
        p.name.toLowerCase().includes(name.toLowerCase())
      ))
      .filter(Boolean)
      .slice(0, 50);

    // Fill remaining slots with other popular items
    if (recommendations.length < 30) {
      const usedIds = new Set(recommendations.map(r => r!.id));
      const remaining = allProducts
        .filter(p => !usedIds.has(p.id))
        .slice(0, 30 - recommendations.length);
      recommendations.push(...remaining);
    }

    return new Response(
      JSON.stringify({ 
        recommendations,
        personalized: recommendedNames.length > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
