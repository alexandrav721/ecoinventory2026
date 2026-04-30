import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Search } from "lucide-react";
import ProductMappingsGenerator from "./ProductMappingsGenerator";

interface ProductMapping {
  id: string;
  product_name: string;
  category_id: string;
  keywords: string[];
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

export default function ProductCategoryManager() {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMappings(), fetchCategories()]);
    setLoading(false);
  };

  const fetchMappings = async () => {
    const { data, error } = await supabase
      .from("product_category_mappings")
      .select("*")
      .order("product_name");

    if (error) {
      console.error("Error fetching mappings:", error);
      toast.error("Failed to load product mappings");
      return;
    }

    setMappings(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const getCategoryPath = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return "Unknown";

    const buildPath = (cat: Category): string => {
      if (!cat.parent_id) {
        return `${cat.icon || ""} ${cat.name}`.trim();
      }
      const parent = categories.find(c => c.id === cat.parent_id);
      if (!parent) return `${cat.icon || ""} ${cat.name}`.trim();
      return `${buildPath(parent)} > ${cat.icon || ""} ${cat.name}`.trim();
    };

    return buildPath(category);
  };

  const handleAdd = async () => {
    if (!productName.trim() || !selectedCategory) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const keywordArray = keywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const { error } = await supabase
      .from("product_category_mappings")
      .insert({
        product_name: productName.trim(),
        category_id: selectedCategory,
        keywords: keywordArray,
        created_by: user.id,
      });

    if (error) {
      console.error("Error adding mapping:", error);
      toast.error("Failed to add product mapping");
      return;
    }

    toast.success("Product mapping added successfully");
    setProductName("");
    setSelectedCategory("");
    setKeywords("");
    setOpen(false);
    fetchMappings();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("product_category_mappings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting mapping:", error);
      toast.error("Failed to delete product mapping");
      return;
    }

    toast.success("Product mapping deleted");
    fetchMappings();
  };

  const filteredMappings = mappings.filter(mapping =>
    mapping.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ProductMappingsGenerator />
      
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Category Mappings</CardTitle>
            <CardDescription>
              Define which categories should be suggested for product names
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product Mapping</DialogTitle>
                <DialogDescription>
                  Map a product name to a category for autocomplete suggestions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    placeholder="e.g., Pajamas"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryPath(category.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., sleepwear, nightwear, pjs"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Add Mapping
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search product names or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredMappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No mappings match your search" : "No product mappings yet. Add one to get started!"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{mapping.product_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {getCategoryPath(mapping.category_id)}
                  </div>
                  {mapping.keywords && mapping.keywords.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {mapping.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(mapping.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
