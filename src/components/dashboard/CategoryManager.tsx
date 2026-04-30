import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  icon: z.string().max(2, "Icon must be 2 characters or less").optional(),
});

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  user_id: string | null;
}

const CategoryManager = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchUserId();
    }
  }, [open]);

  const fetchUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const validateForm = () => {
    try {
      categorySchema.parse({ name, icon: icon || undefined });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to create categories");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert({
          name: name.trim(),
          icon: icon || null,
          parent_id: parentId || null,
          user_id: userId,
        });

      if (error) throw error;

      toast.success("Category created successfully");
      setName("");
      setIcon("");
      setParentId(null);
      setOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const topLevelCategories = categories.filter(cat => !cat.parent_id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category or subcategory to organize your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kitchen Appliances"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Optional)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., 🍳 or 🔧"
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">
                Use an emoji to represent this category
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category (Optional)</Label>
              <Select value={parentId || "none"} onValueChange={(val) => setParentId(val === "none" ? null : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {topLevelCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Create a subcategory by selecting a parent
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;
