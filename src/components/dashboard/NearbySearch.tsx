import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NearbyItem {
  item_id: string;
  item_name: string;
  item_description: string;
  owner_id: string;
  owner_email: string;
  owner_name: string;
  distance: number;
  quantity: number;
}

const NearbySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [radius, setRadius] = useState("10");
  const [results, setResults] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter an item to search for");
      return;
    }

    if (!radius || parseFloat(radius) <= 0) {
      toast.error("Please enter a valid radius");
      return;
    }

    setLoading(true);
    try {
      // Get current user's profile with location
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to search");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("latitude, longitude")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.latitude || !profile?.longitude) {
        toast.error("Please set your location in your profile first");
        return;
      }

      setUserLocation({ lat: profile.latitude, lng: profile.longitude });

      // Search for items available for sharing that match the search term
      const { data: items, error: itemsError } = await supabase
        .from("inventory_items")
        .select(`
          id,
          name,
          description,
          quantity,
          user_id,
          profiles!inventory_items_user_id_fkey (
            id,
            email,
            full_name,
            latitude,
            longitude
          )
        `)
        .eq("is_available_for_sharing", true)
        .ilike("name", `%${searchTerm}%`)
        .neq("user_id", user.id);

      if (itemsError) throw itemsError;

      // Calculate distances and filter by radius
      const itemsWithDistance = items
        ?.map((item: any) => {
          const ownerProfile = item.profiles;
          if (!ownerProfile?.latitude || !ownerProfile?.longitude) {
            return null;
          }

          // Calculate distance using Haversine formula
          const lat1 = profile.latitude;
          const lon1 = profile.longitude;
          const lat2 = ownerProfile.latitude;
          const lon2 = ownerProfile.longitude;

          const R = 3959; // Earth's radius in miles
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance <= parseFloat(radius)) {
            return {
              item_id: item.id,
              item_name: item.name,
              item_description: item.description,
              owner_id: ownerProfile.id,
              owner_email: ownerProfile.email,
              owner_name: ownerProfile.full_name || "Anonymous",
              distance: Math.round(distance * 10) / 10,
              quantity: item.quantity,
            };
          }
          return null;
        })
        .filter((item): item is NearbyItem => item !== null)
        .sort((a, b) => a.distance - b.distance);

      setResults(itemsWithDistance || []);
      
      // Log search anonymously
      await supabase.from("search_logs").insert({
        search_term: searchTerm,
        search_type: "nearby",
        result_count: itemsWithDistance?.length || 0,
      });
      
      if (itemsWithDistance?.length === 0) {
        toast.info(`No users found within ${radius} miles with "${searchTerm}"`);
      } else {
        toast.success(`Found ${itemsWithDistance?.length} nearby items`);
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search for items");
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyUser = async (item: NearbyItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("notifications").insert({
        sender_id: user.id,
        recipient_id: item.owner_id,
        item_id: item.item_id,
        message: `I'm interested in your "${item.item_name}". Can we connect?`,
      });

      if (error) throw error;

      toast.success(`Notification sent to ${item.owner_name}`);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Find Items Nearby
        </CardTitle>
        <CardDescription>
          Search for items you want to buy and find neighbors who have them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="What are you looking for?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="w-40">
            <div className="relative">
              <Input
                type="number"
                placeholder="Radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                min="1"
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                miles
              </span>
            </div>
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "result" : "results"} found
            </h3>
            {results.map((item) => (
              <Card key={item.item_id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {item.owner_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.item_name}</h4>
                          <Badge variant="secondary">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                        {item.item_description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.item_description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Owner: {item.owner_name}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium text-primary">
                            {item.distance} miles away
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleNotifyUser(item)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Notify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbySearch;
