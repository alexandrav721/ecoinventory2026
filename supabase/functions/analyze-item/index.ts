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
    const { image, description, multi } = await req.json();
    
    if (!image && !description) {
      return new Response(
        JSON.stringify({ error: 'Either image or description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the message content based on input type
    const content: any[] = [];
    
    if (description) {
      content.push({
        type: "text",
        text: multi
          ? `The user is describing one OR MORE household items in a single message. Parse the text and extract EVERY distinct item mentioned, even if listed casually (commas, "and", new lines, bullets). For each item, fill in all known details and reasonable estimates. Text: "${description}"`
          : `Analyze this product description and extract details: "${description}"`
      });
    }
    
    if (image) {
      content.push({
        type: "text",
        text: "Analyze this product image and extract all visible details."
      });
      content.push({
        type: "image_url",
        image_url: {
          url: image // Can be base64 data URI or URL
        }
      });
    }

    console.log('Calling Lovable AI for item analysis...');

    // Call Lovable AI with structured output using tool calling
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
            role: 'system',
            content: 'You are an expert at identifying products from images and descriptions. Extract all relevant product information accurately. When suggesting a location, think about where this item is typically stored in a home (e.g., shoes in "Bedroom > Closet", cookware in "Kitchen", towels in "Bathroom", books in "Living Room", etc.).'
          },
          {
            role: 'user',
            content: content
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_product_details",
              description: "Extract structured product information from an image or description",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "The product name or title"
                  },
                  description: {
                    type: "string",
                    description: "A detailed description of the product"
                  },
                  category: {
                    type: "string",
                    description: "Product category (e.g., 'Electronics', 'Clothing', 'Furniture', 'Kitchen', 'Sports', 'Books', etc.)"
                  },
                  brand: {
                    type: "string",
                    description: "Brand name if visible or identifiable"
                  },
                  color: {
                    type: "string",
                    description: "Primary color(s) of the item"
                  },
                  condition: {
                    type: "string",
                    enum: ["new", "like_new", "good", "fair", "poor"],
                    description: "Estimated condition of the item"
                  },
                  size: {
                    type: "string",
                    description: "Size if applicable (e.g., 'XL', '42', 'Large')"
                  },
                  estimatedPrice: {
                    type: "number",
                    description: "Estimated typical retail price in USD"
                  },
                  location: {
                    type: "string",
                    description: "Suggested storage location in a home where this item is typically kept (e.g., 'Bedroom > Closet', 'Kitchen', 'Bathroom', 'Living Room', 'Garage', 'Office')"
                  }
                },
                required: ["name", "description", "category", "location"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_product_details" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze item' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_product_details') {
      console.error('Unexpected AI response format:', JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: 'Failed to extract product details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productDetails = JSON.parse(toolCall.function.arguments);
    console.log('Extracted product details:', productDetails);

    return new Response(
      JSON.stringify({ success: true, data: productDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-item function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
