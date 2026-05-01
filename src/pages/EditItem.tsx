import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { TagInput } from "@/components/dashboard/TagInput";
import { CategorySelector } from "@/components/dashboard/CategorySelector";
import BrandInput from "@/components/dashboard/BrandInput";
import { z } from "zod";
import { QuirkyLoader } from "@/components/QuirkyLoader";

interface Category {
  id: string;
  name: string;
  icon: string;
  parent_id: string | null;
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity must be less than 10000"),
});

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    sharing_price: "",
    is_for_borrow: true,
    is_for_sale: false,
    tags: [] as string[],
    is_donated: false,
    is_sold: false,
    donated_price: "",
    sold_price: "",
    donated_date: "",
    sold_date: "",
    is_eliminated: false,
    eliminated_date: "",
  });

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  };

  const fetchItem = async () => {
    if (!id) return;

    setFetchingItem(true);
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || "",
          description: data.description || "",
          category_id: data.category_id || "",
          brand: data.brand || "",
          color: data.color || "",
          dimensions: data.dimensions || "",
          size: data.size || "",
          quantity: data.quantity || 1,
          original_price: data.original_price?.toString() || "",
          purchase_date: data.purchase_date || "",
          image_urls: data.image_urls || [],
          condition: data.condition || "good",
          usage_frequency: data.usage_frequency || "",
          sharing_level: (data.sharing_level as "private" | "friends" | "public") || "private",
          sharing_price: data.sharing_price?.toString() || "",
          is_for_borrow: data.is_for_borrow ?? true,
          is_for_sale: data.is_for_sale ?? false,
          tags: data.tags || [],
          is_donated: data.is_donated || false,
          is_sold: data.is_sold || false,
          donated_price: data.donated_price?.toString() || "",
          sold_price: data.sold_price?.toString() || "",
          donated_date: data.donated_date || "",
          sold_date: data.sold_date || "",
          is_eliminated: data.is_eliminated || false,
          eliminated_date: data.eliminated_date || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching item:", error);
      toast.error("Failed to load item");
      navigate("/dashboard");
    } finally {
      setFetchingItem(false);
    }
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

    if (!id) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          brand: formData.brand.trim() || null,
          color: formData.color.trim() || null,
          dimensions: formData.dimensions.trim() || null,
          size: formData.size.trim() || null,
          tags: formData.tags,
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          purchase_date: formData.purchase_date || null,
          image_urls: formData.image_urls,
          category_id: formData.category_id || null,
          quantity: formData.quantity,
          condition: formData.condition,
          usage_frequency: formData.usage_frequency || null,
          sharing_level: formData.sharing_level,
          sharing_price: formData.is_for_sale && formData.sharing_price
            ? parseFloat(formData.sharing_price)
            : null,
          is_available_for_sharing: formData.sharing_level !== "private",
          is_for_borrow: formData.sharing_level !== "private" ? formData.is_for_borrow : false,
          is_for_sale: formData.sharing_level !== "private" ? formData.is_for_sale : false,
          is_donated: formData.is_donated,
          is_sold: formData.is_sold,
          donated_price: formData.donated_price ? parseFloat(formData.donated_price) : null,
          sold_price: formData.sold_price ? parseFloat(formData.sold_price) : null,
          donated_date: formData.donated_date || null,
          sold_date: formData.sold_date || null,
          is_eliminated: formData.is_eliminated,
          eliminated_date: formData.eliminated_date || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Item updated successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <QuirkyLoader size="lg" />
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const isFurnitureCategory = selectedCategory?.name.toLowerCase().includes('furniture') || 
                               selectedCategory?.name.toLowerCase().includes('living room') ||
                               selectedCategory?.name.toLowerCase().includes('bedroom');

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
          <h1 className="text-3xl font-bold mb-2">Edit Item</h1>
          <p className="text-muted-foreground">Update item details</p>
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

            <div className="space-y-2">
              <Label htmlFor="usage_frequency">Usage Frequency</Label>
              <Select
                value={formData.usage_frequency}
                onValueChange={(value) => setFormData({ ...formData, usage_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="frequent">Frequent</SelectItem>
                  <SelectItem value="occasional">Occasional</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                </SelectContent>
              </Select>
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

              {formData.sharing_level !== "private" && (
                <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-secondary/30">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    How is this item offered?
                  </Label>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Available to lend</p>
                      <p className="text-xs text-muted-foreground">Neighbors can request to borrow it.</p>
                    </div>
                    <Switch
                      checked={formData.is_for_borrow}
                      onCheckedChange={(v) => setFormData({ ...formData, is_for_borrow: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">For sale</p>
                      <p className="text-xs text-muted-foreground">Set a price and let neighbors buy it.</p>
                    </div>
                    <Switch
                      checked={formData.is_for_sale}
                      onCheckedChange={(v) => setFormData({ ...formData, is_for_sale: v })}
                    />
                  </div>
                  {formData.is_for_sale && (
                    <div className="space-y-1.5">
                      <Label htmlFor="sharing_price" className="text-sm">Asking price (USD)</Label>
                      <Input
                        id="sharing_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sharing_price}
                        onChange={(e) => setFormData({ ...formData, sharing_price: e.target.value })}
                      />
                    </div>
                  )}
                  {!formData.is_for_borrow && !formData.is_for_sale && (
                    <p className="text-xs text-amber-600">
                      Pick at least one — otherwise the item won't appear in the marketplace.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Item Status</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_donated"
                    checked={formData.is_donated}
                    onChange={(e) => setFormData({ ...formData, is_donated: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_donated" className="cursor-pointer">Mark as Donated</Label>
                </div>

                {formData.is_donated && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="donated_price">Donated Price</Label>
                      <Input
                        id="donated_price"
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
                  <input
                    type="checkbox"
                    id="is_sold"
                    checked={formData.is_sold}
                    onChange={(e) => setFormData({ ...formData, is_sold: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_sold" className="cursor-pointer">Mark as Sold</Label>
                </div>

                {formData.is_sold && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="sold_price">Sold Price</Label>
                      <Input
                        id="sold_price"
                        value={formData.sold_price}
                        onChange={(e) => setFormData({ ...formData, sold_price: e.target.value })}
                        placeholder="0.00"
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
                  <input
                    type="checkbox"
                    id="is_eliminated"
                    checked={formData.is_eliminated}
                    onChange={(e) => setFormData({ ...formData, is_eliminated: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_eliminated" className="cursor-pointer">Mark as Eliminated</Label>
                </div>

                {formData.is_eliminated && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="eliminated_date">Eliminated Date</Label>
                    <Input
                      id="eliminated_date"
                      type="date"
                      value={formData.eliminated_date}
                      onChange={(e) => setFormData({ ...formData, eliminated_date: e.target.value })}
                    />
                  </div>
                )}
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItem;
