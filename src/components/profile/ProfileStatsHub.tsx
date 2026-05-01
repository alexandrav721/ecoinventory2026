import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Sparkles,
  Plus,
  ArrowRight,
  Users,
  Flame,
} from "lucide-react";

interface Props {
  userId: string;
}

type Stats = {
  totalItems: number;
  shareableItems: number;
  portfolioValue: number;
  earnedFromSales: number;
  searchesMatching: number;
  topSearchedItems: Array<{ name: string; count: number; image: string | null; id: string }>;
};

type Insight = {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: string | null;
  action_recommended: string | null;
};

const StatRow = ({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: any;
  iconClass?: string;
}) => (
  <div className="flex-1 min-w-0 px-4 py-3 first:pl-5 last:pr-5">
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className={`w-3.5 h-3.5 ${iconClass ?? "text-primary"}`} />
      <span className="truncate">{label}</span>
    </div>
    <div className="font-display text-xl font-semibold mt-1 tabular-nums truncate">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
  </div>
);

export const ProfileStatsHub = ({ userId }: Props) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: items } = await supabase
        .from("inventory_items")
        .select(
          "id, name, original_price, sold_price, is_sold, is_available_for_sharing, image_urls, is_eliminated, is_donated"
        )
        .eq("user_id", userId);

      const all = items ?? [];
      const active = all.filter((i: any) => !i.is_eliminated && !i.is_donated && !i.is_sold);
      const shareable = active.filter((i: any) => i.is_available_for_sharing);

      const portfolioValue = active.reduce(
        (sum: number, i: any) => sum + (Number(i.original_price) || 0),
        0
      );
      const earned = all
        .filter((i: any) => i.is_sold)
        .reduce((sum: number, i: any) => sum + (Number(i.sold_price) || 0), 0);

      // Community interest: searches in last 30 days that contain any of the user's shareable item names
      let searchesMatching = 0;
      const counts: Record<string, number> = {};
      if (shareable.length > 0) {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data: logs } = await supabase
          .from("search_logs")
          .select("search_term")
          .gte("created_at", since.toISOString())
          .limit(1000);

        const tokens = shareable.map((i: any) => ({
          id: i.id,
          name: i.name,
          image: i.image_urls?.[0] ?? null,
          tokens: (i.name || "")
            .toLowerCase()
            .split(/\s+/)
            .filter((t: string) => t.length >= 4),
        }));
        (logs ?? []).forEach((l: any) => {
          const term = (l.search_term || "").toLowerCase();
          if (!term) return;
          let matched = false;
          tokens.forEach((t) => {
            if (term.includes(t.name.toLowerCase()) || t.tokens.some((tk: string) => term.includes(tk))) {
              counts[t.id] = (counts[t.id] || 0) + 1;
              matched = true;
            }
          });
          if (matched) searchesMatching += 1;
        });
      }

      const topSearchedItems = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => {
          const item = shareable.find((i: any) => i.id === id);
          return {
            id,
            count,
            name: item?.name ?? "Item",
            image: item?.image_urls?.[0] ?? null,
          };
        });

      setStats({
        totalItems: active.length,
        shareableItems: shareable.length,
        portfolioValue,
        earnedFromSales: earned,
        searchesMatching,
        topSearchedItems,
      });

      const { data: ins } = await supabase
        .from("inventory_insights")
        .select("id, insight_type, title, description, priority, action_recommended")
        .eq("user_id", userId)
        .eq("is_dismissed", false)
        .order("priority", { ascending: false })
        .limit(3);
      setInsights((ins as Insight[]) ?? []);

      setLoading(false);
    })();
  }, [userId]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 h-24 animate-pulse bg-muted/30" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold">Your stats</h2>
          <Button asChild size="sm" variant="ghost">
            <Link to="/dashboard">
              Full dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Items tracked"
            value={stats.totalItems}
            sub={`${stats.shareableItems} shareable`}
            icon={Package}
          />
          <StatCard
            label="Portfolio value"
            value={`$${stats.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            sub="What you've paid"
            icon={DollarSign}
            accent="bg-amber-100 text-amber-700"
          />
          <StatCard
            label="Earned"
            value={`$${stats.earnedFromSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            sub="From items sold"
            icon={TrendingUp}
            accent="bg-green-100 text-green-700"
          />
          <StatCard
            label="Community interest"
            value={stats.searchesMatching}
            sub="Searches matching your stuff (30d)"
            icon={Eye}
            accent="bg-blue-100 text-blue-700"
          />
        </div>
      </div>

      {/* Hot picks: items people searched for */}
      {stats.topSearchedItems.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/60 to-transparent">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              <h3 className="font-display text-lg font-semibold">People are looking for these</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on recent community searches — these items of yours are getting attention.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {stats.topSearchedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border"
                >
                  <div className="w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.count} {item.count === 1 ? "search" : "searches"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Opportunities
            </h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/dashboard">
                See all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((ins) => (
              <Card key={ins.id} className="border-border/60">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{ins.title}</h4>
                    {ins.priority === "high" && (
                      <Badge variant="destructive" className="text-[10px]">
                        High
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{ins.description}</p>
                  {ins.action_recommended && (
                    <p className="text-xs font-medium text-primary">{ins.action_recommended}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add more CTA */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Add more, get noticed</h3>
              <p className="text-sm text-muted-foreground">
                {stats.searchesMatching > 0
                  ? `${stats.searchesMatching} neighbors searched for things like yours this month.`
                  : "The more you list, the more your neighbors can borrow or buy from you."}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/dashboard/add-item">
              <Plus className="w-4 h-4 mr-1" /> Add an item
            </Link>
          </Button>
        </CardContent>
      </Card>

      {stats.totalItems === 0 && (
        <Card className="text-center p-8 space-y-3">
          <Users className="w-10 h-10 mx-auto text-muted-foreground" />
          <h3 className="font-display text-lg font-semibold">No items yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add your first item to see your portfolio value, community interest, and AI
            opportunities.
          </p>
          <Button asChild>
            <Link to="/dashboard/add-item">Add your first item</Link>
          </Button>
        </Card>
      )}
    </div>
  );
};
