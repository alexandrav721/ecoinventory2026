import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Camera, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const FloatingAddButton = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Only show on mobile
  if (!isMobile) return null;

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setIsExpanded(false);
      
      // Start analysis
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: { image: imageData }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Too many requests. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits exhausted. Please try manual entry.');
        } else {
          throw error;
        }
        setPreviewImage(null);
        return;
      }

      if (data?.success && data.data) {
        toast.success("✨ Photo analyzed! Taking you to review...");
        
        // Navigate to add item page with the analyzed data
        navigate("/dashboard/add-item", { 
          state: { 
            fromQuickAdd: true,
            analyzedData: data.data,
            imageUrl: imageData
          }
        });
      } else {
        toast.error("Couldn't identify the item. Try manual entry.");
        setPreviewImage(null);
      }
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast.error("Analysis failed. Try again or use manual entry.");
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualAdd = () => {
    setIsExpanded(false);
    navigate("/dashboard/add-item");
  };

  const cancelAnalysis = () => {
    setPreviewImage(null);
    setIsAnalyzing(false);
  };

  // Show analyzing overlay
  if (isAnalyzing && previewImage) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
        <button 
          onClick={cancelAnalysis}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="relative w-48 h-48 rounded-2xl overflow-hidden mb-6 shadow-xl">
          <img 
            src={previewImage} 
            alt="Analyzing" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-lg font-medium">Analyzing your item...</span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Our AI is identifying what this is, its brand, condition, and more
        </p>
        
        <Loader2 className="w-8 h-8 text-primary animate-spin mt-6" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3" data-tour="add-item">
        {/* Expanded options */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
            {/* Camera option */}
            <Button
              onClick={handleCameraClick}
              className="gap-2 rounded-full shadow-lg bg-primary hover:bg-primary/90 pr-5"
              size="lg"
            >
              <Camera className="w-5 h-5" />
              <span>Snap a Photo</span>
            </Button>

            {/* Manual option */}
            <Button
              onClick={handleManualAdd}
              variant="secondary"
              className="gap-2 rounded-full shadow-lg pr-5"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Manually</span>
            </Button>
          </div>
        )}

        {/* Main FAB */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="icon"
          className={cn(
            "w-14 h-14 rounded-full shadow-xl transition-all duration-300",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "hover:scale-110 active:scale-95",
            isExpanded && "rotate-45"
          )}
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>
    </>
  );
};
