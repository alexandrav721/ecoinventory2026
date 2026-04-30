import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  HIGH_IMPACT_ITEMS,
  LIFESTYLE_QUESTIONS,
  ROOMS,
  filterItemsByLifestyle,
  type HighImpactItem,
  type LifestyleTag,
  type Room,
} from "@/data/highImpactItems";
import { useDemo } from "@/contexts/DemoContext";
import { autoCategorizeItems } from "@/lib/autoCategorize";

type Step = "lifestyle" | "rooms" | "saving" | "everyday";

const Quiz = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [step, setStep] = useState<Step>("lifestyle");
  const [lifestyles, setLifestyles] = useState<LifestyleTag[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserId(session.user.id);
    });
  }, [isDemoMode, navigate]);

  const itemsForLifestyle = useMemo(
    () => filterItemsByLifestyle(HIGH_IMPACT_ITEMS, lifestyles),
    [lifestyles]
  );

  const itemsByRoom = useMemo(() => {
    const map = new Map<Room, HighImpactItem[]>();
    for (const room of ROOMS) {
      const items = itemsForLifestyle.filter((it) => it.room === room);
      if (items.length > 0) map.set(room, items);
    }
    return map;
  }, [itemsForLifestyle]);

  const activeRooms = Array.from(itemsByRoom.keys());
  const currentRoom = activeRooms[activeRoomIdx];
  const currentItems = currentRoom ? itemsByRoom.get(currentRoom) ?? [] : [];

  const toggleLifestyle = (id: LifestyleTag) => {
    setLifestyles((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const toggleItem = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalSelectedValue = useMemo(() => {
    return HIGH_IMPACT_ITEMS.filter((it) => selected.has(it.name)).reduce(
      (sum, it) => sum + it.typicalPrice,
      0
    );
  }, [selected]);

  const handleSaveAll = async () => {
    if (selected.size === 0) {
      toast.info("Pick at least one item to add to your inventory.");
      return;
    }

    if (isDemoMode) {
      toast.success(`${selected.size} items would be added`, {
        description: "Sign up to actually save them to your inventory.",
      });
      navigate("/dashboard?tab=inventory");
      return;
    }

    if (!userId) return;
    setSaving(true);
    try {
      const itemsToInsert = HIGH_IMPACT_ITEMS.filter((it) =>
        selected.has(it.name)
      ).map((it) => ({
        user_id: userId,
        name: it.name,
        original_price: it.typicalPrice,
        quantity: 1,
      }));

      const { data: inserted, error } = await supabase
        .from("inventory_items")
        .insert(itemsToInsert)
        .select("id, name");
      if (error) throw error;

      if (inserted && inserted.length > 0) {
        autoCategorizeItems(inserted).catch((e) =>
          console.warn("Auto-categorize failed:", e)
        );
      }

      toast.success(`Added ${itemsToInsert.length} items to your estate 🎉`, {
        description: `Estimated value: $${totalSelectedValue.toLocaleString()}`,
      });
      navigate("/dashboard?tab=inventory");
    } catch (err: any) {
      toast.error("Couldn't save items", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Skip
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>High-Impact Setup</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* STEP 1 — Lifestyle */}
        {step === "lifestyle" && (
          <div className="space-y-10">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                § Step 1 of 2
              </p>
              <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
                A few quick things <em className="font-display-wonk">about you</em>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                We'll use this to suggest the items most likely worth tracking
                first — the big-ticket stuff you probably already own.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {LIFESTYLE_QUESTIONS.map((q) => {
                const active = lifestyles.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleLifestyle(q.id)}
                    className={`text-left p-5 border rounded-xl transition-all ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{q.label}</span>
                      {active && (
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                I'd rather add things manually
              </button>
              <Button
                size="lg"
                onClick={() => setStep("rooms")}
                className="gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Rooms */}
        {step === "rooms" && currentRoom && (
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                § Step 2 — {activeRoomIdx + 1} of {activeRooms.length}
              </p>
              <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
                Anything <em className="font-display-wonk">{currentRoom}</em>?
              </h1>
              <p className="text-muted-foreground">
                Tap the items you own. We'll set a typical price — you can edit
                later. Skip anything you don't have.
              </p>
            </div>

            <Card className="p-2">
              <div className="divide-y">
                {currentItems.map((item) => {
                  const checked = selected.has(item.name);
                  return (
                    <label
                      key={item.name}
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/40 rounded-md"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleItem(item.name)}
                      />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="font-mono shrink-0">
                          ~${item.typicalPrice}
                        </Badge>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  if (activeRoomIdx === 0) setStep("lifestyle");
                  else setActiveRoomIdx((i) => i - 1);
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="text-sm text-muted-foreground">
                {selected.size} selected · ~${totalSelectedValue.toLocaleString()}
              </div>

              {activeRoomIdx < activeRooms.length - 1 ? (
                <Button
                  onClick={() => setActiveRoomIdx((i) => i + 1)}
                  className="gap-2"
                >
                  Next room
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? "Saving…" : `Add ${selected.size} items`}
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Quiz;
