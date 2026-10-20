import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightUnlocksPanel } from "@/components/dashboard/InsightUnlocksPanel";

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
  const [addOpen, setAddOpen] = useState(false);

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
        // PostgREST `eq.false` does NOT match NULL, and all three of these
        // columns are nullable. Every item with a NULL in any of them was
        // being dropped from the count silently — so a user whose rows
        // predate those columns saw a total lower than their real one.
        // `.not(col, "is", true)` keeps NULL, which is what "not sold" means.
        .not("is_sold", "is", true)
        .not("is_donated", "is", true)
        .not("is_eliminated", "is", true);

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
      <InsightUnlocksPanel totalItems={stats.totalItems} />
    </div>
  );
};
