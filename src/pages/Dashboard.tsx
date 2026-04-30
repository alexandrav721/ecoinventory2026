import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Leaf, Plus, GraduationCap, BarChart3, Package, Sheet, ChevronDown, FileUp, Sparkles, Lightbulb, LayoutGrid, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import InventorySpreadsheet from "@/components/dashboard/InventorySpreadsheet";
import InventoryPickleView from "@/components/dashboard/InventoryPickleView";
import { OpportunitiesPanel } from "@/components/dashboard/OpportunitiesPanel";
import BeforeYouBuyPanel from "@/components/dashboard/BeforeYouBuyPanel";


import InventoryAnalytics from "@/components/dashboard/InventoryAnalytics";
import DashboardNav from "@/components/DashboardNav";
import { CsvUpload } from "@/components/dashboard/CsvUpload";
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";
import AnalyticsOnboarding, { useAnalyticsOnboarding } from "@/components/dashboard/AnalyticsOnboarding";
import { useTranslation } from "react-i18next";
import { QuirkyLoader } from "@/components/QuirkyLoader";
import { FunFactOnMount } from "@/components/FunFactToast";
import { useDemo } from "@/contexts/DemoContext";
import { DemoBanner } from "@/components/demo/DemoBanner";
import ProfileDropdown from "@/components/ProfileDropdown";
import NotificationBell from "@/components/NotificationBell";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { FloatingAddButton } from "@/components/dashboard/FloatingAddButton";
import { HeaderSearch } from "@/components/HeaderSearch";
import { QuizPrompt } from "@/components/dashboard/QuizPrompt";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "analytics";
  const { t } = useTranslation();
  const { showOnboarding: showAnalyticsOnboarding, handleComplete: handleAnalyticsOnboardingComplete } = useAnalyticsOnboarding();
  const { isDemoMode, exitDemoMode } = useDemo();

  useEffect(() => {
    // If in demo mode, skip auth check
    if (isDemoMode) {
      setLoading(false);
      setTimeout(() => setShowOnboarding(true), 1000);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);

      // Check if user has seen the onboarding tour
      if (session?.user) {
        const hasSeenTour = localStorage.getItem(`onboarding-tour-${session.user.id}`);
        if (!hasSeenTour) {
          // Small delay to let the page load
          setTimeout(() => setShowOnboarding(true), 1000);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session && !isDemoMode) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate("/");
      return;
    }
    await supabase.auth.signOut();
    toast.success(t('nav.signOut'));
    navigate("/");
  };

  const handleOnboardingComplete = () => {
    if (isDemoMode) {
      localStorage.setItem('demo-onboarding-seen', 'true');
    } else if (user) {
      localStorage.setItem(`onboarding-tour-${user.id}`, 'completed');
    }
    setShowOnboarding(false);
    toast.success("Welcome to EcoInventory! 🎉");
  };

  const handleRestartTour = () => {
    setShowOnboarding(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <QuirkyLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Unified Header + Navigation */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-eco flex items-center justify-center shadow-sm">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{t('dashboard.title')}</h1>
                {isDemoMode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Demo
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <HeaderSearch />

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="sm" onClick={handleRestartTour} className="h-8 px-2.5 text-muted-foreground hover:text-foreground">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">Tour</span>
              </Button>
              <NotificationBell userId={user?.id ?? null} />
              <ProfileDropdown user={user} />
            </div>
          </div>

          {/* Navigation - now part of header */}
          <div className="-mb-px">
            <DashboardNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Welcome Header with Quick Stats */}
        <WelcomeHeader user={user} />

        {/* Tab Switcher - Clean pill style */}
        <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="w-full">
          <TabsList className="h-11 p-1 bg-muted/50 rounded-xl gap-1 w-fit mb-6">
            <TabsTrigger 
              value="analytics" 
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard.analytics')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard.myInventory')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-0">
            <InventoryAnalytics />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-0 space-y-6">
            <QuizPrompt />

            <div className="flex items-center justify-end">
              <Button onClick={() => navigate("/dashboard/add-item")} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {t('dashboard.addItem')}
              </Button>
            </div>

            {/* View Toggle */}
            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="h-10 p-1 bg-muted/50 rounded-lg gap-1 w-fit flex-wrap">
                <TabsTrigger value="gallery" className="h-8 px-4 gap-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Gallery</span>
                </TabsTrigger>
                <TabsTrigger value="spreadsheet" className="h-8 px-4 gap-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Sheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Spreadsheet</span>
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="h-8 px-4 gap-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">Opportunities</span>
                </TabsTrigger>
                <TabsTrigger value="before-you-buy" className="h-8 px-4 gap-2 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Before you buy</span>
                  <span className="sm:hidden">Pre-buy</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="gallery" className="mt-6">
                <InventoryPickleView />
              </TabsContent>
              <TabsContent value="spreadsheet" className="mt-6">
                <InventorySpreadsheet />
              </TabsContent>
              <TabsContent value="opportunities" className="mt-6">
                <OpportunitiesPanel />
              </TabsContent>
              <TabsContent value="before-you-buy" className="mt-6">
                <BeforeYouBuyPanel />
              </TabsContent>
            </Tabs>

            <Collapsible className="pt-2">
              <CollapsibleTrigger className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <FileUp className="w-4 h-4" />
                <span>Bulk import from CSV</span>
                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <CsvUpload />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour open={showOnboarding} onComplete={handleOnboardingComplete} />
      
      {/* Analytics Onboarding */}
      <AnalyticsOnboarding open={showAnalyticsOnboarding} onComplete={handleAnalyticsOnboardingComplete} />
      
      {/* Fun Facts (shows occasionally) */}
      <FunFactOnMount />
      
      {/* Floating Add Button for Mobile */}
      <FloatingAddButton />
    </div>
  );
};

export default Dashboard;
