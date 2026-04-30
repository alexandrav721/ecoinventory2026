import { useState } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { useEffect } from "react";
import { Search, Loader2, Users, Globe, Package, Upload, Plus, X, Camera, Receipt, PenTool, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "./ImageUpload";
import { TagInput } from "./TagInput";
import { CategorySelector } from "./CategorySelector";
import BrandInput from "./BrandInput";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatCurrency } from "@/lib/utils";
import { PersonalizedCatalogSelector } from "./PersonalizedCatalogSelector";

interface Category {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
}

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  title: string;
  description: string;
  imageUrl?: string;
}

interface CommunityItem {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  color: string | null;
  image_urls: string[] | null;
  condition: string | null;
  category_id: string | null;
  dimensions: string | null;
  size: string | null;
  original_price: number | null;
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
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  brand: z.string().trim().max(100, "Brand must be less than 100 characters").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity must be less than 10000"),
  original_price: z.string().trim().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1000000;
  }, "Price must be a valid positive number less than 1,000,000").optional(),
  dimensions: z.string().trim().max(100, "Dimensions must be less than 100 characters").optional(),
  size: z.string().trim().max(50, "Size must be less than 50 characters").optional(),
  color: z.string().trim().max(50, "Color must be less than 50 characters").optional(),
  image_url: z.string().trim().max(500, "URL must be less than 500 characters").refine((val) => {
    if (!val) return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Must be a valid URL").optional(),
});

type AddMode = "select" | "manual" | "receipt" | "internet" | "catalog" | "catalog-multi" | "smart" | "bulk";

