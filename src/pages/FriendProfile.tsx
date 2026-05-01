import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, MapPin, Search, Filter, Users, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ChatDialog } from "@/components/chat/ChatDialog";

interface Item {
  id: string;
  name: string;
  description: string;
  condition: string;
  image_urls: string[] | null;
  brand: string;
  category_id: string;
  categories: { name: string } | null;
}

export default function FriendProfile() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [expressedInterest, setExpressedInterest] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatItem, setChatItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        navigate("/auth");
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    if (friendId && currentUserId) {
      fetchFriendData();
    }
  }, [friendId, currentUserId]);

  const fetchFriendData = async () => {
    if (!friendId || !currentUserId) return;
    
    try {
      setLoading(true);

      // Fetch friend's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, friends_display_name, full_name, friends_avatar_url, avatar_url, city, state, email")
        .eq("id", friendId)
        .single();

      if (profileData) {
        setProfile({
          ...profileData,
          display_name: profileData.friends_display_name || profileData.full_name,
          avatar: profileData.friends_avatar_url || profileData.avatar_url
        });
      }

      // Fetch friend's shared items
      const { data: itemsData } = await supabase
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
        .in("sharing_level", ["friends", "public"]);

      setItems(itemsData || []);

      // Fetch mutual friends
      // Get current user's friends
      const { data: myFriendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      const myFriendIds = myFriendships?.map(f => 
        f.user_id === currentUserId ? f.friend_id : f.user_id
      ) || [];

      // Get friend's friends
      const { data: theirFriendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`);

      const theirFriendIds = theirFriendships?.map(f => 
        f.user_id === friendId ? f.friend_id : f.user_id
      ) || [];

      // Find mutual friend IDs
      const mutualFriendIds = myFriendIds.filter(id => theirFriendIds.includes(id));

      if (mutualFriendIds.length > 0) {
        const { data: mutualProfiles } = await supabase
          .from("profiles")
          .select("id, friends_display_name, full_name, friends_avatar_url, avatar_url")
          .in("id", mutualFriendIds);

        if (mutualProfiles) {
          setMutualFriends(mutualProfiles.map(p => ({
            id: p.id,
            display_name: p.friends_display_name || p.full_name,
            avatar_url: p.friends_avatar_url || p.avatar_url
          })));
        }
      }

    } catch (error) {
      console.error("Error fetching friend data:", error);
      toast.error("Failed to load friend's profile");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.categories?.name === categoryFilter;

      const matchesCondition =
        conditionFilter === "all" || item.condition === conditionFilter;

      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [items, searchQuery, categoryFilter, conditionFilter]);

  const handleExpressInterest = async (item: Item) => {
    if (!currentUserId || !friendId) return;

    // Open chat about the item
    setChatItem({ id: item.id, name: item.name });
    setChatOpen(true);

    // Still send notification for awareness
    try {
      await supabase
        .from("notifications")
        .insert({
          sender_id: currentUserId,
          recipient_id: friendId,
          item_id: item.id,
          message: `${profile.display_name} is interested in your ${item.name}`,
        });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">Friend not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/friends")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Friends
          </Button>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{profile.display_name || "Anonymous User"}</h1>
                  {profile.city && profile.state && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}, {profile.state}</span>
                    </div>
                  )}
                  {profile.email && (
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  )}
                  <Button 
                    onClick={() => setChatOpen(true)} 
                    className="mt-4"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mutual Friends */}
          {mutualFriends.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mutual Friends ({mutualFriends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mutualFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => navigate(`/friends/${friend.id}`)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>{friend.display_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-center line-clamp-2">
                        {friend.display_name || "Anonymous"}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shared Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Shared Items ({filteredItems.length} of {items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 && (
                <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium text-sm">Filters</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search" className="text-sm">Search</Label>
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
                      <Label htmlFor="category" className="text-sm">Category</Label>
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
                      <Label htmlFor="condition" className="text-sm">Condition</Label>
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

              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {profile.display_name} hasn't shared any items yet
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No items match your filters
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {item.image_urls && item.image_urls.length > 0 && item.image_urls[0] && (
                          <img
                            src={item.image_urls[0]}
                            alt={item.name}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <h4 className="font-semibold mb-2">{item.name}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {item.categories?.name && (
                            <Badge variant="secondary">
                              {item.categories.name}
                            </Badge>
                          )}
                          {item.condition && (
                            <Badge variant="outline">
                              {item.condition}
                            </Badge>
                          )}
                        </div>
                        {item.brand && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Brand: {item.brand}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {item.description}
                          </p>
                        )}
                        <Button
                          className="w-full mt-2"
                          onClick={() => handleExpressInterest(item)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Ask About Item
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Dialog */}
      {profile && friendId && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) setChatItem(null);
          }}
          recipientId={friendId}
          recipientName={profile.display_name || "User"}
          recipientAvatar={profile.avatar}
          itemId={chatItem?.id}
          itemName={chatItem?.name}
        />
      )}
    </div>
  );
}
