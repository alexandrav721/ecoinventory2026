import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Package, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface BorrowingRequest {
  id: string;
  item_id: string;
  requester_id: string;
  owner_id: string;
  status: string;
  requested_at: string;
  responded_at: string | null;
  start_date: string | null;
  end_date: string | null;
  message: string | null;
  response_message: string | null;
  inventory_items: {
    name: string;
    image_urls: string[] | null;
    sharing_price: number | null;
  };
  requester_profile?: {
    full_name: string | null;
    friends_display_name: string | null;
    email: string;
  };
  owner_profile?: {
    full_name: string | null;
    friends_display_name: string | null;
    email: string;
  };
}

export function BorrowingRequestsManager() {
  const [receivedRequests, setReceivedRequests] = useState<BorrowingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<BorrowingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch received requests (where user is the owner)
      const { data: received, error: receivedError } = await supabase
        .from("borrowing_requests")
        .select(`
          *,
          inventory_items!borrowing_requests_item_id_fkey(name, image_urls, sharing_price),
          requester_profile:profiles!borrowing_requests_requester_id_fkey(full_name, friends_display_name, email)
        `)
        .eq("owner_id", user.id)
        .order("requested_at", { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch sent requests (where user is the requester)
      const { data: sent, error: sentError } = await supabase
        .from("borrowing_requests")
        .select(`
          *,
          inventory_items!borrowing_requests_item_id_fkey(name, image_urls, sharing_price),
          owner_profile:profiles!borrowing_requests_owner_id_fkey(full_name, friends_display_name, email)
        `)
        .eq("requester_id", user.id)
        .order("requested_at", { ascending: false });

      if (sentError) throw sentError;

      setReceivedRequests(received as any || []);
      setSentRequests(sent as any || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: "approved" | "declined") => {
    try {
      const { error } = await supabase
        .from("borrowing_requests")
        .update({
          status,
          responded_at: new Date().toISOString(),
          response_message: responseMessage.trim() || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Create notification for requester
      const request = receivedRequests.find(r => r.id === requestId);
      if (request) {
        await supabase.from("notifications").insert({
          recipient_id: request.requester_id,
          sender_id: request.owner_id,
          item_id: request.item_id,
          message: `${status} your request to borrow ${request.inventory_items.name}`,
        });
      }

      toast.success(`Request ${status}!`);
      setRespondingTo(null);
      setResponseMessage("");
      fetchRequests();
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request");
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("borrowing_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request cancelled");
      fetchRequests();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      declined: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "secondary", icon: XCircle },
      completed: { variant: "secondary", icon: CheckCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const RequestCard = ({ request, isReceived }: { request: BorrowingRequest; isReceived: boolean }) => {
    const displayName = isReceived
      ? request.requester_profile?.friends_display_name || request.requester_profile?.full_name || request.requester_profile?.email
      : request.owner_profile?.friends_display_name || request.owner_profile?.full_name || request.owner_profile?.email;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {request.inventory_items.image_urls?.[0] && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {request.inventory_items.image_urls[0].startsWith("emoji:") ? (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {request.inventory_items.image_urls[0].replace("emoji:", "")}
                  </div>
                ) : (
                  <img
                    src={request.inventory_items.image_urls[0]}
                    alt={request.inventory_items.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {request.inventory_items.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isReceived ? "Requested by" : "Owner"}: {displayName}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              {request.inventory_items.sharing_price && request.inventory_items.sharing_price > 0 && (
                <p className="text-sm font-medium">
                  Price: ${request.inventory_items.sharing_price.toFixed(2)}
                </p>
              )}

              {(request.start_date || request.end_date) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {request.start_date && format(new Date(request.start_date), "MMM d")}
                  {request.start_date && request.end_date && " - "}
                  {request.end_date && format(new Date(request.end_date), "MMM d, yyyy")}
                </div>
              )}

              {request.message && (
                <div className="p-2 bg-muted/50 rounded text-sm">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  {request.message}
                </div>
              )}

              {request.response_message && (
                <div className="p-2 bg-primary/10 rounded text-sm">
                  <strong>Response:</strong> {request.response_message}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Requested {format(new Date(request.requested_at), "PPp")}
              </p>

              {isReceived && request.status === "pending" && (
                <div className="pt-2">
                  {respondingTo === request.id ? (
                    <div className="space-y-2">
                      <Label htmlFor="response">Response Message (Optional)</Label>
                      <Textarea
                        id="response"
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Add a message..."
                        rows={2}
                        maxLength={300}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleResponse(request.id, "approved")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleResponse(request.id, "declined")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseMessage("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setRespondingTo(request.id)}>
                      Respond
                    </Button>
                  )}
                </div>
              )}

              {!isReceived && request.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(request.id)}
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowing Requests</CardTitle>
        <CardDescription>Manage requests to borrow items</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Received ({receivedRequests.filter(r => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 mt-4">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No borrowing requests received yet</p>
              </div>
            ) : (
              receivedRequests.map((request) => (
                <RequestCard key={request.id} request={request} isReceived={true} />
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 mt-4">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You haven't sent any borrowing requests yet</p>
              </div>
            ) : (
              sentRequests.map((request) => (
                <RequestCard key={request.id} request={request} isReceived={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
