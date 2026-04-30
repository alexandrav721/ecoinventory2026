import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { useTranslation } from "react-i18next";
import { 
  Package, TrendingUp, Sparkles, Heart, Plus, Camera, 
  Target, Flame, Trophy, ArrowRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WelcomeHeaderProps {
  user: User | null;
}

interface QuickStats {
  totalItems: number;
  totalValue: number;
  sharedItems: number;
  recentlyAdded: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

const getMotivationalMessage = (totalItems: number, sharedItems: number) => {
  if (totalItems === 0) return "Ready to catalog your first item? 📦";
  if (totalItems < 10) return "Great start! Keep adding to unlock insights ✨";
  if (sharedItems === 0) return "Share an item with your community! 🤝";
  if (totalItems < 50) return "You're on fire! Building a solid inventory 🔥";
  return "Inventory master! Your stuff is organized 👑";
};

const getNextMilestone = (count: number) => {
  const milestones = [10, 25, 50, 100, 250, 500];
  return milestones.find(m => m > count) || 1000;
};

export const WelcomeHeader = ({ user }: WelcomeHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [stats, setStats] = useState<QuickStats>({ totalItems: 0, totalValue: 0, sharedItems: 0, recentlyAdded: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setProfile({ full_name: "Demo User" });
      setStats({ totalItems: 42, totalValue: 2847, sharedItems: 8, recentlyAdded: 3 });
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch quick stats
      const { data: items } = await supabase
        .from("inventory_items")
        .select("quantity, original_price, is_available_for_sharing, created_at")
        .eq("user_id", user.id)
        .eq("is_sold", false)
        .eq("is_donated", false)
        .eq("is_eliminated", false);

      if (items) {
        const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const totalValue = items.reduce((sum, item) => sum + ((item.original_price || 0) * (item.quantity || 1)), 0);
        const sharedItems = items.filter(item => item.is_available_for_sharing).length;
        
        // Count items added in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentlyAdded = items.filter(item => new Date(item.created_at) > weekAgo).length;
        
        setStats({ totalItems, totalValue, sharedItems, recentlyAdded });
      }

      setLoading(false);
    };

    fetchData();
  }, [user, isDemoMode]);

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "friend";
  const greeting = getGreeting();
  const nextMilestone = getNextMilestone(stats.totalItems);
  const progressToMilestone = Math.min((stats.totalItems / nextMilestone) * 100, 100);
  const motivationalMessage = getMotivationalMessage(stats.totalItems, stats.sharedItems);

  if (loading) {
    return (
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border border-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-20 w-28 rounded-xl" />
            <Skeleton className="h-20 w-28 rounded-xl" />
            <Skeleton className="h-20 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Main Welcome Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  {t(`welcome.${greeting}`)}
                </div>
                {stats.recentlyAdded > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
                    <Flame className="w-3 h-3" />
                    {stats.recentlyAdded} this week
                  </div>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">
                {t('welcome.hey', { name: firstName })} 👋
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                {motivationalMessage}
              </p>
            </div>

            {/* Quick Add Button - Desktop */}
            <Button 
              onClick={() => navigate("/dashboard/add-item")}
              size="lg"
              className="hidden sm:flex gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Camera className="w-5 h-5" />
              Add Item
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Items */}
            <div 
              onClick={() => navigate("/dashboard?tab=inventory")}
              className="group cursor-pointer flex items-center gap-3 p-4 rounded-xl bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:border-primary/30 transition-all hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">{t('welcome.items')}</p>
              </div>
            </div>

            {/* Total Value */}
            <div className="group flex items-center gap-3 p-4 rounded-xl bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all hover:-translate-y-0.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('welcome.value')}</p>
              </div>
            </div>

            {/* Sharing */}
            <div 
              onClick={() => navigate("/community")}
              className="group cursor-pointer flex items-center gap-3 p-4 rounded-xl bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:border-pink-500/30 transition-all hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sharedItems}</p>
                <p className="text-xs text-muted-foreground">{t('welcome.sharing')}</p>
              </div>
            </div>

            {/* Progress to Milestone */}
            <div className="group flex items-center gap-3 p-4 rounded-xl bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all hover:-translate-y-0.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-bold">{stats.totalItems}</p>
                  <p className="text-xs text-muted-foreground">/ {nextMilestone}</p>
                </div>
                <Progress value={progressToMilestone} className="h-1.5 mt-1" />
              </div>
            </div>
          </div>

          {/* Mobile Quick Add */}
          <Button 
            onClick={() => navigate("/dashboard/add-item")}
            size="lg"
            className="w-full sm:hidden mt-4 gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Your First Item
          </Button>
        </div>
      </div>
    </div>
  );
};
