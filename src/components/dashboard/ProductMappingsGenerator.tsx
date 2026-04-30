import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProductMappingsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      toast.info("Starting generation of 10,000 products. This will take a few minutes...");
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('generate-product-mappings');

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      if (data.success) {
        toast.success(`Successfully generated ${data.totalGenerated} product mappings!`);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error: any) {
      console.error("Error generating products:", error);
      toast.error(`Failed to generate products: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Product Generator
        </CardTitle>
        <CardDescription>
          Generate 10,000 realistic product mappings across all categories using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Generating products... {progress}%
            </p>
          </div>
        )}
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate 10,000 Products
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          This process will take 3-5 minutes. Products will be distributed evenly across all categories.
        </p>
      </CardContent>
    </Card>
  );
}
