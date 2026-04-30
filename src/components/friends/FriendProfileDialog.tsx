import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, MapPin, Search, Filter } from "lucide-react";
import { toast } from "sonner";

interface FriendProfileDialogProps {
  friendId: string;
  friendName: string;
  friendAvatar: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendProfileDialog({
  friendId,
  friendName,
  friendAvatar,
  open,
  onOpenChange,
}: FriendProfileDialogProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");

  useEffect(() => {
    if (open && friendId) {
      fetchFriendData();
    }
  }, [open, friendId]);

  const fetchFriendData = async () => {
    try {
      setLoading(true);

      // Fetch friend's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("city, state")
        .eq("id", friendId)
        .single();

      setProfile(profileData);

      // Fetch friend's shared items
      const { data: itemsData, error } = await supabase
        .from("inventory_items")
        .select(`
          id,
          name,
          description,
          condition,
          image_url,
          brand,
          category_id,
          categories (name)
        `)
        .eq("user_id", friendId)
        .eq("is_available_for_sharing", true);

      if (error) throw error;
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching friend data:", error);
      toast.error("Failed to load friend's data");
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories and conditions for filters
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      items
        .filter((item) => item.categories?.name)
        .map((item) => item.categories.name)
    );
    return Array.from(uniqueCategories).sort();
  }, [items]);

  const conditions = useMemo(() => {
    const uniqueConditions = new Set(
      items.filter((item) => item.condition).map((item) => item.condition)
    );
    return Array.from(uniqueConditions).sort();
  }, [items]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || item.categories?.name === categoryFilter;

      // Condition filter
      const matchesCondition =
        conditionFilter === "all" || item.condition === conditionFilter;

      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [items, searchQuery, categoryFilter, conditionFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="w-16 h-16">
              <AvatarImage src={friendAvatar} />
              <AvatarFallback>{friendName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{friendName}</DialogTitle>
              {profile?.city && profile?.state && (
                <DialogDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city}, {profile.state}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Shared Items ({filteredItems.length} of {items.length})
            </h3>
          </div>

          {!loading && items.length > 0 && (
            <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4" />
                <span className="font-medium text-sm">Filters</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm">
                    Category
                  </Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-sm">
                    Condition
                  </Label>
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="All conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All conditions</SelectItem>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {friendName} hasn't shared any items yet
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items match your filters
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.name}</h4>
                        {item.categories?.name && (
                          <Badge variant="secondary" className="mt-1">
                            {item.categories.name}
                          </Badge>
                        )}
                        {item.brand && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.brand}
                          </p>
                        )}
                        {item.condition && (
                          <p className="text-sm text-muted-foreground">
                            Condition: {item.condition}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
