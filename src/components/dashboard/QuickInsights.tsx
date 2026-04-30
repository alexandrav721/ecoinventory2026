import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, ChevronDown, ChevronUp, RefreshCw, Package, Copy } from "lucide-react";
import { createExcessInsights } from "@/lib/excessDetection";
import { findDuplicates } from "@/lib/duplicateDetection";
import { toast } from "sonner";
import { useDemo } from "@/contexts/DemoContext";

interface DuplicateGroup {
  items: Array<{
    id: string;
    name: string;
    brand: string | null;
    color: string | null;
    tags: string[];
    quantity: number;
  }>;
  similarityScore: number;
  matchReasons: string[];
}

interface Insight {
  id: string;
  type: "success" | "warning" | "info";
  icon: typeof TrendingUp;
  title: string;
  description: string;
}

const QuickInsights = () => {
  const { isDemoMode, demoExcessInsights } = useDemo();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingDuplicates, setAnalyzingDuplicates] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  useEffect(() => {
    if (isDemoMode) {
      // Use demo insights
      const demoInsights: Insight[] = demoExcessInsights.map(insight => ({
        id: insight.id,
        type: insight.type,
        icon: insight.type === 'warning' ? AlertCircle : insight.type === 'success' ? Sparkles : Package,
        title: insight.title,
        description: insight.description,
      }));
      setInsights(demoInsights);
      setLoading(false);
    } else {
      generateInsights();
    }
  }, [isDemoMode, demoExcessInsights]);

  const handleAnalyzeExcess = async () => {
    if (isDemoMode) {
      toast.info("In the full app, this analyzes your actual inventory against household benchmarks!");
      return;
    }
    
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to analyze inventory");
        return;
      }

      const insightsCreated = await createExcessInsights(user.id);
      
      if (insightsCreated > 0) {
        toast.success(`Found ${insightsCreated} excess item insight${insightsCreated > 1 ? 's' : ''}!`);
        // Refresh insights to show the new ones
        generateInsights();
      } else {
        toast.info("No excess items detected. Your inventory looks balanced!");
      }
    } catch (error) {
      console.error("Error analyzing excess:", error);
      toast.error("Failed to analyze inventory");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeDuplicates = async () => {
    if (isDemoMode) {
      toast.info("In the full app, this finds similar items in your inventory based on name, brand, and color!");
      return;
    }
    
    setAnalyzingDuplicates(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to analyze inventory");
        return;
      }

      const groups = await findDuplicates(user.id);
      setDuplicates(groups);
      
      if (groups.length > 0) {
        toast.success(`Found ${groups.length} potential duplicate group${groups.length > 1 ? 's' : ''}`);
        setDuplicateDialogOpen(true);
      } else {
        toast.info("No duplicates found. Your inventory looks clean!");
      }
    } catch (error) {
      console.error("Error analyzing duplicates:", error);
      toast.error("Failed to analyze duplicates");
    } finally {
      setAnalyzingDuplicates(false);
    }
  };

  const generateInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: items } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id);

      if (!items) {
        setLoading(false);
        return;
      }

      const generatedInsights: Insight[] = [];
      const activeItems = items.filter(item => !item.is_donated && !item.is_sold && !item.is_eliminated);

      // Fetch excess insights from database
      const { data: excessInsights } = await supabase
        .from('inventory_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('insight_type', 'excess')
        .eq('is_dismissed', false)
        .order('priority', { ascending: false });

      // Add excess insights to the list
      if (excessInsights && excessInsights.length > 0) {
        excessInsights.forEach(insight => {
          generatedInsights.push({
            id: insight.id,
            type: insight.priority === 'high' ? 'warning' : 'info',
            icon: Package,
            title: insight.title,
            description: insight.description,
          });
        });
      }
      const now = new Date();

      // Insight: Unused items
      const unusedItems = activeItems.filter(item => {
        if (!item.purchase_date) return false;
        const monthsSincePurchase = (now.getTime() - new Date(item.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsSincePurchase >= 6 && item.usage_frequency === 'rarely';
      });

      if (unusedItems.length >= 3) {
        const potentialValue = unusedItems.reduce((sum, item) => 
          sum + ((item.original_price || 0) * item.quantity * 0.6), 0
        );
        generatedInsights.push({
          id: "unused-items",
          type: "warning",
          icon: AlertCircle,
          title: `${unusedItems.length} items rarely used in 6+ months`,
          description: `You could recover approximately ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(potentialValue)} by selling them.`
        });
      }

      // Insight: Donation activity
      const donatedItems = items.filter(item => item.is_donated);
      if (donatedItems.length > 0) {
        const donatedValue = donatedItems.reduce((sum, item) => 
          sum + ((item.donated_price || item.original_price || 0) * item.quantity), 0
        );
        generatedInsights.push({
          id: "donation-impact",
          type: "success",
          icon: Sparkles,
          title: `${donatedItems.length} items donated`,
          description: `You've contributed ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(donatedValue)} worth of items to your community.`
        });
      }

      // Insight: Duplicate items
      const duplicates = activeItems.filter(item => item.quantity > 3);
      if (duplicates.length > 0) {
        generatedInsights.push({
          id: "duplicates",
          type: "info",
          icon: Lightbulb,
          title: `${duplicates.length} items with 3+ quantity`,
          description: "Consider sharing or donating extras to reduce clutter and help others."
        });
      }

      // Insight: Recent additions
      const recentItems = activeItems.filter(item => {
        if (!item.created_at) return false;
        const daysSinceAdded = (now.getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceAdded <= 7;
      });

      if (recentItems.length >= 5) {
        generatedInsights.push({
          id: "recent-additions",
          type: "info",
          icon: TrendingUp,
          title: `${recentItems.length} items added this week`,
          description: "Your inventory is growing. Consider reviewing storage optimization."
        });
      }

      // Insight: Well organized
      const organizedItems = activeItems.filter(item => item.location && item.category_id);
      const organizationRate = activeItems.length > 0 ? (organizedItems.length / activeItems.length) * 100 : 0;
      
      if (organizationRate >= 80) {
        generatedInsights.push({
          id: "well-organized",
          type: "success",
          icon: Sparkles,
          title: `${Math.round(organizationRate)}% of items are well organized`,
          description: "Great job! Your inventory is properly categorized and located."
        });
      }

      setInsights(generatedInsights.slice(0, 4));
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
      case "warning":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
      case "info":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30";
    }
  };

  const getBadgeVariant = (type: Insight['type']) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "destructive";
      case "info":
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Quick Insights</CardTitle>
              {insights.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {insights.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAnalyzeExcess}
                    disabled={analyzing}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${analyzing ? 'animate-spin' : ''}`} />
                    Analyze Excess
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Compares your inventory against typical household benchmarks</p>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Example results:</p>
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">15 Coffee Mugs</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">Typical: 8, You have: 15</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">8 Towels</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">Typical: 6, You have: 8</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAnalyzeDuplicates}
                    disabled={analyzingDuplicates}
                  >
                    <Copy className={`w-3 h-3 mr-1 ${analyzingDuplicates ? 'animate-spin' : ''}`} />
                    Analyze Duplicates
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Finds similar items based on name, brand, color, and tags</p>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Example results:</p>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">3 Similar Items Found</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">White T-Shirt • White Tee • Cotton White Shirt</p>
                            <Badge variant="outline" className="text-xs mt-1">85% match</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {insights.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No insights yet. Click "Analyze Excess" to compare your inventory against typical household benchmarks.</p>
              </div>
            ) : (
              insights.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-sm ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm leading-tight">{insight.title}</p>
                          <Badge variant={getBadgeVariant(insight.type)} className="text-xs flex-shrink-0">
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Duplicate Results Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Duplicate Detection Results
            </DialogTitle>
            <DialogDescription>
              Found {duplicates.length} group{duplicates.length !== 1 ? 's' : ''} of similar items ({duplicates.reduce((sum, group) => sum + group.items.length, 0)} total items)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {duplicates.map((group, idx) => (
              <Card key={idx} className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">
                          {group.items.length} Similar Items
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(group.similarityScore)}% match
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                                {item.brand && <span>Brand: {item.brand}</span>}
                                {item.color && <span>• Color: {item.color}</span>}
                                {item.tags.length > 0 && (
                                  <span>• Tags: {item.tags.slice(0, 3).join(", ")}</span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              Qty: {item.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Why similar:</span> {group.matchReasons.join(", ")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      </Collapsible>
    </TooltipProvider>
  );
};

export default QuickInsights;
