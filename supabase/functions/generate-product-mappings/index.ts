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

    // Get all categories
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('categories')
      .select('id, name')
      .is('user_id', null);

    if (categoriesError) throw categoriesError;
    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }

    console.log(`Found ${categories.length} categories`);

    const totalProducts = 10000;
    const productsPerCategory = Math.ceil(totalProducts / categories.length);
    const batchSize = 50; // Process in batches of 50
    let totalGenerated = 0;

    // Process each category
    for (const category of categories) {
      console.log(`Generating products for category: ${category.name}`);
      
      const numProducts = Math.min(productsPerCategory, totalProducts - totalGenerated);
      const batches = Math.ceil(numProducts / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const productsInBatch = Math.min(batchSize, numProducts - (batch * batchSize));
        
        // Use Lovable AI to generate product names
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
                content: `Generate ${productsInBatch} realistic, specific product names for the category "${category.name}". Include brand names when appropriate. Return ONLY a JSON array of strings, no other text. Example format: ["Product Name 1", "Product Name 2", ...]`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI generation failed for ${category.name}, batch ${batch}:`, {
            status: aiResponse.status,
            statusText: aiResponse.statusText,
            error: errorText
          });
          continue;
        }

        const aiResult = await aiResponse.json();
        console.log(`AI response for ${category.name}, batch ${batch}:`, JSON.stringify(aiResult).substring(0, 200));
        
        let productNames: string[] = [];

        try {
          // Parse the AI response (OpenAI-compatible format)
          const content = aiResult.choices?.[0]?.message?.content || '';
          // Extract JSON array from the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            productNames = JSON.parse(jsonMatch[0]);
          } else {
            console.error(`No JSON array found in response for ${category.name}, batch ${batch}`);
          }
        } catch (parseError) {
          console.error(`Failed to parse AI response for ${category.name}, batch ${batch}:`, parseError);
          continue;
        }

        if (productNames.length === 0) {
          console.error(`No products generated for ${category.name}, batch ${batch}`);
          continue;
        }

        // Prepare batch insert
        const mappings = productNames.map(name => ({
          product_name: name,
          category_id: category.id,
          keywords: [name.toLowerCase(), category.name.toLowerCase()],
        }));

        // Insert batch
        const { error: insertError } = await supabaseClient
          .from('product_category_mappings')
          .insert(mappings);

        if (insertError) {
          console.error(`Insert error for ${category.name}, batch ${batch}:`, insertError);
        } else {
          totalGenerated += mappings.length;
          console.log(`Inserted batch ${batch + 1}/${batches} for ${category.name}. Total: ${totalGenerated}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${totalGenerated} product mappings`,
        totalGenerated 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