const AddItemDialog = ({ open, onOpenChange }: AddItemDialogProps) => {
  const [mode, setMode] = useState<AddMode>("select");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestingBrands, setSuggestingBrands] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityItem[]>([]);
  const [catalogResults, setCatalogResults] = useState<CatalogProduct[]>([]);
  const [catalogSuggestions, setCatalogSuggestions] = useState<CatalogProduct[]>([]);
  const [showCatalogSuggestions, setShowCatalogSuggestions] = useState(false);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryIcon, setNewSubcategoryIcon] = useState("📦");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [analyzingItem, setAnalyzingItem] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  const [smartImage, setSmartImage] = useState<string | null>(null);
  const [bulkImages, setBulkImages] = useState<Array<{ id: string; url: string; status: 'pending' | 'analyzing' | 'success' | 'error'; result?: any; error?: string }>>([]);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
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
    if (open) {
      fetchCategories();
      setMode("select");
    }
  }, [open]);

  // Fetch catalog suggestions as user types
  useEffect(() => {
    const fetchCatalogSuggestions = async () => {
      if (formData.name.length < 2) {
        setCatalogSuggestions([]);
        return;
      }

      try {
        const { data } = await supabase
          .from('product_catalog')
          .select('*')
          .or(`name.ilike.%${formData.name}%,brand.ilike.%${formData.name}%`)
          .limit(5);

        setCatalogSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching catalog suggestions:', error);
      }
    };

    const debounceTimer = setTimeout(fetchCatalogSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.name]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  };

  const getCategoryDepth = (categoryId: string): number => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.parent_id) return 0;
    return 1 + getCategoryDepth(category.parent_id);
  };

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (!mainCategoryId) {
      toast.error("Please select a main category first");
      return;
    }

    setCreatingCategory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("categories")
        .insert([{
          name: newSubcategoryName.trim(),
          icon: newSubcategoryIcon,
          parent_id: mainCategoryId,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Subcategory created!");
      await fetchCategories();
      setFormData({ ...formData, category_id: data.id });
      setNewSubcategoryName("");
      setNewSubcategoryIcon("📦");
      setShowNewSubcategory(false);
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error("Failed to create subcategory");
    } finally {
      setCreatingCategory(false);
    }
  };

  const suggestBrands = async () => {
    if (!formData.name.trim() || formData.name.length < 3) {
      toast.error('Please enter a product name first (at least 3 characters)');
      return;
    }
    
    setSuggestingBrands(true);
    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      const { data, error } = await supabase.functions.invoke('suggest-brands', {
        body: { 
          productName: formData.name,
          category: selectedCategory?.name 
        }
      });

      if (error) {
        // Check for specific error types - check both error message and data
        const errorData = data as any;
        if (error.message?.includes('402') || error.message?.includes('Payment required') || 
            errorData?.error?.includes('Payment required') || errorData?.error?.includes('credits')) {
          toast.error('AI suggestions require credits. Please add credits in Settings → Workspace → Usage, or enter brand manually.');
        } else if (error.message?.includes('429') || error.message?.includes('Rate limit') || 
                   errorData?.error?.includes('Rate limit')) {
          toast.error('Too many requests. Please try again in a moment or enter brand manually.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.brands && Array.isArray(data.brands)) {
        setBrandSuggestions(data.brands);
        toast.success('Brand suggestions loaded!');
      }
    } catch (error: any) {
      console.error('Brand suggestion error:', error);
      toast.error('Could not suggest brands. Please enter manually.');
    } finally {
      setSuggestingBrands(false);
    }
  };

  const handleInternetSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-products', {
        body: { query: searchQuery }
      });

      if (error) {
        // Check for specific error types
        if (error.message?.includes('402') || error.message?.includes('Payment required') || error.message?.includes('credits')) {
          toast.error('AI product search requires credits. Please add credits in Settings or enter product details manually.');
        } else if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Too many requests. Please try again in a moment.');
        } else {
          toast.error(error.message || 'Failed to search products');
        }
        return;
      }
      
      if (data?.error) {
        toast.error(data.error);
        setSearchResults([]);
        return;
      }

      setSearchResults(data.results || []);
      if (data.results.length === 0) {
        toast.info("No results found. Try a different search term.");
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error("Failed to search products");
    } finally {
      setSearching(false);
    }
  };

  const handleCommunitySearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data, error} = await supabase
        .from('inventory_items')
        .select('id, name, description, brand, color, image_urls, condition, category_id, dimensions, size, original_price')
        .eq('is_available_for_sharing', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setCommunityResults(data || []);
      if (!data || data.length === 0) {
        toast.info("No community items found. Try a different search term.");
      }
    } catch (error: any) {
      console.error('Community search error:', error);
      toast.error("Failed to search community items");
    } finally {
      setSearching(false);
    }
  };

  const handleCatalogSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setCatalogResults(data || []);
      if (!data || data.length === 0) {
        toast.info("No catalog products found.");
      }
    } catch (error: any) {
      console.error('Catalog search error:', error);
      toast.error("Failed to search catalog");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setFormData({
      ...formData,
      name: result.title,
      description: result.description,
      image_urls: result.imageUrl ? [result.imageUrl] : [],
    });
    setSearchResults([]);
    setSearchQuery("");
    toast.success("Item details filled from search result");
  };

  const handleSelectCommunityItem = (item: CommunityItem) => {
    setFormData({
      ...formData,
      name: item.name,
      description: item.description || "",
      brand: item.brand || "",
      color: item.color || "",
      image_urls: item.image_urls || [],
      condition: item.condition || "good",
      category_id: item.category_id || "",
      dimensions: item.dimensions || "",
      size: item.size || "",
      original_price: item.original_price?.toString() || "",
    });
    setCommunityResults([]);
    setSearchQuery("");
    toast.success("Item details filled from community item");
  };

  const handleSelectCatalogItem = (item: CatalogProduct) => {
    setFormData({
      ...formData,
      name: item.name,
      description: item.description || "",
      color: item.color || "",
      image_urls: item.image_urls || [],
      category_id: item.category_id || "",
      dimensions: item.dimensions || "",
      size: item.size || "",
      original_price: item.typical_price?.toString() || "",
    });
    setCatalogResults([]);
    setSearchQuery("");
    toast.success("Item details filled from catalog");
  };

  const validateForm = () => {
    try {
      itemSchema.parse({
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        quantity: formData.quantity,
        original_price: formData.original_price,
        dimensions: formData.dimensions,
        size: formData.size,
        color: formData.color,
        image_urls: formData.image_urls,
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

      const { error } = await supabase.from("inventory_items").insert([
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
      ]);

      if (error) throw error;

      toast.success("Item added successfully!");
      onOpenChange(false);
      setErrors({});
      setFormData({
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
        image_urls: [],
        condition: "good",
        usage_frequency: "",
        sharing_level: "private",
        tags: [],
      });
      setBrandSuggestions([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setProcessingReceipt(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const base64Image = reader.result as string;

      // Call edge function to process receipt with AI
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { image: base64Image }
      });

      if (error) throw error;

      if (data?.items && data.items.length > 0) {
        const item = data.items[0]; // Use first item for now
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

  const handleSmartImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSmartImage(reader.result as string);
      toast.success("Photo uploaded! Click analyze to continue.");
    };
    reader.readAsDataURL(file);
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

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success(`Successfully added ${successItems.length} items!`);
      onOpenChange(false);
      setBulkImages([]);
      setBulkAnalyzing(false);
      setMode("select");
    } catch (error) {
      console.error('Error saving bulk items:', error);
      toast.error("Failed to save items");
    }
  };

  const handleRemoveBulkImage = (id: string) => {
    setBulkImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSmartAnalysis = async () => {
    if (!smartInput && !smartImage) {
      toast.error("Please provide either a photo or description");
      return;
    }

    setAnalyzingItem(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: { 
          image: smartImage,
          description: smartInput 
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

      if (data?.success && data.data) {
        const aiData = data.data;
        
        // Map condition to our format
        const conditionMap: Record<string, string> = {
          'new': 'new',
          'like_new': 'like_new',
          'good': 'good',
          'fair': 'fair',
          'poor': 'poor'
        };

        // Find matching category by name (case-insensitive)
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

        setFormData({
          ...formData,
          name: aiData.name || "",
          description: aiData.description || "",
          category_id: categoryId,
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

  // Determine if category needs specific fields
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const isFurnitureCategory = selectedCategory?.name.toLowerCase().includes('furniture') || 
                               selectedCategory?.name.toLowerCase().includes('living room') ||
                               selectedCategory?.name.toLowerCase().includes('bedroom');
  const isClothingCategory = selectedCategory?.name.toLowerCase().includes('clothing') ||
                              selectedCategory?.name.toLowerCase().includes('apparel') ||
                              selectedCategory?.name.toLowerCase().includes('wardrobe');

  // Mode selection screen
  if (mode === "select") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Choose how you'd like to add your item
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
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
              className="p-6 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setMode("catalog-multi")}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <Package className="h-12 w-12 text-primary" />
                <h3 className="font-semibold">EcoInventory Catalog</h3>
                <p className="text-sm text-muted-foreground">
                  Browse personalized recommendations
                </p>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Receipt upload screen
  if (mode === "receipt") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
            <DialogDescription>
              Take a photo or upload an image of your receipt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("select")}
              className="w-full"
            >
              Back to Options
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Bulk Upload screen
  if (mode === "bulk") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📸 Bulk Photo Upload</DialogTitle>
            <DialogDescription>
              Upload 5-10 photos and AI will analyze each item automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
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
                <div className="grid grid-cols-3 gap-4">
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
                    variant="outline"
                    onClick={() => {
                      setMode("select");
                      setBulkImages([]);
                      setBulkAnalyzing(false);
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
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
        </DialogContent>
      </Dialog>
    );
  }

  // Smart Add screen
  if (mode === "smart") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>✨ Smart Add with AI</DialogTitle>
            <DialogDescription>
              Snap a photo or describe your item - AI will fill in the details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
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
                  <Label>Describe your item</Label>
                  <Textarea
                    placeholder="e.g., 'Black Nike running shoes, size 42' or 'Red leather couch from IKEA'"
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include details like color, brand, size, or condition for best results
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMode("select");
                  setSmartInput("");
                  setSmartImage(null);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSmartAnalysis}
                disabled={analyzingItem || (!smartInput && !smartImage)}
                className="flex-1 gap-2"
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
        </DialogContent>
      </Dialog>
    );
  }

  // Personalized catalog multi-select screen
  if (mode === "catalog-multi") {
    const handleBulkAdd = async (selectedProducts: CatalogProduct[]) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Prepare items for insertion
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
        onOpenChange(false);
        setMode("select");
      } catch (error) {
        console.error('Error adding items:', error);
        toast.error('Failed to add items to inventory');
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>EcoInventory Catalog</DialogTitle>
                <DialogDescription>
                  Select multiple items to add to your inventory
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode("select")}
              >
                Back
              </Button>
            </div>
          </DialogHeader>
          <PersonalizedCatalogSelector onAddItems={handleBulkAdd} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                {mode === "manual" && "Fill in the item details"}
                {mode === "internet" && "Search the internet for product details"}
                {mode === "catalog" && "Search our product catalog"}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("select")}
            >
              Back
            </Button>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show search interface for internet and catalog modes */}
          {(mode === "internet" || mode === "catalog") && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <Label>Search for Product</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={mode === "catalog" ? "Search catalog..." : "Search internet..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (mode === "catalog") handleCatalogSearch();
                      else handleInternetSearch();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={mode === "catalog" ? handleCatalogSearch : handleInternetSearch}
                  disabled={searching || !searchQuery.trim()}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Display search results */}
              {mode === "catalog" && catalogResults.length > 0 && (
                <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
                  {catalogResults.map((item) => (
                    <Card
                      key={item.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectCatalogItem(item)}
                    >
                      <div className="flex gap-3">
                        {item.image_urls && item.image_urls.length > 0 && (
                          <img 
                            src={item.image_urls[0]} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          {item.typical_price && (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.typical_price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {mode === "internet" && searchResults.length > 0 && (
                <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <Card
                      key={index}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectResult(result)}
                    >
                      <div className="flex gap-3">
                        {result.imageUrl && (
                          <img 
                            src={result.imageUrl} 
                            alt={result.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{result.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Popover open={showCatalogSuggestions && catalogSuggestions.length > 0} onOpenChange={setShowCatalogSuggestions}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setBrandSuggestions([]);
                        setShowCatalogSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      onFocus={() => setShowCatalogSuggestions(true)}
                      placeholder="e.g., iPhone, MacBook Pro, Running Shoes"
                      maxLength={255}
                      required
                    />
                    {catalogSuggestions.length > 0 && formData.name.length >= 2 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {catalogSuggestions.length} from catalog
                      </span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>No catalog products found.</CommandEmpty>
                      <CommandGroup heading="From Catalog">
                        {catalogSuggestions.map((item) => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => {
                              handleSelectCatalogItem(item);
                              setShowCatalogSuggestions(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex gap-3 w-full">
                              {item.image_urls && item.image_urls.length > 0 && (
                                <img 
                                  src={item.image_urls[0]} 
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{item.name}</div>
                                {item.typical_price && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {formatCurrency(item.typical_price)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <p className="text-xs text-muted-foreground">
                Start typing to see catalog suggestions, or enter your own
              </p>
            </div>
            <div className="grid gap-4">
              <CategorySelector
                value={formData.category_id || null}
                onChange={(categoryId) => setFormData({ ...formData, category_id: categoryId || "" })}
                itemName={formData.name}
                onFeedback={async (feedbackData) => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  
                  await supabase.from("suggestion_feedback").insert({
                    user_id: user.id,
                    item_name: feedbackData.itemName,
                    suggested_category_id: feedbackData.suggestedCategoryId,
                    actual_category_id: feedbackData.actualCategoryId,
                    feedback_type: feedbackData.feedbackType,
                  });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item description"
              rows={3}
              maxLength={2000}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <BrandInput
                value={formData.brand}
                onChange={(brand) => setFormData({ ...formData, brand })}
                categoryId={formData.category_id}
              />
              {errors.brand && <p className="text-sm text-destructive">{errors.brand}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                maxLength={50}
                placeholder="e.g., Black, White, Blue"
              />
              {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Recommended)</Label>
            <TagInput
              value={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
              placeholder="Add tags like 'black', 'winter', 'casual'..."
            />
          </div>

          {isFurnitureCategory && (
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                maxLength={100}
                placeholder='e.g., 72"W x 36"D x 30"H'
              />
              {errors.dimensions && <p className="text-sm text-destructive">{errors.dimensions}</p>}
            </div>
          )}

          {isClothingCategory && (
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => setFormData({ ...formData, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                  <SelectItem value="XXXL">XXXL</SelectItem>
                </SelectContent>
              </Select>
              {errors.size && <p className="text-sm text-destructive">{errors.size}</p>}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10000"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Original Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="1000000"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                placeholder="0.00"
              />
              {errors.original_price && <p className="text-sm text-destructive">{errors.original_price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Purchase Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usage">Usage Frequency</Label>
              <Select
                value={formData.usage_frequency}
                onValueChange={(value) => setFormData({ ...formData, usage_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select usage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never Used</SelectItem>
                  <SelectItem value="daily">Daily Use</SelectItem>
                  <SelectItem value="frequent">Frequently (Weekly)</SelectItem>
                  <SelectItem value="occasional">Occasionally (Monthly)</SelectItem>
                  <SelectItem value="rare">Rarely Used</SelectItem>
                  <SelectItem value="seasonal">Seasonal Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              value={formData.image_urls}
              onChange={(urls) => setFormData({ ...formData, image_urls: urls })}
              label=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sharing">Sharing Options</Label>
            <Select
              value={formData.sharing_level}
              onValueChange={(value: "private" | "friends" | "public") =>
                setFormData({ ...formData, sharing_level: value })
              }
            >
              <SelectTrigger id="sharing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only visible to you</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Friends Only</div>
                      <div className="text-xs text-muted-foreground">Visible to friends</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Visible to everyone</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pointer-events-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
