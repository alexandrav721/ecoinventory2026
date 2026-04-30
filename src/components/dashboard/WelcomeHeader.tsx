import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { useTranslation } from "react-i18next";
import {
  Package,
  TrendingUp,
  Heart,
  Plus,
  Camera,
  Trophy,
  ArrowRight,
  Flame,
  ImageIcon,
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
  const { isDemoMode, demoItems } = useDemo();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [stats, setStats] = useState<QuickStats>({
    totalItems: 0,
    totalValue: 0,
    sharedItems: 0,
    recentlyAdded: 0,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setProfile({ full_name: "Demo User" });
      setStats({ totalItems: 42, totalValue: 2847, sharedItems: 8, recentlyAdded: 3 });
      const demoPhotos = (demoItems || [])
        .map((it: any) => {
          if (Array.isArray(it.image_urls) && it.image_urls.length) return it.image_urls[0];
          return it.image ?? null;
        })
        .filter(Boolean) as string[];
      setPhotos(demoPhotos.slice(0, 5));
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
        .select(
          "quantity, original_price, is_available_for_sharing, created_at, image_urls"
        )
        .eq("user_id", user.id)
        .eq("is_sold", false)
        .eq("is_donated", false)
        .eq("is_eliminated", false)
        .order("created_at", { ascending: false });

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

        const pics: string[] = [];
        for (const it of items as any[]) {
          if (Array.isArray(it.image_urls) && it.image_urls.length) {
            pics.push(it.image_urls[0]);
          }
          if (pics.length >= 5) break;
        }
        setPhotos(pics);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, isDemoMode, demoItems]);

  const firstName =
    profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "friend";
  const greeting = getGreeting();
  const nextMilestone = getNextMilestone(stats.totalItems);
  const progressToMilestone = Math.min((stats.totalItems / nextMilestone) * 100, 100);
  const motivationalMessage = getMotivationalMessage(stats.totalItems, stats.sharedItems);

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  // Build the photo collage layout — Pickle style: one big lead photo + small tiles
  const lead = photos[0];
  const tiles = photos.slice(1, 5);

  return (
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
      {/* LEFT: Hero with photo collage */}
      <div className="relative rounded-2xl overflow-hidden border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] h-full min-h-[240px]">
          {/* Greeting block */}
          <div className="p-6 md:p-7 flex flex-col justify-between gap-5 bg-gradient-to-br from-primary/8 via-background to-background">
            <div>
              <div className="flex items-center gap-2 mb-3">
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
              <h2 className="font-display text-3xl md:text-4xl leading-[1.05] tracking-tight">
                Hey {firstName}.
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                {motivationalMessage}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate("/dashboard/add-item")}
                size="sm"
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Add item
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard?tab=inventory")}
                className="text-muted-foreground hover:text-foreground"
              >
                Browse estate
              </Button>
            </div>
          </div>

          {/* Photo collage */}
          <div className="relative bg-muted/30 min-h-[200px]">
            {lead ? (
              <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full p-1">
                <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl bg-muted">
                  <img
                    src={lead}
                    alt="Featured item"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {[0, 1, 2, 3].map((i) => {
                  const src = tiles[i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative overflow-hidden rounded-lg bg-muted",
                        i >= 2 && "hidden md:block"
                      )}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={() => navigate("/dashboard/add-item")}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-sm">Add a photo to start</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Condensed stats rail */}
      <aside className="rounded-2xl border bg-card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            At a glance
          </h3>
        </div>

        <div className="divide-y divide-border/60">
          <button
            onClick={() => navigate("/dashboard?tab=inventory")}
            className="w-full flex items-center justify-between py-2.5 group text-left"
          >
            <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Package className="w-4 h-4 text-primary" />
              Items
            </span>
            <span className="text-base font-semibold tabular-nums">
              {stats.totalItems}
            </span>
          </button>

          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Value
            </span>
            <span className="text-base font-semibold tabular-nums">
              ${stats.totalValue.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => navigate("/community")}
            className="w-full flex items-center justify-between py-2.5 text-left"
          >
            <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-pink-500" />
              Sharing
            </span>
            <span className="text-base font-semibold tabular-nums">
              {stats.sharedItems}
            </span>
          </button>

          <div className="py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Trophy className="w-4 h-4 text-amber-500" />
                Milestone
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {stats.totalItems}/{nextMilestone}
              </span>
            </div>
            <Progress value={progressToMilestone} className="h-1.5" />
          </div>
        </div>
      </aside>
    </div>
  );
};
