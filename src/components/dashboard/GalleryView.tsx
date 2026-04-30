import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryGalleryCard } from "./CategoryGalleryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ImageIcon, ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ItemDetailDialog from "./ItemDetailDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { useDemo } from "@/contexts/DemoContext";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  quantity: number;
  original_price: number | null;
  purchase_date: string | null;
  image_urls: string[] | null;
  condition: string | null;
  usage_frequency: string | null;
  is_available_for_sharing: boolean;
  sharing_level: string | null;
  sharing_price: number | null;
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

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

interface CategoryWithItems {
  category: Category;
  items: InventoryItem[];
}

export function GalleryView() {
  const navigate = useNavigate();
  const [categoriesWithItems, setCategoriesWithItems] = useState<CategoryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { isDemoMode, demoItems, demoCategories } = useDemo();

  useEffect(() => {
    // Demo mode: use demo data
    if (isDemoMode) {
      const items = demoItems as unknown as InventoryItem[];
      const categories = demoCategories as unknown as Category[];
      
      const grouped: CategoryWithItems[] = [];
      const uncategorizedItems: InventoryItem[] = [];

      items.forEach((item) => {
        if (!item.category_id) {
          uncategorizedItems.push(item);
        } else {
          const category = categories.find((c) => c.id === item.category_id);
          if (category) {
            const existing = grouped.find((g) => g.category.id === category.id);
            if (existing) {
              existing.items.push(item);
            } else {
              grouped.push({ category, items: [item] });
            }
          }
        }
      });

      if (uncategorizedItems.length > 0) {
        grouped.push({
          category: {
            id: "uncategorized",
            name: "Uncategorized",
            icon: null,
            parent_id: null,
          },
          items: uncategorizedItems,
        });
      }

      grouped.sort((a, b) => b.items.length - a.items.length);
      setCategoriesWithItems(grouped);
      setLoading(false);
      return;
    }

    fetchData();

    // Subscribe to realtime changes
    const itemsChannel = supabase
      .channel("gallery_inventory_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel("gallery_category_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [isDemoMode, demoItems, demoCategories]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [itemsResult, categoriesResult] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_donated", false)
          .eq("is_sold", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .order("name"),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      const items = itemsResult.data || [];
      const categories = categoriesResult.data || [];

      // Group items by category
      const grouped: CategoryWithItems[] = [];
      const uncategorizedItems: InventoryItem[] = [];

      items.forEach((item) => {
        if (!item.category_id) {
          uncategorizedItems.push(item);
        } else {
          const category = categories.find((c) => c.id === item.category_id);
          if (category) {
            const existing = grouped.find((g) => g.category.id === category.id);
            if (existing) {
              existing.items.push(item);
            } else {
              grouped.push({ category, items: [item] });
            }
          }
        }
      });

      // Add uncategorized if there are any
      if (uncategorizedItems.length > 0) {
        grouped.push({
          category: {
            id: "uncategorized",
            name: "Uncategorized",
            icon: null,
            parent_id: null,
          },
          items: uncategorizedItems,
        });
      }

      // Sort by number of items (descending)
      grouped.sort((a, b) => b.items.length - a.items.length);

      setCategoriesWithItems(grouped);
    } catch (error) {
      console.error("Error fetching gallery data:", error);
      toast.error("Failed to load gallery data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Item deleted successfully");
      setDeletingItemId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(error.message || "Failed to delete item");
    }
  };

  const handleDuplicate = async (item: InventoryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("inventory_items").insert([
        {
          name: `${item.name} (Copy)`,
          description: item.description,
          brand: item.brand,
          color: item.color,
          dimensions: item.dimensions,
          size: item.size,
          user_id: user.id,
          original_price: item.original_price,
          purchase_date: item.purchase_date,
          image_urls: item.image_urls,
          category_id: item.category_id,
          quantity: item.quantity,
          condition: item.condition,
          usage_frequency: item.usage_frequency,
          is_available_for_sharing: item.is_available_for_sharing,
          is_donated: false,
          is_sold: false,
        },
      ]);

      if (error) throw error;

      toast.success("Item duplicated successfully!");
      fetchData();
    } catch (error: any) {
      console.error("Error duplicating item:", error);
      toast.error(error.message || "Failed to duplicate item");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    );
  }

  if (categoriesWithItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items in your inventory yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithItems.map(({ category, items }) => (
          <CategoryGalleryCard
            key={category.id}
            categoryName={category.name}
            categoryIcon={category.icon}
            items={items}
            totalItems={items.length}
            onViewAll={() => setSelectedCategory({ category, items })}
          />
        ))}
      </div>

      {/* Category Detail Dialog */}
      <Dialog
        open={selectedCategory !== null}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
      >
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="flex items-center gap-2">
                {selectedCategory?.category.icon && (
                  <span className="text-2xl">{selectedCategory.category.icon}</span>
                )}
                {selectedCategory?.category.name} ({selectedCategory?.items.length} items)
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedCategory && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCategory.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_urls && item.image_urls.length > 0 && item.image_urls[0] ? (
                        item.image_urls[0].startsWith("emoji:") ? (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <span className="text-3xl">{item.image_urls[0].slice(6)}</span>
                          </div>
                        ) : (
                          <img
                            src={item.image_urls[0]}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setImagePreview(item.image_urls![0])}
                          />
                        )
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => setViewingItem(item)}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell>{item.brand || "-"}</TableCell>
                    <TableCell className="capitalize">{item.condition || "-"}</TableCell>
                    <TableCell>
                      {item.original_price ? formatCurrency(item.original_price) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(item)}
                          title="Duplicate item"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/edit-item/${item.id}`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingItemId(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreview !== null} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="max-w-3xl">
          <img
            src={imagePreview || ""}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>


      {/* Item Detail Dialog */}
      {viewingItem && (
        <ItemDetailDialog
          item={viewingItem}
          open={!!viewingItem}
          onOpenChange={(open) => !open && setViewingItem(null)}
          onItemUpdated={() => {
            fetchData();
            setViewingItem(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deletingItemId !== null} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingItemId && handleDelete(deletingItemId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
