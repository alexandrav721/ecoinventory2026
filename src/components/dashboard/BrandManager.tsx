import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Brand {
  id: string;
  brand_name: string;
  category_id: string | null;
  usage_count: number;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suggested_brands")
      .select("*")
      .order("usage_count", { ascending: false });

    if (error) {
      toast.error("Failed to load brands");
      console.error(error);
    } else {
      setBrands(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("name");

    setCategories(data || []);
  };

  const handleAdd = async () => {
    if (!newBrand.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase
      .from("suggested_brands")
      .insert({
        brand_name: newBrand.trim(),
        category_id: selectedCategory || null,
        created_by: user.id,
      });

    if (error) {
      toast.error("Failed to add brand");
      console.error(error);
    } else {
      toast.success("Brand added");
      setNewBrand("");
      setSelectedCategory("");
      setOpen(false);
      fetchBrands();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("suggested_brands")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete brand");
      console.error(error);
    } else {
      toast.success("Brand deleted");
      fetchBrands();
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "All Categories";
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon || ""} ${category.name}`.trim() : "Unknown";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Brand Suggestions</CardTitle>
            <CardDescription>
              Manage suggested brands that appear in the autocomplete
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Brand name (e.g., Nike, Apple, IKEA)"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category (Optional)
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Add Brand
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : brands.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No brands yet. Add your first brand to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-medium block">{brand.brand_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getCategoryName(brand.category_id)}
                    </span>
                  </div>
                  {brand.usage_count > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {brand.usage_count}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(brand.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}