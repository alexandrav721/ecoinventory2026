import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  quantity: number;
  original_price: number | null;
  image_urls: string[] | null;
  is_donated: boolean | null;
  is_sold: boolean | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
}

type DuplicateMode = "exact" | "level1" | "level2" | "level3" | "level4" | "ai-similarity";

interface AIGroup {
  groupName: string;
  reason: string;
  itemIds: string[];
}

const DuplicateAnalyzer = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<DuplicateMode>("exact");
  const [loading, setLoading] = useState(true);
  const [aiGroups, setAiGroups] = useState<AIGroup[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [itemsResult, categoriesResult] = await Promise.all([
        supabase.from("inventory_items").select("*").eq("user_id", user.id).eq("is_donated", false).eq("is_sold", false),
        supabase.from("categories").select("*")
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setItems(itemsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryPath = (categoryId: string | null): Category[] => {
    if (!categoryId) return [];
    
    const path: Category[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const category = categories.find(c => c.id === currentId);
      if (!category) break;
      path.unshift(category);
      currentId = category.parent_id;
    }
    
    return path;
  };

  const getCategoryAtLevel = (categoryId: string | null, level: number): string | null => {
    const path = getCategoryPath(categoryId);
    return path[level - 1]?.id || null;
  };

  const analyzeWithAI = async () => {
    setAiLoading(true);
    try {
      // Prepare items with category paths
      const itemsWithPaths = items.map(item => ({
        ...item,
        categoryPath: getCategoryPath(item.category_id).map(c => c.name).join(" › ")
      }));

      const { data, error } = await supabase.functions.invoke('analyze-similar-items', {
        body: { items: itemsWithPaths }
      });

      if (error) throw error;
      
      setAiGroups(data.groups || []);
    } catch (error) {
      console.error("Error analyzing with AI:", error);
      setAiGroups([]);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "ai-similarity" && items.length > 0 && aiGroups.length === 0) {
      analyzeWithAI();
    }
  }, [mode, items]);

  const getDuplicateGroups = () => {
    if (mode === "ai-similarity") {
      // Convert AI groups to the same format as regular groups
      return aiGroups.map(group => {
        const groupItems = items.filter(item => group.itemIds.includes(item.id));
        return [`${group.groupName}|${group.reason}`, groupItems] as [string, InventoryItem[]];
      });
    }

    const groups: Record<string, InventoryItem[]> = {};

    items.forEach(item => {
      let key: string;
      
      if (mode === "exact") {
        key = `${item.name}|${item.brand || "no-brand"}`;
      } else {
        const level = parseInt(mode.replace("level", ""));
        const path = getCategoryPath(item.category_id);
        
        // Build key from full path up to specified level
        const pathUpToLevel = path.slice(0, level);
        const categoryIds = pathUpToLevel.map(c => c.id).join("|");
        const categoryNames = pathUpToLevel.map(c => c.name).join(" › ");
        
        key = categoryIds || "uncategorized";
        
        // Include full category path in the key for display
        key = `${categoryNames || "Uncategorized"}|${categoryIds || "none"}`;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // Filter to only groups with more than one item
    return Object.entries(groups).filter(([_, items]) => items.length > 1);
  };

  const duplicateGroups = getDuplicateGroups();
  const totalDuplicates = duplicateGroups.reduce((sum, [_, items]) => sum + items.length, 0);

  if (loading || (mode === "ai-similarity" && aiLoading)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Similar Items Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Similar Items Analysis
            {totalDuplicates > 0 && (
              <Badge variant="secondary">{totalDuplicates} items</Badge>
            )}
          </CardTitle>
          <Select value={mode} onValueChange={(value) => setMode(value as DuplicateMode)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai-similarity">🤖 AI-Powered Similarity</SelectItem>
              <SelectItem value="exact">Exact Product Match</SelectItem>
              <SelectItem value="level1">Level 1 Category</SelectItem>
              <SelectItem value="level2">Level 2 Category</SelectItem>
              <SelectItem value="level3">Level 3 Category</SelectItem>
              <SelectItem value="level4">Level 4 Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {duplicateGroups.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No similar items found with current settings
          </p>
        ) : (
          <div className="space-y-6">
            {duplicateGroups.map(([key, groupItems]) => {
              const isAIMode = mode === "ai-similarity";
              const displayName = isAIMode
                ? key.split("|")[0]
                : mode === "exact" 
                ? key.split("|")[0] + (key.split("|")[1] !== "no-brand" ? ` (${key.split("|")[1]})` : "")
                : key.split("|")[0];
              const aiReason = isAIMode ? key.split("|")[1] : null;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{displayName}</h3>
                      {aiReason && (
                        <p className="text-sm text-muted-foreground mt-1">{aiReason}</p>
                      )}
                    </div>
                    <Badge>{groupItems.length} items</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {groupItems.map(item => {
                      const categoryPath = getCategoryPath(item.category_id);
                      const categoryPathStr = categoryPath.map(c => c.name).join(" › ");
                      
                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <div className="flex gap-3 p-3">
                            {item.image_urls && item.image_urls.length > 0 && (
                              <img 
                                src={item.image_urls[0]} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              {item.brand && (
                                <p className="text-xs text-muted-foreground">{item.brand}</p>
                              )}
                              {categoryPathStr && (
                                <p className="text-xs text-muted-foreground truncate">{categoryPathStr}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Qty: {item.quantity}
                                </Badge>
                                {item.original_price && (
                                  <span className="text-xs text-muted-foreground">
                                    ${item.original_price}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DuplicateAnalyzer;
