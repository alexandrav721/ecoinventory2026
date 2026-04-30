import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemo } from "@/contexts/DemoContext";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TimelineData {
  date: string;
  total: number;
  donated: number;
  sold: number;
}

const COLORS = [
  "hsl(142, 76%, 36%)",  // Green
  "hsl(221, 83%, 53%)",  // Blue
  "hsl(262, 83%, 58%)",  // Purple
  "hsl(346, 77%, 50%)",  // Red
  "hsl(38, 92%, 50%)",   // Orange
  "hsl(199, 89%, 48%)",  // Cyan
];

// Demo data for charts
const DEMO_CATEGORY_DATA: CategoryData[] = [
  { name: "Electronics", value: 4, color: COLORS[0] },
  { name: "Clothing", value: 3, color: COLORS[1] },
  { name: "Sports & Outdoors", value: 3, color: COLORS[2] },
  { name: "Kitchen", value: 2, color: COLORS[3] },
  { name: "Furniture", value: 1, color: COLORS[4] },
  { name: "Others", value: 2, color: COLORS[5] },
];

const generateDemoTimelineData = (): TimelineData[] => {
  const now = new Date();
  const months: TimelineData[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    
    // Generate realistic-looking growth data
    months.push({
      date: monthKey,
      total: 8 + (5 - i) * 2 + Math.floor(Math.random() * 3),
      donated: Math.floor((5 - i) * 0.5) + Math.floor(Math.random() * 2),
      sold: Math.floor((5 - i) * 0.3) + Math.floor(Math.random() * 2),
    });
  }
  
  return months;
};

