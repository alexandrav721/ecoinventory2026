import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderPlus, Edit, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  user_id: string | null;
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  icon: z.string().max(2, "Icon must be 2 characters or less").optional(),
});

const EMOJI_CATEGORIES = {
  "Common": ["📦", "📁", "🗂️", "🏷️", "⭐", "💼", "🎯", "📌", "🔖"],
  "Home & Living": ["🏠", "🛋️", "🛏️", "🪑", "🚪", "🪟", "🖼️", "🕯️", "💡"],
  "Technology": ["💻", "📱", "⌚", "🖥️", "⌨️", "🖱️", "🖨️", "📷", "🎮"],
  "Clothing & Fashion": ["👕", "👔", "👗", "👘", "👠", "👟", "👜", "🎒", "👓"],
  "Beauty & Care": ["💄", "💅", "🧴", "🧼", "🧽", "🪥", "🪒", "💆", "💇"],
  "Kitchen & Dining": ["🍳", "🔪", "🥄", "🍽️", "🥘", "☕", "🍷", "🧊", "🧃"],
  "Tools & Hardware": ["🔧", "🔨", "🪛", "🪚", "⚒️", "🛠️", "⚙️", "🔩", "⛏️"],
  "Sports & Fitness": ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🎱", "⛳"],
  "Music & Arts": ["🎵", "🎸", "🎹", "🎨", "🖌️", "✏️", "📐", "📏", "🎭"],
  "Toys & Games": ["🧸", "🎲", "🧩", "🎯", "🪀", "🪁", "🎪", "🎠", "🎡"],
  "Books & Education": ["📚", "📖", "📝", "📓", "📔", "📕", "📗", "📘", "🎓"],
  "Garden & Outdoor": ["🌿", "🌱", "🌻", "🌺", "🪴", "🌳", "🌲", "⛺", "🏕️"],
  "Automotive": ["🚗", "🚙", "🚕", "🚓", "🏎️", "🚜", "🛵", "🚲", "⚙️"],
  "Bathroom": ["🚿", "🛁", "🚽", "🧻", "🧴", "🧼", "🪥", "🧽", "🪣"],
  "Baby & Kids": ["🍼", "👶", "🧷", "🧸", "👣", "🎈", "🎀", "🧦", "👟"],
  "Pet Supplies": ["🐕", "🐈", "🐠", "🦜", "🐹", "🦎", "🐢", "🦔", "🦮"],
  "Office": ["📎", "✂️", "📌", "📍", "🖊️", "✒️", "📏", "📐", "🗄️"],
  "Medical": ["💊", "🩹", "🩺", "💉", "🌡️", "🧬", "🔬", "🧪", "⚕️"],
};

