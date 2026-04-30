import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Feedback {
  id: string;
  item_name: string;
  suggested_category_id: string | null;
  actual_category_id: string | null;
  feedback_type: string;
  notes: string | null;
  created_at: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface FeedbackStats {
  item_name: string;
  total_feedback: number;
  incorrect_count: number;
  helpful_count: number;
  no_suggestion_count: number;
  most_common_actual_category: string | null;
}

export default function SuggestionFeedbackManager() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<FeedbackStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name, icon");
    setCategories(categoriesData || []);

    // Fetch all feedback
    const { data: feedbackData, error } = await supabase
      .from("suggestion_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Failed to load feedback");
      console.error(error);
    } else {
      setFeedback(feedbackData || []);
      calculateStats(feedbackData || []);
    }
    
    setLoading(false);
  };

  const calculateStats = (feedbackData: Feedback[]) => {
    const grouped = feedbackData.reduce((acc, fb) => {
      const name = fb.item_name.toLowerCase();
      if (!acc[name]) {
        acc[name] = {
          item_name: fb.item_name,
          total_feedback: 0,
          incorrect_count: 0,
          helpful_count: 0,
          no_suggestion_count: 0,
          actual_categories: [] as string[],
        };
      }
      
      acc[name].total_feedback++;
      if (fb.feedback_type === "incorrect") acc[name].incorrect_count++;
      if (fb.feedback_type === "helpful") acc[name].helpful_count++;
      if (fb.feedback_type === "no_suggestion") acc[name].no_suggestion_count++;
      
      if (fb.actual_category_id) {
        acc[name].actual_categories.push(fb.actual_category_id);
      }
      
      return acc;
    }, {} as Record<string, any>);

    const statsArray = Object.values(grouped).map((g: any) => {
      // Find most common actual category
      const categoryCounts = g.actual_categories.reduce((acc: any, catId: string) => {
        acc[catId] = (acc[catId] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommonCatId = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b, null
      );

      return {
        item_name: g.item_name,
        total_feedback: g.total_feedback,
        incorrect_count: g.incorrect_count,
        helpful_count: g.helpful_count,
        no_suggestion_count: g.no_suggestion_count,
        most_common_actual_category: mostCommonCatId,
      };
    }).sort((a, b) => b.incorrect_count - a.incorrect_count);

    setStats(statsArray as FeedbackStats[]);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "None";
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon || ""} ${category.name}`.trim() : "Unknown";
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("suggestion_feedback")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete feedback");
      console.error(error);
    } else {
      toast.success("Feedback deleted");
      fetchData();
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "helpful":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "incorrect":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "no_suggestion":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Suggestion Feedback Summary</CardTitle>
          <CardDescription>
            Top items with feedback - helps identify which suggestions need improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No feedback yet. Users will provide feedback when they use category suggestions.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Incorrect</TableHead>
                  <TableHead className="text-center">Helpful</TableHead>
                  <TableHead className="text-center">No Suggestion</TableHead>
                  <TableHead>Most Common Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.slice(0, 10).map((stat) => (
                  <TableRow key={stat.item_name}>
                    <TableCell className="font-medium">{stat.item_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{stat.total_feedback}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.incorrect_count > 0 && (
                        <Badge variant="destructive">{stat.incorrect_count}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.helpful_count > 0 && (
                        <Badge className="bg-green-500">{stat.helpful_count}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.no_suggestion_count > 0 && (
                        <Badge variant="outline">{stat.no_suggestion_count}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getCategoryName(stat.most_common_actual_category)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            Latest 100 feedback entries from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback entries yet.</p>
          ) : (
            <div className="space-y-2">
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFeedbackIcon(fb.feedback_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fb.item_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {fb.feedback_type.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Suggested: {getCategoryName(fb.suggested_category_id)}
                        {fb.actual_category_id && (
                          <> → Selected: {getCategoryName(fb.actual_category_id)}</>
                        )}
                      </div>
                      {fb.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{fb.notes}"
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fb.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Items with high "Incorrect" counts:</strong> These suggestions need improvement. 
            Check the "Most Common Category" column to see what users actually selected.
          </p>
          <p>
            <strong>Items with "No Suggestion":</strong> Add these keywords to your category mappings 
            or add matching products to your catalog.
          </p>
          <p>
            <strong>Items with "Helpful" feedback:</strong> These suggestions are working well! 
            Consider using similar patterns for related items.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}