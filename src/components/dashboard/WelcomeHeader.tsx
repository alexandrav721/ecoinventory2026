import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { useTranslation } from "react-i18next";
import {
  Camera,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddItemModal } from "@/components/dashboard/AddItemModal";

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
  if (totalItems === 0) return "Ready to catalog your first item?";
  if (totalItems < 10) return "Great start — keep adding to unlock insights.";
  if (sharedItems === 0) return "Share an item with your community.";
  if (totalItems < 50) return "You're on fire. Building a solid inventory.";
  return "Inventory master. Your stuff is organized.";
};

const getNextMilestone = (count: number) => {
  const milestones = [10, 25, 50, 100, 250, 500];
  return milestones.find((m) => m > count) || 1000;
};

export const WelcomeHeader = ({ user }: WelcomeHeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [stats, setStats] = useState<QuickStats>({
    totalItems: 0,
    totalValue: 0,
    sharedItems: 0,
    recentlyAdded: 0,
  });
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      const { data: items } = await supabase
        .from("inventory_items")
        .select("quantity, original_price, is_available_for_sharing, created_at")
        .eq("user_id", user.id)
        .eq("is_sold", false)
        .eq("is_donated", false)
        .eq("is_eliminated", false);

      if (items) {
        const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const totalValue = items.reduce(
          (sum, item) => sum + ((item.original_price || 0) * (item.quantity || 1)),
          0
        );
        const sharedItems = items.filter((item) => item.is_available_for_sharing).length;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentlyAdded = items.filter(
          (item) => new Date(item.created_at) > weekAgo
        ).length;

        setStats({ totalItems, totalValue, sharedItems, recentlyAdded });
      }

      setLoading(false);
    };

    fetchData();
  }, [user, isDemoMode]);

  const firstName =
    profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "friend";
  const greeting = getGreeting();
  const nextMilestone = getNextMilestone(stats.totalItems);
  const progressToMilestone = Math.min((stats.totalItems / nextMilestone) * 100, 100);
  const motivationalMessage = getMotivationalMessage(stats.totalItems, stats.sharedItems);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }



  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="rounded-2xl border bg-card p-5 md:p-6 bg-gradient-to-br from-primary/8 via-background to-background">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t(`welcome.${greeting}`)}
          </span>
          {stats.recentlyAdded > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-orange-600">
              <Flame className="w-3 h-3" />
              {stats.recentlyAdded} this week
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl md:text-3xl leading-[1.05] tracking-tight">
              Hey {firstName}.
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {motivationalMessage}
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/add-item")}
            size="sm"
            className="gap-2 shrink-0"
          >
            <Camera className="w-4 h-4" />
            Add item
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>



    </div>
  );
};
