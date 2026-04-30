import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DemoProvider } from "@/contexts/DemoContext";
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
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import About from "./pages/About";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem";
import Quiz from "./pages/Quiz";
import Declutter from "./pages/Declutter";
import CircularEconomyGuide from "./pages/articles/CircularEconomyGuide";
import OrganizingInventory from "./pages/articles/OrganizingInventory";
import ItemDepreciation from "./pages/articles/ItemDepreciation";
import BuildingSharingCommunity from "./pages/articles/BuildingSharingCommunity";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DemoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/add-item" element={<AddItem />} />
            <Route path="/dashboard/quiz" element={<Quiz />} />
            <Route path="/dashboard/declutter" element={<Declutter />} />
            <Route path="/dashboard/edit-item/:id" element={<EditItem />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/friends/:friendId" element={<FriendProfile />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/promo" element={<Promo />} />
            <Route path="/founders" element={<Founders />} />
            <Route path="/community" element={<Community />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<Article />} />
            <Route path="/articles/circular-economy" element={<CircularEconomyGuide />} />
            <Route path="/articles/organizing-inventory" element={<OrganizingInventory />} />
            <Route path="/articles/item-depreciation" element={<ItemDepreciation />} />
            <Route path="/articles/building-community" element={<BuildingSharingCommunity />} />
            <Route path="/about" element={<About />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DemoProvider>
  </QueryClientProvider>
);

export default App;
