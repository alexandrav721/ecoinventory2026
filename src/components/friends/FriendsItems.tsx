import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, HandHeart } from "lucide-react";
import { toast } from "sonner";
import { BorrowRequestDialog } from "./BorrowRequestDialog";
import { useDemo } from "@/contexts/DemoContext";

interface FriendsItemsProps {
  userId: string;
}

export function FriendsItems({ userId }: FriendsItemsProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const { isDemoMode, demoFriendsItems } = useDemo();

  useEffect(() => {
    if (isDemoMode) {
      setItems(demoFriendsItems);
      setLoading(false);
      return;
    }
    fetchFriendsItems();
  }, [userId, isDemoMode, demoFriendsItems]);

  const fetchFriendsItems = async () => {
    try {
      // Get all friends' IDs
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (!friendships || friendships.length === 0) {
        setLoading(false);
        return;
      }

      // Extract friend IDs
      const friendIds = friendships.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      // Fetch shared items from friends
      const { data: friendsItems, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          profiles!inventory_items_user_id_fkey(
            full_name, 
            email, 
            friends_display_name, 
            friends_avatar_url, 
            avatar_url
          ),
          categories(name, icon)
        `)
        .in("user_id", friendIds)
        .eq("is_available_for_sharing", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(friendsItems || []);
    } catch (error) {
      console.error("Fetch friends' items error:", error);
      toast.error("Failed to load items from people you follow");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared Items</CardTitle>
        <CardDescription>Items shared by people you follow</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No shared items from people you follow yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  {item.image_url && (
                    <div className="mb-4 aspect-square rounded-lg overflow-hidden bg-muted">
                      {item.image_url.startsWith("emoji:") ? (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          {item.image_url.replace("emoji:", "")}
                        </div>
                      ) : (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.categories && (
                        <span className="text-xl">{item.categories.icon}</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {item.condition && (
                        <Badge variant="outline">{item.condition}</Badge>
                      )}
                      {item.sharing_price !== null && item.sharing_price > 0 ? (
                        <Badge variant="secondary">${item.sharing_price.toFixed(2)}</Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </div>
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage 
                            src={item.profiles?.friends_avatar_url || item.profiles?.avatar_url} 
                          />
                          <AvatarFallback>
                            {(item.profiles?.friends_display_name || item.profiles?.full_name)?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">
                          {item.profiles?.friends_display_name || 
                           item.profiles?.full_name || 
                           item.profiles?.email || 
                           "Anonymous"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedItem(item);
                          setRequestDialogOpen(true);
                        }}
                      >
                        <HandHeart className="w-4 h-4 mr-2" />
                        Request to Borrow
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <BorrowRequestDialog
        item={selectedItem}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onRequestSent={() => {
          toast.success("Request sent!");
        }}
      />
    </Card>
  );
}
