import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Receipt, PenTool, Package, Upload, Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { TagInput } from "@/components/dashboard/TagInput";
import { CategorySelector } from "@/components/dashboard/CategorySelector";
import BrandInput from "@/components/dashboard/BrandInput";
import { PersonalizedCatalogSelector } from "@/components/dashboard/PersonalizedCatalogSelector";
import { z } from "zod";
import { autoCategorizeItems } from "@/lib/autoCategorize";

interface Category {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
}

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  image_urls: string[] | null;
  typical_price: number | null;
  size: string | null;
  color: string | null;
  dimensions: string | null;
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity must be less than 10000"),
});

type AddMode = "select" | "manual" | "smart" | "bulk" | "catalog-multi" | "receipt";

const AddItem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const quickAddData = location.state as { fromQuickAdd?: boolean; analyzedData?: any; imageUrl?: string } | null;
  const [mode, setMode] = useState<AddMode>(quickAddData?.fromQuickAdd ? "manual" : "select");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [analyzingItem, setAnalyzingItem] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  const [smartImage, setSmartImage] = useState<string | null>(null);
  const [bulkImages, setBulkImages] = useState<Array<{ id: string; url: string; status: 'pending' | 'analyzing' | 'success' | 'error'; result?: any; error?: string }>>([]);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    brand: "",
    color: "",
    dimensions: "",
    size: "",
    quantity: 1,
    original_price: "",
    purchase_date: "",
    image_urls: [] as string[],
    condition: "good",
    usage_frequency: "",
    sharing_level: "private" as "private" | "friends" | "public",
    tags: [] as string[],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle pre-filled data from quick add (FAB camera flow)
  useEffect(() => {
    if (quickAddData?.fromQuickAdd && quickAddData.analyzedData && categories.length > 0) {
      const aiData = quickAddData.analyzedData;
      const conditionMap: Record<string, string> = {
        'new': 'new',
        'like_new': 'like_new',
        'good': 'good',
        'fair': 'fair',
        'poor': 'poor'
      };

      let categoryId = "";
      if (aiData.category) {
        const matchingCategory = categories.find(c => 
          c.name.toLowerCase().includes(aiData.category.toLowerCase()) ||
          aiData.category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchingCategory) {
          categoryId = matchingCategory.id;
        }
      }

      setFormData(prev => ({
        ...prev,
        name: aiData.name || "",
        description: aiData.description || "",
        category_id: categoryId,
        brand: aiData.brand || "",
        color: aiData.color || "",
        size: aiData.size || "",
        condition: conditionMap[aiData.condition] || "good",
        original_price: aiData.estimatedPrice ? aiData.estimatedPrice.toString() : "",
        image_urls: quickAddData.imageUrl ? [quickAddData.imageUrl] : [],
      }));
    }
  }, [quickAddData, categories]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  };

  const validateForm = () => {
    try {
      itemSchema.parse({
        name: formData.name,
        quantity: formData.quantity,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: inserted, error } = await supabase.from("inventory_items").insert([
        {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          brand: formData.brand.trim() || null,
          color: formData.color.trim() || null,
          dimensions: formData.dimensions.trim() || null,
          size: formData.size.trim() || null,
          tags: formData.tags,
          user_id: user.id,
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          purchase_date: formData.purchase_date || new Date().toISOString(),
          image_urls: formData.image_urls,
          category_id: formData.category_id || null,
          quantity: formData.quantity,
          condition: formData.condition,
          usage_frequency: formData.usage_frequency || null,
          sharing_level: formData.sharing_level,
          is_available_for_sharing: formData.sharing_level !== "private",
        },
      ]).select("id, name");

      if (error) throw error;

      // Auto-categorize in the background if user didn't pick one
      if (!formData.category_id && inserted && inserted.length > 0) {
        autoCategorizeItems(inserted).catch((e) =>
          console.warn("Auto-categorize failed:", e)
        );
      }

      toast.success("Item added successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const handleSmartImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSmartImage(reader.result as string);
      toast.success("Photo uploaded! Click analyze to continue.");
    };
    reader.readAsDataURL(file);
  };

  const handleSmartAnalysis = async () => {
    if (!smartInput && !smartImage) {
      toast.error("Please provide either a photo or description");
      return;
    }

    setAnalyzingItem(true);
    try {
      // Text-only path → multi-item extraction + bulk insert
      const isMulti = !!smartInput && !smartImage;

      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: {
          image: smartImage,
          description: smartInput,
          multi: isMulti,
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Too many requests. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits exhausted. Please add credits in Settings.');
        } else {
          throw error;
        }
        return;
      }

      const conditionMap: Record<string, string> = {
        new: 'new', like_new: 'like_new', good: 'good', fair: 'fair', poor: 'poor'
      };

      const matchCategoryId = (catName?: string) => {
        if (!catName) return "";
        const m = categories.find(c =>
          c.name.toLowerCase().includes(catName.toLowerCase()) ||
          catName.toLowerCase().includes(c.name.toLowerCase())
        );
        return m?.id || "";
      };

      // ── Multi-item bulk insert path ──
      if (isMulti && data?.success && Array.isArray(data.items)) {
        const items = data.items;
        if (items.length === 0) {
          toast.error("Couldn't find any items in your description.");
          return;
        }

        // Single item → fall through to review form
        if (items.length === 1) {
          const aiData = items[0];
          setFormData({
            ...formData,
            name: aiData.name || "",
            description: aiData.description || "",
            category_id: matchCategoryId(aiData.category),
            brand: aiData.brand || "",
            color: aiData.color || "",
            size: aiData.size || "",
            condition: conditionMap[aiData.condition] || "good",
            original_price: aiData.estimatedPrice ? aiData.estimatedPrice.toString() : "",
            quantity: aiData.quantity || 1,
          });
          toast.success("✨ AI found 1 item — review and save.");
          setMode("manual");
          setSmartInput("");
          return;
        }

        // Multiple → insert all directly
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please log in to add items");
          return;
        }

        const itemsToInsert = items.map((aiData: any) => ({
          user_id: user.id,
          name: aiData.name,
          description: aiData.description || null,
          category_id: matchCategoryId(aiData.category) || null,
          brand: aiData.brand || null,
          color: aiData.color || null,
          condition: conditionMap[aiData.condition] || 'good',
          size: aiData.size || null,
          original_price: aiData.estimatedPrice || null,
          quantity: aiData.quantity || 1,
          image_urls: [],
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('inventory_items')
          .insert(itemsToInsert)
          .select("id, name");

        if (insertError) throw insertError;

        if (inserted && inserted.length > 0) {
          autoCategorizeItems(inserted).catch(e => console.warn("Auto-categorize failed:", e));
        }

        toast.success(`✨ Added ${items.length} items!`);
        navigate("/dashboard");
        return;
      }

      // ── Single-item path (image, or fallback) ──
      if (data?.success && data.data) {
        const aiData = data.data;
        setFormData({
          ...formData,
          name: aiData.name || "",
          description: aiData.description || "",
          category_id: matchCategoryId(aiData.category),
          brand: aiData.brand || "",
          color: aiData.color || "",
          size: aiData.size || "",
          condition: conditionMap[aiData.condition] || "good",
          original_price: aiData.estimatedPrice ? aiData.estimatedPrice.toString() : "",
          image_urls: smartImage ? [smartImage] : [],
        });

        toast.success("✨ AI analyzed your item! Review and adjust the details.");
        setMode("manual");
        setSmartInput("");
        setSmartImage(null);
      } else {
        toast.error("Failed to analyze item");
      }
    } catch (error: any) {
      console.error("Error analyzing item:", error);
      toast.error(error.message || "Failed to analyze item");
    } finally {
      setAnalyzingItem(false);
    }
  };

  const handleBulkImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const maxFiles = 10;
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    const newImages: Array<{ id: string; url: string; status: 'pending' | 'analyzing' | 'success' | 'error' }> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          newImages.push({
            id: `${Date.now()}-${i}`,
            url: base64,
            status: 'pending'
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setBulkImages(prev => [...prev, ...newImages]);
    toast.success(`Added ${newImages.length} photos`);
  };

  const handleAnalyzeAllBulk = async () => {
    if (bulkImages.length === 0) return;

    setBulkAnalyzing(true);
    const updatedImages = [...bulkImages];

    for (let i = 0; i < updatedImages.length; i++) {
      if (updatedImages[i].status !== 'pending') continue;

      updatedImages[i].status = 'analyzing';
      setBulkImages([...updatedImages]);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-item', {
          body: { image: updatedImages[i].url }
        });

        if (error) throw error;

        if (data?.success && data.data) {
          updatedImages[i].status = 'success';
          updatedImages[i].result = data.data;
        } else {
          throw new Error("Analysis failed");
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        updatedImages[i].status = 'error';
        updatedImages[i].error = error instanceof Error ? error.message : 'Failed to analyze';
      }

      setBulkImages([...updatedImages]);
    }

    setBulkAnalyzing(false);
    const successCount = updatedImages.filter(img => img.status === 'success').length;
    toast.success(`✨ Analyzed ${successCount} of ${updatedImages.length} photos!`);
  };

  const handleSaveBulkItems = async () => {
    const successItems = bulkImages.filter(img => img.status === 'success' && img.result);
    
    if (successItems.length === 0) {
      toast.error("No items to save");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to add items");
      return;
    }

    try {
      const itemsToInsert = successItems.map(img => {
        const aiData = img.result;
        const conditionMap: Record<string, string> = {
          'new': 'new',
          'like_new': 'like_new',
          'good': 'good',
          'fair': 'fair',
          'poor': 'poor'
        };

        let categoryId = "";
        if (aiData.category) {
          const matchingCategory = categories.find((c: Category) => 
            c.name.toLowerCase().includes(aiData.category.toLowerCase()) ||
            aiData.category.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matchingCategory) {
            categoryId = matchingCategory.id;
          }
        }

        return {
          user_id: user.id,
          name: aiData.name,
          description: aiData.description || null,
          category_id: categoryId || null,
          brand: aiData.brand || null,
          color: aiData.color || null,
          condition: conditionMap[aiData.condition] || 'good',
          size: aiData.size || null,
          original_price: aiData.estimatedPrice || null,
          image_urls: [img.url],
          quantity: 1
        };
      });

      const { data: inserted, error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert)
        .select("id, name");

      if (error) throw error;

      if (inserted && inserted.length > 0) {
        autoCategorizeItems(inserted).catch((e) =>
          console.warn("Auto-categorize failed:", e)
        );
      }

      toast.success(`Successfully added ${successItems.length} items!`);
      navigate("/dashboard");
    } catch (error) {
      console.error('Error saving bulk items:', error);
      toast.error("Failed to save items");
    }
  };

  const handleRemoveBulkImage = (id: string) => {
    setBulkImages(prev => prev.filter(img => img.id !== id));
  };

  const handleBulkCatalogAdd = async (selectedProducts: CatalogProduct[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const itemsToInsert = selectedProducts.map(product => ({
        user_id: user.id,
        name: product.name,
        description: product.description || null,
        category_id: product.category_id || null,
        image_urls: product.image_urls || [],
        original_price: product.typical_price || null,
        size: product.size || null,
        color: product.color || null,
        dimensions: product.dimensions || null,
        quantity: 1,
        condition: 'good'
      }));

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success(`Added ${selectedProducts.length} items to your inventory!`);
      navigate("/dashboard");
    } catch (error) {
      console.error('Error adding items:', error);
      toast.error('Failed to add items to inventory');
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setProcessingReceipt(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const base64Image = reader.result as string;

      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { image: base64Image }
      });

      if (error) throw error;

      if (data?.items && data.items.length > 0) {
        const item = data.items[0];
        setFormData({
          ...formData,
          name: item.name || "",
          description: item.description || "",
          brand: item.brand || "",
          original_price: item.price || "",
          quantity: item.quantity || 1,
        });
        toast.success("Receipt processed! Review and adjust the details.");
        setMode("manual");
      } else {
        toast.error("No items found in receipt");
      }
    } catch (error: any) {
      console.error("Error processing receipt:", error);
      toast.error(error.message || "Failed to process receipt");
    } finally {
      setProcessingReceipt(false);
    }
  };

  // Mode selection screen
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Add New Item</h1>
            <p className="text-muted-foreground">Choose how you'd like to add your item</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 border-primary"
              onClick={() => setMode("bulk")}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <Upload className="h-12 w-12 text-primary" />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                    ✨
                  </div>
                </div>
                <h3 className="font-semibold">Bulk Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Add 5-10 items at once with photos
                </p>
                <span className="text-xs font-medium text-primary">Fast & Easy</span>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 border-primary"
              onClick={() => setMode("smart")}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <Camera className="h-12 w-12 text-primary" />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                    ✨
                  </div>
                </div>
                <h3 className="font-semibold">Smart Add (AI)</h3>
                <p className="text-sm text-muted-foreground">
                  Snap a photo or describe it - AI does the rest
                </p>
                <span className="text-xs font-medium text-primary">Recommended</span>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setMode("manual")}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <PenTool className="h-12 w-12 text-primary" />
                <h3 className="font-semibold">Manual Add</h3>
                <p className="text-sm text-muted-foreground">
                  Enter item details manually
                </p>
              </div>
            </Card>

            {/* Loop Catalog removed */}

            <Card 
              className="p-6 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setMode("receipt")}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <Receipt className="h-12 w-12 text-primary" />
                <h3 className="font-semibold">Upload Receipt</h3>
                <p className="text-sm text-muted-foreground">
                  Scan a receipt to extract items
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Bulk Upload mode
  if (mode === "bulk") {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setMode("select")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">📸 Bulk Photo Upload</h1>
            <p className="text-muted-foreground">
              Upload 5-10 photos and AI will analyze each item automatically
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-accent/50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleBulkImageUpload(e.target.files)}
                className="hidden"
                id="bulk-upload"
              />
              <label 
                htmlFor="bulk-upload" 
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <Upload className="h-16 w-16 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Select up to 10 photos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will automatically identify and categorize each item
                  </p>
                </div>
                <Button type="button" disabled={bulkAnalyzing}>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photos
                </Button>
              </label>
            </div>

            {bulkImages.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bulkImages.map((img) => (
                    <div key={img.id} className="relative border rounded-lg p-2 bg-card">
                      <img src={img.url} alt="Upload" className="w-full h-32 object-cover rounded mb-2" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveBulkImage(img.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="mt-2 text-xs">
                        {img.status === 'pending' && (
                          <span className="text-muted-foreground">⏳ Ready to analyze</span>
                        )}
                        {img.status === 'analyzing' && (
                          <span className="text-primary flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing...
                          </span>
                        )}
                        {img.status === 'success' && (
                          <div className="space-y-1">
                            <span className="text-green-600 font-medium block">✓ {img.result?.name}</span>
                            <span className="text-muted-foreground text-[10px] block truncate">
                              {img.result?.category || 'No category'}
                            </span>
                          </div>
                        )}
                        {img.status === 'error' && (
                          <span className="text-destructive">✗ Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleAnalyzeAllBulk}
                    disabled={bulkAnalyzing || bulkImages.every(img => img.status !== 'pending')}
                    className="flex-1"
                  >
                    {bulkAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing {bulkImages.filter(i => i.status === 'analyzing').length}/{bulkImages.length}
                      </>
                    ) : (
                      <>
                        ✨ Analyze All Photos
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveBulkItems}
                    disabled={bulkAnalyzing || !bulkImages.some(img => img.status === 'success')}
                    className="flex-1"
                  >
                    Save {bulkImages.filter(i => i.status === 'success').length} Items
                  </Button>
                </div>

                {bulkImages.some(i => i.status === 'error') && (
                  <p className="text-sm text-destructive text-center">
                    Some items failed to analyze. You can remove them or try analyzing again.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Smart Add mode
  if (mode === "smart") {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setMode("select")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">✨ Smart Add with AI</h1>
            <p className="text-muted-foreground">
              Snap a photo, or describe one item — or many at once — and AI does the rest
            </p>
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="photo" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="photo">📷 Photo</TabsTrigger>
                <TabsTrigger value="text">✏️ Description</TabsTrigger>
              </TabsList>
              
              <TabsContent value="photo" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {smartImage ? (
                    <div className="space-y-4">
                      <img src={smartImage} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSmartImage(null)}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSmartImageUpload(file);
                        }}
                        className="hidden"
                        id="smart-photo-upload"
                      />
                      <label 
                        htmlFor="smart-photo-upload" 
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <Camera className="h-16 w-16 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Snap a photo of your item</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            AI will identify and categorize it automatically
                          </p>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Describe your item(s)</Label>
                  <Textarea
                    placeholder={"List one or many — AI will sort them out.\n\ne.g.\n• Black Nike running shoes, size 42\n• Red leather IKEA couch\n• 6 white dinner plates\n• KitchenAid stand mixer, barely used"}
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mention as many items as you want — separated by commas, "and", or new lines. AI will add each one.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              type="button"
              onClick={handleSmartAnalysis}
              disabled={analyzingItem || (!smartInput && !smartImage)}
              className="w-full gap-2"
            >
              {analyzingItem ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  ✨ Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Receipt mode
  if (mode === "receipt") {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setMode("select")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upload Receipt</h1>
            <p className="text-muted-foreground">
              Take a photo or upload an image of your receipt
            </p>
          </div>

          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReceiptUpload(file);
              }}
              className="hidden"
              id="receipt-upload"
              disabled={processingReceipt}
            />
            <label 
              htmlFor="receipt-upload" 
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              {processingReceipt ? (
                <>
                  <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Processing receipt...</p>
                </>
              ) : (
                <>
                  <Camera className="h-16 w-16 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Click to take photo or upload</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JPG, PNG, HEIC
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Catalog multi-select mode
  if (mode === "catalog-multi") {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => setMode("select")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Loop Catalog</h1>
            <p className="text-muted-foreground">
              Select multiple items to add to your inventory
            </p>
          </div>

          <PersonalizedCatalogSelector onAddItems={handleBulkCatalogAdd} />
        </div>
      </div>
    );
  }

  // Manual form mode
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const isFurnitureCategory = selectedCategory?.name.toLowerCase().includes('furniture') || 
                               selectedCategory?.name.toLowerCase().includes('living room') ||
                               selectedCategory?.name.toLowerCase().includes('bedroom');
  const isClothingCategory = selectedCategory?.name.toLowerCase().includes('clothing') ||
                              selectedCategory?.name.toLowerCase().includes('apparel') ||
                              selectedCategory?.name.toLowerCase().includes('wardrobe');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Item</h1>
          <p className="text-muted-foreground">Fill in the item details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item description"
                rows={3}
              />
            </div>

            <CategorySelector
              value={formData.category_id}
              onChange={(value) => setFormData({ ...formData, category_id: value })}
            />

            <BrandInput
              value={formData.brand}
              onChange={(value) => setFormData({ ...formData, brand: value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Color"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Size"
                />
              </div>
            </div>

            {isFurnitureCategory && (
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="e.g., 72 x 36 x 30 inches"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                />
                {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_price">Original Price</Label>
                <Input
                  id="original_price"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
            </div>

            <TagInput
              value={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
            />

            <ImageUpload
              value={formData.image_urls}
              onChange={(urls) => setFormData({ ...formData, image_urls: urls })}
            />

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Sharing</Label>
              </div>

              <div className="space-y-2">
                <Label>Sharing Level</Label>
                <Select
                  value={formData.sharing_level}
                  onValueChange={(value: "private" | "friends" | "public") => 
                    setFormData({ ...formData, sharing_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Item"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
