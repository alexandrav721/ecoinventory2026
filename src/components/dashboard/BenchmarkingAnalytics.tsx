import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users, Package, DollarSign, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BenchmarkData {
  userMetrics: {
    totalItems: number;
    totalValue: number;
    sharedItems: number;
    avgItemValue: number;
    categoryCount: number;
  };
  communityAverages: {
    avgItems: number;
    avgValue: number;
    avgSharedItems: number;
    avgItemValue: number;
    avgCategoryCount: number;
  };
}

const BenchmarkingAnalytics = () => {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBenchmarkData();
  }, []);

  const fetchBenchmarkData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's inventory metrics
      const { data: userItems, error: userError } = await supabase
        .from("inventory_items")
        .select("original_price, is_available_for_sharing, category_id")
        .eq("user_id", user.id);

      if (userError) throw userError;

      const totalItems = userItems?.length || 0;
      const totalValue = userItems?.reduce((sum, item) => sum + (Number(item.original_price) || 0), 0) || 0;
      const sharedItems = userItems?.filter(item => item.is_available_for_sharing).length || 0;
      const uniqueCategories = new Set(userItems?.map(item => item.category_id).filter(Boolean));

      // Fetch community averages (anonymized aggregates)
      const { data: allUsers, error: usersError } = await supabase
        .from("inventory_items")
        .select("user_id, original_price, is_available_for_sharing, category_id");

      if (usersError) throw usersError;

      // Group by user and calculate averages
      const userGroups = new Map<string, any[]>();
      allUsers?.forEach(item => {
        if (!userGroups.has(item.user_id)) {
          userGroups.set(item.user_id, []);
        }
        userGroups.get(item.user_id)?.push(item);
      });

      const totalUsers = userGroups.size;
      let totalItemsCount = 0;
      let totalValueSum = 0;
      let totalSharedCount = 0;
      let totalCategoriesCount = 0;

      userGroups.forEach((items, userId) => {
        totalItemsCount += items.length;
        totalValueSum += items.reduce((sum, item) => sum + (Number(item.original_price) || 0), 0);
        totalSharedCount += items.filter(item => item.is_available_for_sharing).length;
        const categories = new Set(items.map(item => item.category_id).filter(Boolean));
        totalCategoriesCount += categories.size;
      });

      const avgItems = totalUsers > 0 ? totalItemsCount / totalUsers : 0;
      const avgValue = totalUsers > 0 ? totalValueSum / totalUsers : 0;
      const avgSharedItems = totalUsers > 0 ? totalSharedCount / totalUsers : 0;
      const avgItemValue = totalItemsCount > 0 ? totalValueSum / totalItemsCount : 0;
      const avgCategoryCount = totalUsers > 0 ? totalCategoriesCount / totalUsers : 0;

      setData({
        userMetrics: {
          totalItems,
          totalValue,
          sharedItems,
          avgItemValue: totalItems > 0 ? totalValue / totalItems : 0,
          categoryCount: uniqueCategories.size,
        },
        communityAverages: {
          avgItems: Math.round(avgItems),
          avgValue: Math.round(avgValue),
          avgSharedItems: Math.round(avgSharedItems),
          avgItemValue: Math.round(avgItemValue),
          avgCategoryCount: Math.round(avgCategoryCount),
        },
      });
    } catch (error) {
      console.error("Error fetching benchmark data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentile = (userValue: number, avgValue: number): number => {
    if (avgValue === 0) return 50;
    const percentile = (userValue / avgValue) * 50 + 50;
    return Math.min(Math.max(percentile, 0), 100);
  };

  const getTrendIcon = (userValue: number, avgValue: number) => {
    if (userValue > avgValue * 1.1) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (userValue < avgValue * 0.9) return <TrendingDown className="w-4 h-4 text-orange-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getComparisonText = (userValue: number, avgValue: number): string => {
    const diff = ((userValue - avgValue) / avgValue) * 100;
    if (Math.abs(diff) < 10) return "Average";
    if (diff > 0) return `${Math.round(diff)}% above average`;
    return `${Math.round(Math.abs(diff))}% below average`;
  };

  const getBadgeVariant = (userValue: number, avgValue: number): "default" | "secondary" | "outline" => {
    const diff = ((userValue - avgValue) / avgValue) * 100;
    if (Math.abs(diff) < 10) return "secondary";
    if (diff > 0) return "default";
    return "outline";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Portfolio Benchmarking
          </CardTitle>
          <CardDescription>Loading comparison data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      icon: Package,
      label: "Total Items",
      userValue: data.userMetrics.totalItems,
      avgValue: data.communityAverages.avgItems,
      format: (val: number) => val.toString(),
    },
    {
      icon: DollarSign,
      label: "Portfolio Value",
      userValue: data.userMetrics.totalValue,
      avgValue: data.communityAverages.avgValue,
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      icon: Share2,
      label: "Shared Items",
      userValue: data.userMetrics.sharedItems,
      avgValue: data.communityAverages.avgSharedItems,
      format: (val: number) => val.toString(),
    },
    {
      icon: DollarSign,
      label: "Avg Item Value",
      userValue: data.userMetrics.avgItemValue,
      avgValue: data.communityAverages.avgItemValue,
      format: (val: number) => `$${Math.round(val)}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Portfolio Benchmarking
        </CardTitle>
        <CardDescription>
          Compare your inventory metrics against community averages (anonymized data)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const percentile = calculatePercentile(metric.userValue, metric.avgValue);

          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.userValue, metric.avgValue)}
                  <Badge variant={getBadgeVariant(metric.userValue, metric.avgValue)}>
                    {getComparisonText(metric.userValue, metric.avgValue)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You: {metric.format(metric.userValue)}</span>
                  <span className="text-muted-foreground">Avg: {metric.format(metric.avgValue)}</span>
                </div>
                <Progress value={percentile} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round(percentile)}th percentile
                </p>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Benchmarks are calculated from anonymized community data to help you understand
              how your inventory compares to others. All data is aggregated and no individual
              information is shared.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenchmarkingAnalytics;
