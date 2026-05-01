import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMinus, Eye } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/contexts/DemoContext";

interface FriendsListProps {
  userId: string;
}

export function FriendsList({ userId }: FriendsListProps) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode, demoFriends } = useDemo();

  useEffect(() => {
    if (isDemoMode) {
      setFriends(demoFriends);
      setLoading(false);
      return;
    }
    fetchFriends();
  }, [userId, isDemoMode, demoFriends]);

  const fetchFriends = async () => {
    try {
      // Get friendships where user is either sender or receiver
      const { data: friendships } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (friendships && friendships.length > 0) {
        // Get friend IDs
        const friendIds = friendships.map(f => 
          f.user_id === userId ? f.friend_id : f.user_id
        );

        // Fetch profiles for these friends with friends-specific display info
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, friends_display_name, friends_avatar_url, avatar_url")
          .in("id", friendIds);

        if (profiles) {
          // Map profiles with friendship IDs
          const friendsList = profiles.map(profile => {
            const friendship = friendships.find(f => 
              f.user_id === profile.id || f.friend_id === profile.id
            );
            return {
              friendshipId: friendship?.id,
              id: profile.id,
              email: profile.email,
              display_name: profile.friends_display_name || profile.full_name,
              avatar_url: profile.friends_avatar_url || profile.avatar_url
            };
          });
          setFriends(friendsList);
        }
      }
    } catch (error) {
      console.error("Fetch friends error:", error);
      toast.error("Failed to load people you follow");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (isDemoMode) {
      toast.info("Demo mode: Actions are simulated");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
      toast.success("Removed from your network");
      fetchFriends();
    } catch (error) {
      console.error("Remove friend error:", error);
      toast.error("Failed to unfollow");
    }
  };

  const handleViewProfile = (friendId: string) => {
    if (isDemoMode) {
      toast.info("Demo mode: Profile viewing is simulated");
      return;
    }
    navigate(`/friends/${friendId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>In your network</CardTitle>
        <CardDescription>People you follow — and who follow you back</CardDescription>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <p className="text-muted-foreground">You're not following anyone yet</p>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend.avatar_url} />
                    <AvatarFallback>{friend.display_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{friend.display_name || "Anonymous User"}</p>
                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleViewProfile(friend.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleRemoveFriend(friend.friendshipId)}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
