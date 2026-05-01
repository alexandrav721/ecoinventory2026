import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { AdminManagement } from "@/components/dashboard/AdminManagement";
import BenchmarkManager from "@/components/dashboard/BenchmarkManager";
import SuggestionsManager from "@/components/dashboard/SuggestionsManager";
import ProductCatalogGenerator from "@/components/dashboard/ProductCatalogGenerator";
import { useUserRole } from "@/hooks/useUserRole";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Redirect non-admins
    if (!loading && !roleLoading && !isAdmin) {
      toast.error("You don't have permission to access this page");
      navigate("/dashboard");
    }
  }, [isAdmin, loading, roleLoading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
              <h1 className="text-xl font-bold flex items-center gap-2">
                EcoInventory
                <Shield className="w-4 h-4 text-primary" />
              </h1>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold">Admin Panel</h2>
        </div>
        
        <AdminManagement />
        <SuggestionsManager />
        <BenchmarkManager />
        <ProductCatalogGenerator />
        <CatalogManager />
      </main>
    </div>
  );
};

export default Admin;
