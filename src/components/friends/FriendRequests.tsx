import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface FriendRequestsProps {
  userId: string;
}

export function FriendRequests({ userId }: FriendRequestsProps) {
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [userId]);

  const fetchRequests = async () => {
    try {
      // Sent requests
      const { data: sent } = await supabase
        .from("friendships")
        .select(`
          id,
          status,
          created_at,
          friend:profiles!friendships_friend_id_fkey(
            id, 
            email, 
            full_name, 
            public_display_name, 
            public_avatar_url, 
            avatar_url
          )
        `)
        .eq("user_id", userId)
        .eq("status", "pending");

      // Received requests
      const { data: received } = await supabase
        .from("friendships")
        .select(`
          id,
          status,
          created_at,
          user:profiles!friendships_user_id_fkey(
            id, 
            email, 
            full_name, 
            public_display_name, 
            public_avatar_url, 
            avatar_url
          )
        `)
        .eq("friend_id", userId)
        .eq("status", "pending");

      setSentRequests(sent || []);
      setReceivedRequests(received || []);
    } catch (error) {
      console.error("Fetch requests error:", error);
      toast.error("Failed to load follow requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Follow request accepted!");
      fetchRequests();
    } catch (error) {
      console.error("Accept error:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Follow request declined");
      fetchRequests();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject request");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Incoming Follow Requests</CardTitle>
          <CardDescription>People asking to follow you — accept to let them see your stuff</CardDescription>
        </CardHeader>
        <CardContent>
          {receivedRequests.length === 0 ? (
            <p className="text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage 
                        src={request.user.public_avatar_url || request.user.avatar_url} 
                      />
                      <AvatarFallback>
                        {(request.user.public_display_name || request.user.full_name)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {request.user.public_display_name || request.user.full_name || "Anonymous User"}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(request.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Follow Requests</CardTitle>
          <CardDescription>People you've asked to follow — waiting for approval</CardDescription>
        </CardHeader>
        <CardContent>
          {sentRequests.length === 0 ? (
            <p className="text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage 
                        src={request.friend.public_avatar_url || request.friend.avatar_url} 
                      />
                      <AvatarFallback>
                        {(request.friend.public_display_name || request.friend.full_name)?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {request.friend.public_display_name || request.friend.full_name || "Anonymous User"}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.friend.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
