import { useState, useEffect } from "react";
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
import { z } from "zod";
import { Search, Loader2, Users, Globe, Package, Upload, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "./ImageUpload";
import { TagInput } from "./TagInput";
import { CategorySelector } from "./CategorySelector";
import BrandInput from "./BrandInput";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number | null;
  original_price: number | null;
  purchase_date: string | null;
  condition: string | null;
  usage_frequency: string | null;
  image_urls: string[] | null;
  is_available_for_sharing: boolean | null;
  sharing_level: string | null;
  sharing_price: number | null;
  category_id: string | null;
  brand: string | null;
  color: string | null;
  dimensions: string | null;
  size: string | null;
  is_donated: boolean | null;
  is_sold: boolean | null;
  donated_price: number | null;
  sold_price: number | null;
  donated_date: string | null;
  sold_date: string | null;
  is_eliminated: boolean | null;
  eliminated_date: string | null;
}

interface EditItemDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: () => void;
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
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity must be less than 10000"),
  original_price: z.string().max(20, "Price must be less than 20 characters").optional(),
  image_urls: z.array(z.string()).optional(),
});

const EditItemDialog = ({ item, open, onOpenChange, onItemUpdated }: EditItemDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestingBrands, setSuggestingBrands] = useState(false);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityItem[]>([]);
  const [catalogResults, setCatalogResults] = useState<CatalogProduct[]>([]);
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryIcon, setNewSubcategoryIcon] = useState("📦");
  const [creatingCategory, setCreatingCategory] = useState(false);
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
    image_urls: [],
    condition: "good",
    usage_frequency: "",
    sharing_level: "private" as "private" | "friends" | "public",
    sharing_price: "",
    is_donated: false,
    is_sold: false,
    donated_price: "",
    sold_price: "",
    donated_date: "",
    sold_date: "",
    is_eliminated: false,
    eliminated_date: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (item) {
        setFormData({
          name: item.name,
          description: item.description || "",
          category_id: item.category_id || "",
          brand: item.brand || "",
          color: item.color || "",
          dimensions: item.dimensions || "",
          size: item.size || "",
          
          quantity: item.quantity || 1,
          original_price: item.original_price?.toString() || "",
          purchase_date: item.purchase_date || "",
          image_urls: item.image_urls || [],
          condition: item.condition || "good",
          usage_frequency: item.usage_frequency || "",
          sharing_level: (item.sharing_level as "private" | "friends" | "public") || "private",
          sharing_price: item.sharing_price?.toString() || "",
          is_donated: item.is_donated || false,
          is_sold: item.is_sold || false,
          donated_price: item.donated_price?.toString() || "",
          sold_price: item.sold_price?.toString() || "",
          donated_date: item.donated_date || "",
          sold_date: item.sold_date || "",
          is_eliminated: (item as any).is_eliminated || false,
          eliminated_date: (item as any).eliminated_date || "",
          tags: (item as any).tags || [],
        });
      }
    }
  }, [open, item]);

  // Set main category when item category changes
  useEffect(() => {
    if (formData.category_id && categories.length > 0) {
      const findMainCategory = (catId: string): string => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return "";
        if (!cat.parent_id) return cat.id;
        return findMainCategory(cat.parent_id);
      };
      setMainCategoryId(findMainCategory(formData.category_id));
    }
  }, [formData.category_id, categories]);

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
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, description, brand, color, image_urls, condition, category_id, dimensions, size, original_price')
        .eq('is_available_for_sharing', true)
        .neq('id', item?.id || '') // Exclude current item
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

  const handleSelectCommunityItem = (communityItem: CommunityItem) => {
    setFormData({
      ...formData,
      name: communityItem.name,
      description: communityItem.description || "",
      brand: communityItem.brand || "",
      color: communityItem.color || "",
      image_urls: communityItem.image_urls || [],
      condition: communityItem.condition || "good",
      category_id: communityItem.category_id || "",
      dimensions: communityItem.dimensions || "",
      size: communityItem.size || "",
      original_price: communityItem.original_price?.toString() || "",
    });
    setCommunityResults([]);
    setSearchQuery("");
    toast.success("Item details filled from community item");
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

  const handleSelectCatalogItem = (catalogItem: CatalogProduct) => {
    setFormData({
      ...formData,
      name: catalogItem.name,
      description: catalogItem.description || "",
      color: catalogItem.color || "",
      image_urls: catalogItem.image_urls || [],
      category_id: catalogItem.category_id || "",
      dimensions: catalogItem.dimensions || "",
      size: catalogItem.size || "",
      original_price: catalogItem.typical_price?.toString() || "",
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
        quantity: formData.quantity,
        original_price: formData.original_price,
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
      if (!item) throw new Error("No item to update");

      const { error } = await supabase
        .from("inventory_items")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          brand: formData.brand.trim() || null,
          color: formData.color.trim() || null,
          dimensions: formData.dimensions.trim() || null,
          size: formData.size.trim() || null,
          category_id: formData.category_id || null,
          quantity: formData.quantity,
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          purchase_date: formData.purchase_date || null,
          image_urls: formData.image_urls,
          condition: formData.condition,
          usage_frequency: formData.usage_frequency || null,
          sharing_level: formData.sharing_level,
          is_available_for_sharing: formData.sharing_level !== "private",
          sharing_price: formData.sharing_price ? parseFloat(formData.sharing_price) : null,
          is_donated: formData.is_donated,
          is_sold: formData.is_sold,
          donated_price: formData.donated_price ? parseFloat(formData.donated_price) : null,
          sold_price: formData.sold_price ? parseFloat(formData.sold_price) : null,
          donated_date: formData.donated_date || null,
          sold_date: formData.sold_date || null,
          is_eliminated: formData.is_eliminated,
          eliminated_date: formData.eliminated_date || null,
          tags: formData.tags,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item updated successfully!");
      onItemUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  // Determine if category needs specific fields
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const isFurnitureCategory = selectedCategory?.name.toLowerCase().includes('furniture') || 
                               selectedCategory?.name.toLowerCase().includes('living room') ||
                               selectedCategory?.name.toLowerCase().includes('bedroom');
  const isClothingCategory = selectedCategory?.name.toLowerCase().includes('clothing') ||
                              selectedCategory?.name.toLowerCase().includes('apparel') ||
                              selectedCategory?.name.toLowerCase().includes('wardrobe');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details of your inventory item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setBrandSuggestions([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onBlur={suggestBrands}
                placeholder="Item name"
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <BrandInput
                value={formData.brand}
                onChange={(brand) => setFormData({ ...formData, brand })}
                categoryId={formData.category_id}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., Black, White, Blue"
              />
            </div>
          </div>

          <div className="space-y-2">
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
                placeholder='e.g., 72"W x 36"D x 30"H'
              />
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
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Original Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                placeholder="0.00"
              />
              {errors.original_price && <p className="text-sm text-destructive">{errors.original_price}</p>}
            </div>
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

          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              value={formData.image_urls}
              onChange={(urls) => setFormData({ ...formData, image_urls: urls })}
              label=""
            />
          </div>
          {errors.image_url && <p className="text-sm text-destructive">{errors.image_url}</p>}

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

          {formData.sharing_level !== "private" && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="sharing_price">Sharing Price</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sharing_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sharing_price}
                  onChange={(e) => setFormData({ ...formData, sharing_price: e.target.value })}
                  placeholder="0.00"
                />
                <span className="text-sm text-muted-foreground">Leave as 0 or empty for free</span>
              </div>
            </div>
          )}

          {/* Donation/Sale Section */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <h3 className="font-semibold">Donation, Sale & Disposal Tracking</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="donated"
                  checked={formData.is_donated}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, is_donated: checked });
                    if (checked) setFormData(prev => ({ ...prev, is_sold: false, is_eliminated: false }));
                  }}
                />
                <Label htmlFor="donated">Mark as Donated</Label>
              </div>

              {formData.is_donated && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="donated_price">Donated Value</Label>
                    <Input
                      id="donated_price"
                      type="number"
                      step="0.01"
                      value={formData.donated_price}
                      onChange={(e) => setFormData({ ...formData, donated_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donated_date">Donated Date</Label>
                    <Input
                      id="donated_date"
                      type="date"
                      value={formData.donated_date}
                      onChange={(e) => setFormData({ ...formData, donated_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="sold"
                  checked={formData.is_sold}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, is_sold: checked });
                    if (checked) setFormData(prev => ({ ...prev, is_donated: false, is_eliminated: false }));
                  }}
                />
                <Label htmlFor="sold">Mark as Sold</Label>
              </div>

              {formData.is_sold && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="sold_price">Sold Price</Label>
                    <Input
                      id="sold_price"
                      type="number"
                      step="0.01"
                      value={formData.sold_price}
                      onChange={(e) => setFormData({ ...formData, sold_price: e.target.value })}
                      placeholder="0.00"
                      required={formData.is_sold}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sold_date">Sold Date</Label>
                    <Input
                      id="sold_date"
                      type="date"
                      value={formData.sold_date}
                      onChange={(e) => setFormData({ ...formData, sold_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="eliminated"
                  checked={formData.is_eliminated}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, is_eliminated: checked });
                    if (checked) setFormData(prev => ({ ...prev, is_donated: false, is_sold: false }));
                  }}
                />
                <Label htmlFor="eliminated">Mark as Eliminated/Thrown Out</Label>
              </div>

              {formData.is_eliminated && (
                <div className="ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="eliminated_date">Eliminated Date</Label>
                    <Input
                      id="eliminated_date"
                      type="date"
                      value={formData.eliminated_date}
                      onChange={(e) => setFormData({ ...formData, eliminated_date: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