const UserCategoryManager = () => {
  const { isAdmin } = useUserRole();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserId();
    fetchCategories();
  }, []);

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
    
    if (!validateForm()) return;
    if (!userId) {
      toast.error("You must be logged in to create categories");
      return;
    }

    setLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name: name.trim(),
            icon: icon || null,
            parent_id: parentId || null,
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        // Create new category
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
      }

      setName("");
      setIcon("");
      setParentId(null);
      setEditingCategory(null);
      setOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon || "");
    setParentId(category.parent_id);
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      // First check if category is being used
      const checks = await Promise.all([
        supabase.from("product_catalog").select("id", { count: 'exact', head: true }).eq("category_id", deleteCategory.id),
        supabase.from("inventory_items").select("id", { count: 'exact', head: true }).eq("category_id", deleteCategory.id),
        supabase.from("suggested_brands").select("id", { count: 'exact', head: true }).eq("category_id", deleteCategory.id),
        supabase.from("product_category_mappings").select("id", { count: 'exact', head: true }).eq("category_id", deleteCategory.id),
        supabase.from("categories").select("id", { count: 'exact', head: true }).eq("parent_id", deleteCategory.id),
      ]);

      const catalogCount = checks[0].count || 0;
      const itemsCount = checks[1].count || 0;
      const brandsCount = checks[2].count || 0;
      const mappingsCount = checks[3].count || 0;
      const subcatsCount = checks[4].count || 0;

      if (catalogCount > 0 || itemsCount > 0 || brandsCount > 0 || mappingsCount > 0 || subcatsCount > 0) {
        const issues = [];
        if (catalogCount > 0) issues.push(`${catalogCount} catalog product${catalogCount > 1 ? 's' : ''}`);
        if (itemsCount > 0) issues.push(`${itemsCount} inventory item${itemsCount > 1 ? 's' : ''}`);
        if (brandsCount > 0) issues.push(`${brandsCount} brand${brandsCount > 1 ? 's' : ''}`);
        if (mappingsCount > 0) issues.push(`${mappingsCount} product mapping${mappingsCount > 1 ? 's' : ''}`);
        if (subcatsCount > 0) issues.push(`${subcatsCount} subcategor${subcatsCount > 1 ? 'ies' : 'y'}`);
        
        toast.error(
          `Cannot delete "${deleteCategory.name}". It's being used by: ${issues.join(', ')}. Please reassign or delete those first.`,
          { duration: 6000 }
        );
        setDeleteCategory(null);
        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteCategory.id);

      if (error) throw error;
      
      toast.success("Category deleted successfully");
      setDeleteCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      
      // Parse specific database errors
      if (error.code === '23503') {
        toast.error("Cannot delete category - it's still being referenced. Please remove all associated items first.", { duration: 5000 });
      } else {
        toast.error("Failed to delete category");
      }
      setDeleteCategory(null);
    }
  };

  const handleResetToDefaults = async () => {
    if (!userId) return;

    try {
      // First, get all user category IDs
      const userCategoryIds = userCategories.map(cat => cat.id);
      
      if (userCategoryIds.length > 0) {
        // Update all inventory items to remove references to user categories
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ category_id: null })
          .in("category_id", userCategoryIds)
          .eq("user_id", userId);

        if (updateError) throw updateError;

        // Now delete all user-created categories
        const { error: deleteError } = await supabase
          .from("categories")
          .delete()
          .eq("user_id", userId);

        if (deleteError) throw deleteError;
      }
      
      toast.success("All custom categories deleted. Using defaults only.");
      setShowResetDialog(false);
      setExpandedCategories(new Set());
      fetchCategories();
    } catch (error) {
      console.error("Error resetting categories:", error);
      toast.error("Failed to reset categories");
    }
  };

  const userCategories = categories.filter(cat => cat.user_id === userId);
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  
  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  const getCategoryDepth = (categoryId: string): number => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.parent_id) return 0;
    return 1 + getCategoryDepth(category.parent_id);
  };

  const getCategoryPath = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return "";
    if (!category.parent_id) return category.name;
    return getCategoryPath(category.parent_id) + " → " + category.name;
  };

  const getEligibleParents = () => {
    // Only show categories that are at depth 2 or less (so new category will be at depth 3 max)
    return categories.filter(cat => {
      if (cat.id === editingCategory?.id) return false; // Can't be own parent
      const depth = getCategoryDepth(cat.id);
      return depth < 3; // Maximum depth is 3 (0-indexed, so 0, 1, 2)
    });
  };

  const canEdit = (category: Category) => isAdmin || category.user_id === userId;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const CategoryItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = getSubcategories(category.id);
    const isDefault = !category.user_id;
    const paddingLeft = level * 24;
    const depth = getCategoryDepth(category.id);
    const maxDepthReached = depth >= 3;
    const isExpanded = expandedCategories.has(category.id);
    const hasSubcategories = subcategories.length > 0;

    return (
      <div>
        <div 
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <div className="flex items-center gap-2">
            {hasSubcategories ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleCategory(category.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            {hasSubcategories ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Folder className="w-4 h-4 text-muted-foreground" />
              )
            ) : (
              <Folder className="w-4 h-4 text-muted-foreground" />
            )}
            {category.icon && <span className="text-lg">{category.icon}</span>}
            <span className="font-medium">{category.name}</span>
            {isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Default
              </span>
            )}
            {maxDepthReached && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Max Depth
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Level {depth + 1}
            </span>
          </div>
          
          {canEdit(category) && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteCategory(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {isExpanded && subcategories.map(sub => (
          <CategoryItem key={sub.id} category={sub} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Categories</CardTitle>
            <div className="flex gap-2">
              {userCategories.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowResetDialog(true)}
                  className="gap-2"
                >
                  Reset to Defaults
                </Button>
              )}
              <Button onClick={() => {
                setEditingCategory(null);
                setName("");
                setIcon("");
                setParentId(null);
                setOpen(true);
              }} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                New Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {topLevelCategories.length > 0 ? (
            topLevelCategories.map(cat => (
              <CategoryItem key={cat.id} category={cat} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No categories available</p>
              <p className="text-sm">Click "New Category" to create your first one</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setEditingCategory(null);
          setName("");
          setIcon("");
          setParentId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Update the category information"
                  : "Add a new category or subcategory to organize your inventory"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
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
                <div className="flex gap-2">
                  <Input
                    id="icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g., 🍳 or 🔧"
                    maxLength={2}
                    className="flex-1"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        {icon || "😊"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <ScrollArea className="h-80">
                        <div className="p-4 space-y-4">
                          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground">
                                {category}
                              </h4>
                              <div className="grid grid-cols-9 gap-1">
                                {emojis.map((emoji) => (
                                  <Button
                                    key={emoji}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                    onClick={() => {
                                      setIcon(emoji);
                                    }}
                                  >
                                    <span className="text-lg">{emoji}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the emoji button to choose from categories
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Category (Optional)</Label>
                <Select value={parentId || "none"} onValueChange={(val) => setParentId(val === "none" ? null : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {getEligibleParents().map((cat) => {
                      const path = getCategoryPath(cat.id);
                      const depth = getCategoryDepth(cat.id);
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            {cat.icon} {path}
                            <span className="text-xs text-muted-foreground ml-2">
                              (Level {depth + 1})
                            </span>
                            {!cat.user_id && (
                              <span className="text-xs text-primary"> • Default</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Maximum 4 levels: Main → Sub 1 → Sub 2 → Sub 3
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This action cannot be undone.
              Items in this category will need to be recategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to Defaults Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your custom categories ({userCategories.length} {userCategories.length === 1 ? 'category' : 'categories'}). 
              Only the default categories will remain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetToDefaults} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserCategoryManager;
