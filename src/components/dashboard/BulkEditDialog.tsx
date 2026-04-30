import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemIds: string[];
  onSuccess: () => void;
}

export default function BulkEditDialog({ open, onOpenChange, selectedItemIds, onSuccess }: BulkEditDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryId, setCategoryId] = useState<string>("");
  const [condition, setCondition] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

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

  const handleSubmit = async () => {
    if (!categoryId && !condition) {
      toast.error("Please select at least one field to update");
      return;
    }

    setLoading(true);
    try {
      const updates: any = {};
      if (categoryId) updates.category_id = categoryId;
      if (condition) updates.condition = condition;

      const { error } = await supabase
        .from("inventory_items")
        .update(updates)
        .in("id", selectedItemIds);

      if (error) throw error;

      const fieldNames = [];
      if (categoryId) fieldNames.push("category");
      if (condition) fieldNames.push("condition");

      toast.success(
        `Updated ${fieldNames.join(", ")} for ${selectedItemIds.length} ${selectedItemIds.length === 1 ? 'item' : 'items'}`
      );

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error updating items:", error);
      toast.error("Failed to update items");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoryId("");
    setCondition("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {selectedItemIds.length} Items</DialogTitle>
          <DialogDescription>
            Update category or condition for the selected items. Leave fields empty to keep their current values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Category (optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">Clear category</SelectItem>
                {categories.map((category) => {
                  const depth = getCategoryDepth(category.id);
                  const indent = "  ".repeat(depth);
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      {indent}
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Condition (optional)</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">Clear condition</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Like New">Like New</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {selectedItemIds.length} {selectedItemIds.length === 1 ? 'Item' : 'Items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
