import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import NearbySearch from "@/components/dashboard/NearbySearch";
import SearchCommunity from "@/components/dashboard/SearchCommunity";
import LocationSettings from "@/components/dashboard/LocationSettings";
import { DemoNearbyItems } from "@/components/community/DemoNearbyItems";
import { CommunityMarketplace } from "@/components/community/CommunityMarketplace";
import { useDemo } from "@/contexts/DemoContext";

const Community = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-eco flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EcoInventory</h1>
              {user && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </header>

      {/* Navigation */}
      {(user || isDemoMode) && <AppHeader />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Community Inventory</h2>
          <p className="text-muted-foreground">
            Discover items available for sharing in your area
          </p>
        </div>

        {/* Live community marketplace (real items) */}
        {!isDemoMode && <CommunityMarketplace />}

        {/* Demo Nearby Items */}
        {isDemoMode && <DemoNearbyItems />}

        {/* Location Settings */}
        {!isDemoMode && <LocationSettings />}

        {/* Nearby Search */}
        {!isDemoMode && <NearbySearch />}

        {/* Search Community */}
        {!isDemoMode && <SearchCommunity />}
      </main>
    </div>
  );
};

export default Community;
