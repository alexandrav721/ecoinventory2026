import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import ItemDetailDialog from "./ItemDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  image_urls: string[] | null;
  brand: string | null;
  condition: string | null;
  category_id: string | null;
  quantity: number | null;
  original_price: number | null;
  purchase_date: string | null;
  usage_frequency: string | null;
  is_available_for_sharing: boolean | null;
  sharing_level: string | null;
  sharing_price: number | null;
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
  categories?: {
    name: string;
  };
}

interface LocationGroup {
  location: string;
  items: InventoryItem[];
  count: number;
}

export const LocationView = () => {
  const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchItemsByLocation();
  }, []);

  const fetchItemsByLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: items, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          categories (name)
        `)
        .eq("user_id", user.id)
        .order("location");

      if (error) throw error;

      // Group items by location
      const groupMap = new Map<string, InventoryItem[]>();
      
      items?.forEach((item) => {
        const location = item.location || "Unassigned";
        if (!groupMap.has(location)) {
          groupMap.set(location, []);
        }
        groupMap.get(location)?.push(item as InventoryItem);
      });

      // Convert to array and sort by location name
      const groups: LocationGroup[] = Array.from(groupMap.entries())
        .map(([location, items]) => ({
          location,
          items,
          count: items.length,
        }))
        .sort((a, b) => {
          // Put "Unassigned" at the end
          if (a.location === "Unassigned") return 1;
          if (b.location === "Unassigned") return -1;
          return a.location.localeCompare(b.location);
        });

      setLocationGroups(groups);
    } catch (error) {
      console.error("Error fetching items by location:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (locationGroups.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <MapPin className="w-12 h-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground">
              Add items to your inventory and assign them locations
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {locationGroups.map((group) => (
          <Card key={group.location}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {group.location}
                </CardTitle>
                <Badge variant="secondary" className="gap-1">
                  <Package className="w-3 h-3" />
                  {group.count} {group.count === 1 ? "item" : "items"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/50 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img
                        src={item.image_urls[0]}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <p className="text-white font-medium text-sm truncate drop-shadow-md">
                        {item.name}
                      </p>
                      {item.categories && (
                        <p className="text-white/80 text-xs truncate drop-shadow-md">
                          {item.categories.name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedItem && (
        <ItemDetailDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onItemUpdated={fetchItemsByLocation}
        />
      )}
    </>
  );
};
