import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  item_id: string | null;
  sender_profile: {
    full_name: string;
    email: string;
  };
  item: {
    name: string;
  } | null;
}

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          message,
          is_read,
          created_at,
          sender_id,
          item_id,
          sender_profile:profiles!notifications_sender_id_fkey (
            full_name,
            email
          ),
          item:inventory_items (
            name
          )
        `)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data as any || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
          toast.info("New notification received!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          {isOpen && (
            <CardDescription>
              Messages from neighbors interested in your items
            </CardDescription>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.is_read ? "opacity-60" : "border-primary"}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {notification.sender_profile?.full_name || "Someone"}
                      </span>
                      {notification.item && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {notification.item.name}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default NotificationsPanel;
