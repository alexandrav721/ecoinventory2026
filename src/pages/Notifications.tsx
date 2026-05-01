import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Bell, Inbox, Activity, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import AppHeader from "@/components/AppHeader";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Logo } from "@/components/Logo";
import { useDemo } from "@/contexts/DemoContext";
import { QuirkyLoader } from "@/components/QuirkyLoader";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  item_id: string | null;
  sender_id: string | null;
  type?: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDemoMode } = useDemo();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (isDemoMode) {
        setLoading(false);
        setNotificationsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isDemoMode) {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    if (!user && !isDemoMode) return;

    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      
      if (isDemoMode) {
        setNotifications([
          {
            id: "demo-1",
            message: "Welcome to Loop! Start by adding your first item.",
            is_read: false,
            created_at: new Date().toISOString(),
            item_id: null,
            sender_id: null,
            type: "system"
          },
          {
            id: "demo-2",
            message: "Sarah requested to borrow your Power Drill",
            is_read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            item_id: "demo-item",
            sender_id: "demo-sender",
            type: "borrow_request",
            sender: { full_name: "Sarah", avatar_url: null }
          }
        ]);
        setNotificationsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
        `)
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } else {
        setNotifications(data || []);
      }
      setNotificationsLoading(false);
    };

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isDemoMode]);

  const markAsRead = async (notificationId: string) => {
    if (isDemoMode) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to mark as read");
    } else {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (isDemoMode) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user!.id)
      .eq("is_read", false);

    if (error) {
      toast.error("Failed to mark all as read");
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (isDemoMode) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success("Notification deleted");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to delete notification");
    } else {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success("Notification deleted");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "requests") return n.type === "borrow_request" || n.item_id;
    if (activeTab === "activity") return n.type === "system" || !n.item_id;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <QuirkyLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('dashboard.title')}
              </h1>
            </div>
            <ProfileDropdown user={user} />
          </div>
          <AppHeader />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('notifications.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 
                  ? t('notifications.unreadCount', { count: unreadCount })
                  : t('notifications.allCaughtUp')
                }
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Inbox className="w-4 h-4" />
              {t('notifications.all')}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Bell className="w-4 h-4" />
              {t('notifications.requests')}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              {t('notifications.activity')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {activeTab === "all" && t('notifications.allNotifications')}
                  {activeTab === "requests" && t('notifications.borrowRequests')}
                  {activeTab === "activity" && t('notifications.activityUpdates')}
                </CardTitle>
                <CardDescription>
                  {filteredNotifications.length} {t('notifications.items')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t('notifications.noNotifications')}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {filteredNotifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                            !notification.is_read 
                              ? "bg-primary/5 border-primary/20" 
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            !notification.is_read ? "bg-primary" : "bg-transparent"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs"
                              >
                                {t('notifications.markRead')}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Notifications;
