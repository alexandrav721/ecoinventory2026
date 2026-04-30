import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Merge, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TagUsage {
  tag: string;
  count: number;
  itemIds: string[];
}

export function TagManagement({ userId }: { userId: string }) {
  const [tags, setTags] = useState<TagUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; tag: string; newName: string }>({
    open: false,
    tag: "",
    newName: "",
  });
  const [mergeDialog, setMergeDialog] = useState<{ open: boolean; selectedTags: string[]; mergedName: string }>({
    open: false,
    selectedTags: [],
    mergedName: "",
  });

  useEffect(() => {
    loadTags();
  }, [userId]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const { data: items, error } = await supabase
        .from("inventory_items")
        .select("id, tags")
        .eq("user_id", userId)
        .eq("is_donated", false)
        .eq("is_sold", false)
        .eq("is_eliminated", false);

      if (error) throw error;

      const tagMap = new Map<string, { count: number; itemIds: string[] }>();
      
      items?.forEach((item) => {
        item.tags?.forEach((tag: string) => {
          if (tagMap.has(tag)) {
            const existing = tagMap.get(tag)!;
            existing.count++;
            existing.itemIds.push(item.id);
          } else {
            tagMap.set(tag, { count: 1, itemIds: [item.id] });
          }
        });
      });

      const tagUsages: TagUsage[] = Array.from(tagMap.entries())
        .map(([tag, usage]) => ({ tag, count: usage.count, itemIds: usage.itemIds }))
        .sort((a, b) => b.count - a.count);

      setTags(tagUsages);
    } catch (error) {
      console.error("Error loading tags:", error);
      toast({ title: "Error", description: "Failed to load tags", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!renameDialog.newName.trim() || renameDialog.newName === renameDialog.tag) {
      toast({ title: "Error", description: "Please enter a valid new name", variant: "destructive" });
      return;
    }

    try {
      const tagToRename = tags.find((t) => t.tag === renameDialog.tag);
      if (!tagToRename) return;

      for (const itemId of tagToRename.itemIds) {
        const { data: item, error: fetchError } = await supabase
          .from("inventory_items")
          .select("tags")
          .eq("id", itemId)
          .single();

        if (fetchError) throw fetchError;

        const updatedTags = item.tags.map((t: string) => 
          t === renameDialog.tag ? renameDialog.newName.trim().toLowerCase() : t
        );

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ tags: updatedTags })
          .eq("id", itemId);

        if (updateError) throw updateError;
      }

      toast({ title: "Success", description: `Renamed "${renameDialog.tag}" to "${renameDialog.newName}"` });
      setRenameDialog({ open: false, tag: "", newName: "" });
      loadTags();
    } catch (error) {
      console.error("Error renaming tag:", error);
      toast({ title: "Error", description: "Failed to rename tag", variant: "destructive" });
    }
  };

  const handleMerge = async () => {
    if (mergeDialog.selectedTags.length < 2) {
      toast({ title: "Error", description: "Select at least 2 tags to merge", variant: "destructive" });
      return;
    }

    if (!mergeDialog.mergedName.trim()) {
      toast({ title: "Error", description: "Enter a name for the merged tag", variant: "destructive" });
      return;
    }

    try {
      const mergedTag = mergeDialog.mergedName.trim().toLowerCase();
      const allItemIds = new Set<string>();
      
      mergeDialog.selectedTags.forEach((tag) => {
        const tagUsage = tags.find((t) => t.tag === tag);
        tagUsage?.itemIds.forEach((id) => allItemIds.add(id));
      });

      for (const itemId of Array.from(allItemIds)) {
        const { data: item, error: fetchError } = await supabase
          .from("inventory_items")
          .select("tags")
          .eq("id", itemId)
          .single();

        if (fetchError) throw fetchError;

        const updatedTags = item.tags
          .filter((t: string) => !mergeDialog.selectedTags.includes(t));
        
        if (!updatedTags.includes(mergedTag)) {
          updatedTags.push(mergedTag);
        }

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ tags: updatedTags })
          .eq("id", itemId);

        if (updateError) throw updateError;
      }

      toast({ 
        title: "Success", 
        description: `Merged ${mergeDialog.selectedTags.length} tags into "${mergedTag}"` 
      });
      setMergeDialog({ open: false, selectedTags: [], mergedName: "" });
      loadTags();
    } catch (error) {
      console.error("Error merging tags:", error);
      toast({ title: "Error", description: "Failed to merge tags", variant: "destructive" });
    }
  };

  const handleDelete = async (tag: string) => {
    if (!confirm(`Delete "${tag}" from all items?`)) return;

    try {
      const tagUsage = tags.find((t) => t.tag === tag);
      if (!tagUsage) return;

      for (const itemId of tagUsage.itemIds) {
        const { data: item, error: fetchError } = await supabase
          .from("inventory_items")
          .select("tags")
          .eq("id", itemId)
          .single();

        if (fetchError) throw fetchError;

        const updatedTags = item.tags.filter((t: string) => t !== tag);

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ tags: updatedTags })
          .eq("id", itemId);

        if (updateError) throw updateError;
      }

      toast({ title: "Success", description: `Deleted "${tag}" from all items` });
      loadTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({ title: "Error", description: "Failed to delete tag", variant: "destructive" });
    }
  };

  const filteredTags = tags.filter((t) => 
    t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTagForMerge = (tag: string) => {
    setMergeDialog((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Management</CardTitle>
        <CardDescription>
          Manage your tags: rename, merge similar tags, or remove unused ones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setMergeDialog({ open: true, selectedTags: [], mergedName: "" })}
              variant="outline"
            >
              <Merge className="w-4 h-4 mr-2" />
              Merge Tags
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tags...</p>
          ) : filteredTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No matching tags found" : "No tags found. Add tags to your items to see them here."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTags.map((tagUsage) => (
                <div
                  key={tagUsage.tag}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm">
                      {tagUsage.tag}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {tagUsage.count} item{tagUsage.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setRenameDialog({ open: true, tag: tagUsage.tag, newName: tagUsage.tag })
                      }
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(tagUsage.tag)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rename Dialog */}
        <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Tag</DialogTitle>
              <DialogDescription>
                This will rename the tag across all items that use it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current name</Label>
                <Input value={renameDialog.tag} disabled />
              </div>
              <div>
                <Label>New name</Label>
                <Input
                  value={renameDialog.newName}
                  onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
                  placeholder="Enter new tag name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialog({ open: false, tag: "", newName: "" })}>
                Cancel
              </Button>
              <Button onClick={handleRename}>Rename</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Merge Dialog */}
        <Dialog open={mergeDialog.open} onOpenChange={(open) => setMergeDialog({ ...mergeDialog, open })}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Merge Tags</DialogTitle>
              <DialogDescription>
                Select tags to merge into a single tag. All items will be updated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
                {tags.map((tagUsage) => (
                  <div key={tagUsage.tag} className="flex items-center gap-2">
                    <Checkbox
                      id={`merge-${tagUsage.tag}`}
                      checked={mergeDialog.selectedTags.includes(tagUsage.tag)}
                      onCheckedChange={() => toggleTagForMerge(tagUsage.tag)}
                    />
                    <label
                      htmlFor={`merge-${tagUsage.tag}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Badge variant="secondary">{tagUsage.tag}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({tagUsage.count} items)
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              {mergeDialog.selectedTags.length > 0 && (
                <div>
                  <Label>Merged tag name</Label>
                  <Input
                    value={mergeDialog.mergedName}
                    onChange={(e) => setMergeDialog({ ...mergeDialog, mergedName: e.target.value })}
                    placeholder="Enter name for merged tag"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {mergeDialog.selectedTags.join(", ")}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMergeDialog({ open: false, selectedTags: [], mergedName: "" })}
              >
                Cancel
              </Button>
              <Button onClick={handleMerge} disabled={mergeDialog.selectedTags.length < 2}>
                Merge {mergeDialog.selectedTags.length > 0 && `(${mergeDialog.selectedTags.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