const InventoryDashboard = () => {
  const { isDemoMode } = useDemo();
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'category' | 'brand' | 'subcategory'>('category');

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    } else {
      fetchDashboardData();
    }
  }, [viewType, isDemoMode]);

  const loadDemoData = () => {
    // Generate category data based on view type
    if (viewType === 'category') {
      setCategoryData(DEMO_CATEGORY_DATA);
    } else if (viewType === 'brand') {
      const brandData: CategoryData[] = [
        { name: "Apple", value: 2, color: COLORS[0] },
        { name: "Sony", value: 1, color: COLORS[1] },
        { name: "Nike", value: 1, color: COLORS[2] },
        { name: "Patagonia", value: 1, color: COLORS[3] },
        { name: "IKEA", value: 1, color: COLORS[4] },
        { name: "Others", value: 6, color: COLORS[5] },
      ];
      setCategoryData(brandData);
    } else {
      // Subcategory view - more detailed
      const subcategoryData: CategoryData[] = [
        { name: "Laptops", value: 1, color: COLORS[0] },
        { name: "Headphones", value: 1, color: COLORS[1] },
        { name: "Jackets", value: 2, color: COLORS[2] },
        { name: "Camping Gear", value: 2, color: COLORS[3] },
        { name: "Kitchen Appliances", value: 2, color: COLORS[4] },
        { name: "Others", value: 4, color: COLORS[5] },
      ];
      setCategoryData(subcategoryData);
    }
    
    setTimelineData(generateDemoTimelineData());
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch only the current user's items with categories
      const { data: items, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          categories (name, parent_id)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Fetch all categories to build parent relationships
      const { data: allCategories } = await supabase
        .from("categories")
        .select("*");

      const categoryMap = new Map(allCategories?.map(cat => [cat.id, cat]) || []);

      // Group by the selected view type
      const dataMap = new Map<string, number>();
      
      if (viewType === 'category') {
        // Show main categories only - roll up subcategories to their parents
        items?.forEach((item) => {
          if (item.category_id) {
            let category = categoryMap.get(item.category_id);
            // If it's a subcategory, find the root parent
            while (category?.parent_id) {
              category = categoryMap.get(category.parent_id);
            }
            const categoryName = category?.name || "Uncategorized";
            dataMap.set(categoryName, (dataMap.get(categoryName) || 0) + 1);
          } else {
            dataMap.set("Uncategorized", (dataMap.get("Uncategorized") || 0) + 1);
          }
        });
      } else if (viewType === 'brand') {
        items?.forEach((item) => {
          const brandName = item.brand || "No Brand";
          dataMap.set(brandName, (dataMap.get(brandName) || 0) + 1);
        });
      } else if (viewType === 'subcategory') {
        items?.forEach((item) => {
          // Show the actual assigned category (could be main or sub)
          const categoryName = item.categories?.name || "Uncategorized";
          dataMap.set(categoryName, (dataMap.get(categoryName) || 0) + 1);
        });
      }

      // Sort by count and get top 5
      const sortedData = Array.from(dataMap.entries())
        .sort((a, b) => b[1] - a[1]);

      const top5 = sortedData.slice(0, 5);
      const others = sortedData.slice(5);

      const chartData: CategoryData[] = top5.map(
        ([name, value], index) => ({
          name,
          value,
          color: COLORS[index],
        })
      );

      // Add "Others" category if there are more than 5
      if (others.length > 0) {
        const othersCount = others.reduce((sum, [, count]) => sum + count, 0);
        chartData.push({
          name: "Others",
          value: othersCount,
          color: COLORS[5],
        });
      }

      setCategoryData(chartData);

      // Generate timeline data based on earliest item
      const now = new Date();
      const months: string[] = [];
      const monthData: { [key: string]: Date } = {};
      
      // Find the earliest item date
      let earliestDate = now;
      items?.forEach((item) => {
        const createdDate = new Date(item.created_at || "");
        if (createdDate < earliestDate) {
          earliestDate = createdDate;
        }
      });
      
      // Calculate months between earliest and now (minimum 2 months for context)
      const monthsDiff = Math.max(2, 
        (now.getFullYear() - earliestDate.getFullYear()) * 12 + 
        (now.getMonth() - earliestDate.getMonth()) + 1
      );
      
      // Cap at 12 months maximum
      const monthsToShow = Math.min(12, monthsDiff);
      
      // Generate months from earliest to now
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
        months.push(monthKey);
        monthData[monthKey] = date;
      }

      // Calculate cumulative counts for each month
      const timelineChartData = months.map((monthKey) => {
        const monthDate = monthData[monthKey];
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
        
        let activeCount = 0;
        let donatedCount = 0;
        let soldCount = 0;
        
        items?.forEach((item) => {
          const createdDate = new Date(item.created_at || "");
          
          // Count items that existed by the end of this month
          if (createdDate <= endOfMonth) {
            // Check status at end of month
            const donatedDate = item.donated_date ? new Date(item.donated_date) : null;
            const soldDate = item.sold_date ? new Date(item.sold_date) : null;
            
            if (donatedDate && donatedDate <= endOfMonth) {
              donatedCount++;
            } else if (soldDate && soldDate <= endOfMonth) {
              soldCount++;
            } else if (!item.is_donated && !item.is_sold) {
              activeCount++;
            }
          }
        });

        return {
          date: monthKey,
          total: activeCount,
          donated: donatedCount,
          sold: soldCount,
        };
      });

      setTimelineData(timelineChartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-8">
      {/* Category Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Items by {viewType === 'category' ? 'Main Category' : viewType === 'brand' ? 'Brand' : 'Detailed Category'}
          </h3>
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as any)}>
            <TabsList>
              <TabsTrigger value="category">Main</TabsTrigger>
              <TabsTrigger value="subcategory">Detailed</TabsTrigger>
              <TabsTrigger value="brand">Brand</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
              }}
              label={({ percent }) => {
                // Only show label if slice is big enough (>5%)
                if (percent > 0.05) {
                  return `${(percent * 100).toFixed(0)}%`;
                }
                return "";
              }}
              outerRadius={90}
              innerRadius={40}
              fill="hsl(var(--primary))"
              dataKey="value"
              paddingAngle={2}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Timeline Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
            />
            <Legend />
            <Bar 
              dataKey="total" 
              fill="hsl(var(--chart-1))"
              name="Active Items"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="donated" 
              fill="hsl(var(--chart-2))"
              name="Donated"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="sold" 
              fill="hsl(var(--chart-3))"
              name="Sold"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
