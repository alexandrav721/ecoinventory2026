import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  item_id: string | null;
}

interface NotificationBellProps {
  userId: string | null;
}

const demoNotifications: Notification[] = [
  {
    id: "demo-1",
    message: "Sarah wants to borrow your camping tent",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    item_id: null,
  },
  {
    id: "demo-2", 
    message: "Your 'Vintage Camera' was viewed 5 times today",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    item_id: null,
  },
  {
    id: "demo-3",
    message: "Mike accepted your friend request",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    item_id: null,
  },
  {
    id: "demo-4",
    message: "Tip: Items with photos get 3x more interest!",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    item_id: null,
  },
];

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setNotifications(demoNotifications);
      setUnreadCount(demoNotifications.filter(n => !n.is_read).length);
      return;
    }

    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, is_read, created_at, item_id")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isDemoMode]);

  const markAsRead = async (notificationId: string) => {
    if (isDemoMode) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  };

  const markAllAsRead = async () => {
    if (isDemoMode) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }

    if (!userId) return;
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  if (notification.item_id) {
                    navigate(`/dashboard`);
                    setOpen(false);
                  }
                }}
              >
                <div className="flex items-start gap-2 w-full">
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  <div className={`flex-1 ${notification.is_read ? "ml-4" : ""}`}>
                    <p className="text-sm leading-snug">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary cursor-pointer"
          onClick={() => {
            navigate("/dashboard");
            setOpen(false);
          }}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
