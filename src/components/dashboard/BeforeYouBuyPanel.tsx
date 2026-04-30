import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Link as LinkIcon, CheckCircle2, XCircle, Users, Leaf, DollarSign, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

type Result = {
  product: { product_name: string; category?: string; estimated_price: number; estimated_co2_kg: number };
  ownedItems: Array<{ id: string; name: string; quantity: number; image_urls?: string[]; original_price?: number }>;
  borrowableItems: Array<{ id: string; name: string; user_id: string; image_urls?: string[]; sharing_price?: number }>;
  recommendation: "skip" | "borrow" | "consider" | "buy";
  reason: string;
  moneySaved: number;
  co2Saved: number;
};

const recoStyles = {
  skip: { label: "Don't buy it", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", icon: XCircle },
  borrow: { label: "Borrow instead", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: Users },
  consider: { label: "Consider carefully", color: "bg-amber-500/10 text-amber-700 border-amber-200", icon: Sparkles },
  buy: { label: "Go ahead", color: "bg-muted text-foreground border-border", icon: CheckCircle2 },
};

export default function BeforeYouBuyPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"search" | "ai" | "url">("search");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleCheck = async () => {
    if (!input.trim()) {
      toast.error("Tell us what you're about to buy");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const body = mode === "url" ? { url: input } : { query: input };
      const { data, error } = await supabase.functions.invoke("before-you-buy", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Result);
    } catch (e: any) {
      toast.error(e.message || "Couldn't run the check");
    } finally {
      setLoading(false);
    }
  };

  const reco = result ? recoStyles[result.recommendation] : null;
  const RecoIcon = reco?.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Before you buy</h2>
        <p className="text-muted-foreground text-sm">
          Check your inventory and your community before adding something new.
        </p>
      </div>

      <Card className="p-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="search" className="gap-2"><Search className="w-4 h-4" /> Quick search</TabsTrigger>
            <TabsTrigger value="ai" className="gap-2"><Sparkles className="w-4 h-4" /> Describe it</TabsTrigger>
            <TabsTrigger value="url" className="gap-2"><LinkIcon className="w-4 h-4" /> Paste link</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3">
            <Input
              placeholder="e.g. running shoes, blender, drill"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            />
            <p className="text-xs text-muted-foreground">A few keywords to match against what you already own.</p>
          </TabsContent>

          <TabsContent value="ai" className="space-y-3">
            <Textarea
              placeholder="e.g. I'm thinking about getting a stand mixer for baking on weekends."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Describe in your own words. AI extracts the product and matches it.</p>
          </TabsContent>

          <TabsContent value="url" className="space-y-3">
            <Input
              placeholder="https://..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            />
            <p className="text-xs text-muted-foreground">Paste a product link from any store.</p>
          </TabsContent>
        </Tabs>

        <Button onClick={handleCheck} disabled={loading} className="w-full mt-4 gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><Sparkles className="w-4 h-4" /> Check before buying</>}
        </Button>
      </Card>

      {result && reco && RecoIcon && (
        <div className="space-y-6">
          <Card className={`p-6 border-2 ${reco.color}`}>
            <div className="flex items-start gap-4">
              <RecoIcon className="w-8 h-8 shrink-0 mt-1" />
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">{reco.label}</Badge>
                <h3 className="text-2xl font-semibold mb-2">{result.product.product_name}</h3>
                <p className="text-base">{result.reason}</p>
              </div>
            </div>
          </Card>

          {(result.moneySaved > 0 || result.co2Saved > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm">
                  <DollarSign className="w-4 h-4" /> Potential savings
                </div>
                <div className="text-3xl font-semibold">${result.moneySaved.toFixed(0)}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm">
                  <Leaf className="w-4 h-4" /> CO₂ avoided
                </div>
                <div className="text-3xl font-semibold">{result.co2Saved.toFixed(1)} kg</div>
              </Card>
            </div>
          )}

          {result.ownedItems.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" /> What you already own ({result.ownedItems.length})
              </h3>
              <div className="space-y-3">
                {result.ownedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/dashboard/edit-item/${item.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    {item.image_urls?.[0] ? (
                      <img src={item.image_urls[0]} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        Qty {item.quantity}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {result.borrowableItems.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> Borrow from friends ({result.borrowableItems.length})
              </h3>
              <div className="space-y-3">
                {result.borrowableItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    {item.image_urls?.[0] ? (
                      <img src={item.image_urls[0]} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.sharing_price ? `$${item.sharing_price} to borrow` : "Free to borrow"}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/community`)}>Request</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.ownedItems.length === 0 && result.borrowableItems.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              Nothing matching found in your inventory or your friends' shared items.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
