import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DemoProvider, useDemo } from "@/contexts/DemoContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import FriendProfile from "./pages/FriendProfile";
import ProfileSettings from "./pages/ProfileSettings";
import Admin from "./pages/Admin";
import Promo from "./pages/Promo";
import Founders from "./pages/Founders";
import Community from "./pages/Community";
import Swap from "./pages/Swap";
import Events from "./pages/Events";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import Demo from "./pages/Demo";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem";
import Quiz from "./pages/Quiz";
import Declutter from "./pages/Declutter";
import BeforeYouBuy from "./pages/BeforeYouBuy";
import People from "./pages/People";
import PublicProfile from "./pages/PublicProfile";
import CircularEconomyGuide from "./pages/articles/CircularEconomyGuide";
import OrganizingInventory from "./pages/articles/OrganizingInventory";
import ItemDepreciation from "./pages/articles/ItemDepreciation";
import BuildingSharingCommunity from "./pages/articles/BuildingSharingCommunity";
import MarketplaceItem from "./pages/MarketplaceItem";
import ItemDetail from "./pages/ItemDetail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const RootRoute = () => {
  const { isDemoMode } = useDemo();
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthState(session ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (authState === "loading") return null;
  if (authState === "in" || isDemoMode) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/how-it-works" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DemoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/marketplace" element={<Community />} />
            <Route path="/welcome" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/add-item" element={<AddItem />} />
            <Route path="/dashboard/quiz" element={<Quiz />} />
            <Route path="/dashboard/declutter" element={<Declutter />} />
            <Route path="/dashboard/before-you-buy" element={<BeforeYouBuy />} />
            <Route path="/dashboard/edit-item/:id" element={<EditItem />} />
            <Route path="/dashboard/item/:id" element={<ItemDetail />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/friends/:friendId" element={<FriendProfile />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/promo" element={<Promo />} />
            <Route path="/founders" element={<Founders />} />
            <Route path="/community" element={<Community />} />
            <Route path="/events" element={<Events />} />
            <Route path="/people" element={<People />} />
            <Route path="/me" element={<PublicProfile selfMode />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<Article />} />
            <Route path="/articles/circular-economy" element={<CircularEconomyGuide />} />
            <Route path="/articles/organizing-inventory" element={<OrganizingInventory />} />
            <Route path="/articles/item-depreciation" element={<ItemDepreciation />} />
            <Route path="/articles/building-community" element={<BuildingSharingCommunity />} />
            <Route path="/how-it-works" element={<Index />} />
            <Route path="/about" element={<Navigate to="/how-it-works" replace />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/marketplace/item/:id" element={<MarketplaceItem />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/support" element={<Support />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DemoProvider>
  </QueryClientProvider>
);

export default App;
