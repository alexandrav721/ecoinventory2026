import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface FriendSearchProps {
  userId: string;
}

export function FriendSearch({ userId }: FriendSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an email to search");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, public_display_name, public_avatar_url, avatar_url")
        .ilike("email", `%${searchQuery}%`)
        .neq("id", userId)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
      
      // Log search anonymously
      await supabase.from("search_logs").insert({
        search_term: searchQuery,
        search_type: "friend",
        result_count: data?.length || 0,
      });
      
      if (!data || data.length === 0) {
        toast.info("No users found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single();

      if (existing) {
        toast.error("Already following or request pending");
        return;
      }

      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: "pending"
        });

      if (error) throw error;
      toast.success("Network request sent!");
      setResults(results.filter(r => r.id !== friendId));
    } catch (error) {
      console.error("Send request error:", error);
      toast.error("Failed to send follow request");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search for Friends</CardTitle>
          <CardDescription>Find users by their email address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.public_avatar_url || user.avatar_url} />
                    <AvatarFallback>
                      {(user.public_display_name || user.full_name)?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {user.public_display_name || user.full_name || "Anonymous User"}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button onClick={() => handleSendRequest(user.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
