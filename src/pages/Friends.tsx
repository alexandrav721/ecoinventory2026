import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";
import { Users, UserPlus, HandHeart } from "lucide-react";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { FriendsList } from "@/components/friends/FriendsList";
import { BorrowingRequestsManager } from "@/components/friends/BorrowingRequestsManager";
import { useDemo } from "@/contexts/DemoContext";
import { DemoBanner } from "@/components/demo/DemoBanner";

const Friends = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();

  useEffect(() => {
    // Skip auth check in demo mode
    if (isDemoMode) {
      setUser({ id: "demo-user" });
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Network</h1>
            <p className="text-muted-foreground">
              Add neighbors and trusted friends to your network to see their stuff. Some people require approval before joining their network — anyone can also add you to theirs.
            </p>
          </div>

          <div className="mb-6">
            <FriendSearch userId={user.id} />
          </div>

          <Tabs defaultValue="requests-manage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requests-manage" className="gap-2">
                <HandHeart className="w-4 h-4" />
                Borrow Requests
              </TabsTrigger>
              <TabsTrigger value="friends" className="gap-2">
                <Users className="w-4 h-4" />
                In your network
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Network Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests-manage" className="mt-6">
              <BorrowingRequestsManager />
            </TabsContent>

            <TabsContent value="friends" className="mt-6">
              <FriendsList userId={user.id} />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <FriendRequests userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Friends;
