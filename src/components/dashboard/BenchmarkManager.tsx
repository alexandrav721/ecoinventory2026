import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Save, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { analyzeImpact } from "@/lib/benchmarkImpactAnalysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";

interface Benchmark {
  id: string;
  category_key: string;
  display_name: string;
  typical_quantity: number;
  max_quantity: number;
  reasoning: string;
  keywords: string[];
}

const benchmarkSchema = z.object({
  category_key: z.string().trim().min(1, "Category key is required").max(50).regex(/^[a-z_]+$/, "Use lowercase letters and underscores only"),
  display_name: z.string().trim().min(1, "Display name is required").max(100),
  typical_quantity: z.number().min(1, "Must be at least 1").max(1000),
  max_quantity: z.number().min(1, "Must be at least 1").max(1000),
  reasoning: z.string().trim().min(10, "Reasoning must be at least 10 characters").max(500),
  keywords: z.string().trim().min(1, "Keywords are required").max(500),
});

const BenchmarkManager = () => {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [impactPreview, setImpactPreview] = useState<any>(null);
  const [analyzingImpact, setAnalyzingImpact] = useState(false);
  const [formData, setFormData] = useState({
    category_key: "",
    display_name: "",
    typical_quantity: 1,
    max_quantity: 1,
    reasoning: "",
    keywords: "",
  });

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const fetchBenchmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_benchmarks")
        .select("*")
        .order("display_name");

      if (error) throw error;
      setBenchmarks(data || []);
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
      toast.error("Failed to load benchmarks");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    try {
      benchmarkSchema.parse({
        ...formData,
        keywords: formData.keywords,
      });
      
      // Additional validation: max must be >= typical
      if (formData.max_quantity < formData.typical_quantity) {
        setErrors({ max_quantity: "Max quantity must be greater than or equal to typical quantity" });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleAnalyzeImpact = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors first");
      return;
    }

    setAnalyzingImpact(true);
    try {
      const keywords = formData.keywords.split(",").map(k => k.trim()).filter(k => k);
      
      const preview = await analyzeImpact({
        category_key: formData.category_key,
        typical_quantity: formData.typical_quantity,
        max_quantity: formData.max_quantity,
        keywords,
      });

      setImpactPreview(preview);
    } catch (error) {
      console.error("Error analyzing impact:", error);
      toast.error("Failed to analyze impact");
    } finally {
      setAnalyzingImpact(false);
    }
  };

  const handleAdd = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const keywords = formData.keywords.split(",").map(k => k.trim()).filter(k => k);

      const { error } = await supabase.from("inventory_benchmarks").insert([
        {
          category_key: formData.category_key,
          display_name: formData.display_name,
          typical_quantity: formData.typical_quantity,
          max_quantity: formData.max_quantity,
          reasoning: formData.reasoning,
          keywords,
          created_by: user.id,
          updated_by: user.id,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error("A benchmark with this category key already exists");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Benchmark added successfully!");
      setIsAddDialogOpen(false);
      resetForm();
      setImpactPreview(null);
      fetchBenchmarks();
    } catch (error) {
      console.error("Error adding benchmark:", error);
      toast.error("Failed to add benchmark");
    }
  };

  const handleUpdate = async (id: string) => {
    const benchmark = benchmarks.find(b => b.id === id);
    if (!benchmark) return;

    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const keywords = formData.keywords.split(",").map(k => k.trim()).filter(k => k);

      const { error } = await supabase
        .from("inventory_benchmarks")
        .update({
          display_name: formData.display_name,
          typical_quantity: formData.typical_quantity,
          max_quantity: formData.max_quantity,
          reasoning: formData.reasoning,
          keywords,
          updated_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Benchmark updated successfully!");
      setEditingId(null);
      resetForm();
      setImpactPreview(null);
      fetchBenchmarks();
    } catch (error) {
      console.error("Error updating benchmark:", error);
      toast.error("Failed to update benchmark");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this benchmark?")) return;

    try {
      const { error } = await supabase
        .from("inventory_benchmarks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Benchmark deleted successfully!");
      fetchBenchmarks();
    } catch (error) {
      console.error("Error deleting benchmark:", error);
      toast.error("Failed to delete benchmark");
    }
  };

  const startEdit = (benchmark: Benchmark) => {
    setEditingId(benchmark.id);
    setFormData({
      category_key: benchmark.category_key,
      display_name: benchmark.display_name,
      typical_quantity: benchmark.typical_quantity,
      max_quantity: benchmark.max_quantity,
      reasoning: benchmark.reasoning,
      keywords: benchmark.keywords.join(", "),
    });
    setErrors({});
    setImpactPreview(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
    setImpactPreview(null);
  };

  const resetForm = () => {
    setFormData({
      category_key: "",
      display_name: "",
      typical_quantity: 1,
      max_quantity: 1,
      reasoning: "",
      keywords: "",
    });
    setErrors({});
    setImpactPreview(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Benchmarks</CardTitle>
              <CardDescription>
                Manage typical and maximum quantities for different item categories
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Benchmark
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Typical</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Reasoning</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((benchmark) => (
                  <TableRow key={benchmark.id}>
                    {editingId === benchmark.id ? (
                      <>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={formData.display_name}
                              onChange={(e) =>
                                setFormData({ ...formData, display_name: e.target.value })
                              }
                              placeholder="Display name"
                            />
                            {errors.display_name && (
                              <p className="text-xs text-destructive">{errors.display_name}</p>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {benchmark.category_key}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="1"
                              value={formData.typical_quantity}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  typical_quantity: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-20"
                            />
                            {errors.typical_quantity && (
                              <p className="text-xs text-destructive">{errors.typical_quantity}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="1"
                              value={formData.max_quantity}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  max_quantity: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-20"
                            />
                            {errors.max_quantity && (
                              <p className="text-xs text-destructive">{errors.max_quantity}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Textarea
                              value={formData.reasoning}
                              onChange={(e) =>
                                setFormData({ ...formData, reasoning: e.target.value })
                              }
                              className="min-h-[60px]"
                            />
                            {errors.reasoning && (
                              <p className="text-xs text-destructive">{errors.reasoning}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={formData.keywords}
                              onChange={(e) =>
                                setFormData({ ...formData, keywords: e.target.value })
                              }
                              placeholder="comma, separated"
                            />
                            {errors.keywords && (
                              <p className="text-xs text-destructive">{errors.keywords}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdate(benchmark.id)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div>
                            <div className="font-medium">{benchmark.display_name}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {benchmark.category_key}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{benchmark.typical_quantity}</TableCell>
                        <TableCell>{benchmark.max_quantity}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {benchmark.reasoning}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {benchmark.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {benchmark.keywords.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{benchmark.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(benchmark)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(benchmark.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Benchmark</DialogTitle>
            <DialogDescription>
              Create a new inventory benchmark for item excess detection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_key">Category Key *</Label>
                <Input
                  id="category_key"
                  value={formData.category_key}
                  onChange={(e) =>
                    setFormData({ ...formData, category_key: e.target.value })
                  }
                  placeholder="e.g., winter_coat"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters and underscores only
                </p>
                {errors.category_key && (
                  <p className="text-xs text-destructive">{errors.category_key}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="e.g., Winter Coats"
                />
                {errors.display_name && (
                  <p className="text-xs text-destructive">{errors.display_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typical_quantity">Typical Quantity *</Label>
                <Input
                  id="typical_quantity"
                  type="number"
                  min="1"
                  value={formData.typical_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      typical_quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
                {errors.typical_quantity && (
                  <p className="text-xs text-destructive">{errors.typical_quantity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_quantity">Max Quantity *</Label>
                <Input
                  id="max_quantity"
                  type="number"
                  min="1"
                  value={formData.max_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
                {errors.max_quantity && (
                  <p className="text-xs text-destructive">{errors.max_quantity}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasoning">Reasoning *</Label>
              <Textarea
                id="reasoning"
                value={formData.reasoning}
                onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
                placeholder="Explain why this quantity is typical..."
                className="min-h-[80px]"
              />
              {errors.reasoning && (
                <p className="text-xs text-destructive">{errors.reasoning}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords *</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="comma, separated, keywords"
              />
              <p className="text-xs text-muted-foreground">
                Keywords help match item names to this benchmark
              </p>
              {errors.keywords && (
                <p className="text-xs text-destructive">{errors.keywords}</p>
              )}
            </div>

            {/* Impact Preview */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyzeImpact}
                disabled={analyzingImpact}
                className="w-full"
              >
                <Eye className={`w-4 h-4 mr-2 ${analyzingImpact ? 'animate-pulse' : ''}`} />
                {analyzingImpact ? 'Analyzing...' : 'Preview Impact'}
              </Button>

              {impactPreview && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">Impact Preview</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded border">
                      <div className="text-2xl font-bold">{impactPreview.totalUsersAffected}</div>
                      <div className="text-xs text-muted-foreground">Users Affected</div>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <div className="text-2xl font-bold">{impactPreview.newInsightsCount}</div>
                      <div className="text-xs text-muted-foreground">New Insights</div>
                    </div>
                  </div>

                  {(impactPreview.severityChanges.toExcessive > 0 || 
                    impactPreview.severityChanges.toSlightlyOver > 0 ||
                    impactPreview.severityChanges.toOk > 0) && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium">Severity Changes:</div>
                      {impactPreview.severityChanges.toExcessive > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="destructive" className="text-xs">
                            {impactPreview.severityChanges.toExcessive}
                          </Badge>
                          <span className="text-muted-foreground">→ Excessive</span>
                        </div>
                      )}
                      {impactPreview.severityChanges.toSlightlyOver > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="secondary" className="text-xs">
                            {impactPreview.severityChanges.toSlightlyOver}
                          </Badge>
                          <span className="text-muted-foreground">→ Slightly Over</span>
                        </div>
                      )}
                      {impactPreview.severityChanges.toOk > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {impactPreview.severityChanges.toOk}
                          </Badge>
                          <span className="text-muted-foreground">→ OK (resolved)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {impactPreview.affectedUsers.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium">Top Affected Users:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {impactPreview.affectedUsers.map((user: any) => (
                          <div key={user.userId} className="text-xs flex items-center justify-between p-2 bg-background rounded border">
                            <span className="truncate flex-1">{user.email}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                {user.itemCount} items
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge 
                                variant={user.newStatus === 'excessive' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {user.newStatus}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {impactPreview.totalUsersAffected === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      No users would be affected by this change
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Benchmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BenchmarkManager;
