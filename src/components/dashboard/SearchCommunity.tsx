import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CommunityItem {
  id: string;
  name: string;
  description: string | null;
  condition: string | null;
  user_id: string;
  profiles: {
    full_name: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  distance?: number;
}

const SearchCommunity = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<string>("all");

  useEffect(() => {
    // Get user's location on component mount
    const getUserLocation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("latitude, longitude")
          .eq("id", user.id)
          .single();

        if (profile?.latitude && profile?.longitude) {
          setUserLocation({ lat: profile.latitude, lng: profile.longitude });
        }
      } catch (error) {
        console.error("Error getting user location:", error);
      }
    };

    getUserLocation();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          id,
          name,
          description,
          condition,
          user_id,
          profiles!inner(
            full_name,
            latitude,
            longitude
          )
        `)
        .or("sharing_level.eq.public,sharing_level.eq.friends")
        .ilike("name", `%${searchQuery}%`)
        .neq("user_id", user?.id || "");

      if (error) throw error;

      // Calculate distances if user has location set
      let itemsWithDistance: CommunityItem[] = data || [];
      if (userLocation) {
        itemsWithDistance = (data || []).map((item: any) => {
          const ownerProfile = item.profiles;
          if (ownerProfile?.latitude && ownerProfile?.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              ownerProfile.latitude,
              ownerProfile.longitude
            );
            return { ...item, distance: Math.round(distance * 10) / 10 };
          }
          return { ...item, distance: undefined };
        });

        // Sort by distance
        itemsWithDistance.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }

      // Apply distance filter
      if (distanceFilter !== "all" && userLocation) {
        const maxDistance = parseFloat(distanceFilter);
        itemsWithDistance = itemsWithDistance.filter(item => 
          item.distance !== undefined && item.distance <= maxDistance
        );
      }
      
      setResults(itemsWithDistance);
      
      // Log search anonymously
      await supabase.from("search_logs").insert({
        search_term: searchQuery,
        search_type: "community",
        result_count: itemsWithDistance.length,
      });
      
      if (itemsWithDistance.length === 0) {
        toast.info("No items found matching your search");
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search community inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (itemName: string) => {
    toast.info("Contact feature coming soon! In-app messaging will be available to reach item owners.");
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Community Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search for items (e.g., drill, laptop, bicycle)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          
          {userLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Distance filter:</span>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All distances</SelectItem>
                  <SelectItem value="5">Within 5 miles</SelectItem>
                  <SelectItem value="10">Within 10 miles</SelectItem>
                  <SelectItem value="25">Within 25 miles</SelectItem>
                  <SelectItem value="50">Within 50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Found {results.length} item{results.length !== 1 ? "s" : ""} available for sharing
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {results.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.condition && (
                            <Badge variant="outline" className="capitalize">
                              {item.condition}
                            </Badge>
                          )}
                          {item.distance !== undefined && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.distance} mi
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Owner: {item.profiles.full_name || "Anonymous"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContact(item.name)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchCommunity;
