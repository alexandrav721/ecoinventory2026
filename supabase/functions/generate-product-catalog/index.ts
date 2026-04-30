import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Category {
  id: string;
  name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching categories...');
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('categories')
      .select('id, name')
      .is('user_id', null);

    if (categoriesError) throw categoriesError;
    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }

    console.log(`Found ${categories.length} categories`);

    const TOTAL_PRODUCTS = 10000;
    const productsPerCategory = Math.floor(TOTAL_PRODUCTS / categories.length);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let totalGenerated = 0;
    const batchSize = 50;

    for (const category of categories) {
      console.log(`Generating products for category: ${category.name}`);

      const prompt = `Generate ${productsPerCategory} realistic household inventory products for the category "${category.name}". 
      
For each product, provide:
- name (concise product name)
- description (brief 1-2 sentence description)
- typical_price (realistic price in USD as a number)
- color (if applicable, or null)
- size (if applicable, like "Medium", "12oz", or null)

Return ONLY a JSON array with no additional text. Format:
[
  {
    "name": "Product Name",
    "description": "Brief description",
    "typical_price": 29.99,
    "color": "Blue",
    "size": "Medium"
  }
]`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI request failed for ${category.name}:`, await aiResponse.text());
        continue;
      }

      const aiResult = await aiResponse.json();
      const content = aiResult.choices?.[0]?.message?.content || '';
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error(`No JSON found in AI response for ${category.name}`);
        continue;
      }

      let products;
      try {
        products = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error(`Failed to parse AI response for ${category.name}:`, e);
        continue;
      }

      // Insert products in batches
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize).map((product: any) => ({
          name: product.name,
          description: product.description || null,
          category_id: category.id,
          typical_price: product.typical_price || null,
          color: product.color || null,
          size: product.size || null,
        }));

        const { error: insertError } = await supabaseClient
          .from('product_catalog')
          .insert(batch);

        if (insertError) {
          console.error(`Error inserting batch for ${category.name}:`, insertError);
        } else {
          totalGenerated += batch.length;
          console.log(`Inserted ${batch.length} products for ${category.name}. Total: ${totalGenerated}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalGenerated,
        message: `Successfully generated ${totalGenerated} products`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating product catalog:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
