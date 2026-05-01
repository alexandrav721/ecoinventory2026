import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  ImageIcon,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Tag as TagIcon,
  Pencil,
  Check,
  ShoppingBag,
  Repeat,
  HandHeart,
  Trash2,
} from "lucide-react";

interface ItemDetailSheetProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemFull {
  id: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  category_name: string | null;
  condition: string | null;
  original_price: number | null;
  quantity: number;
  image_urls: string[] | null;
  description: string | null;
  tags: string[] | null;
  purchase_date: string | null;
  created_at: string | null;
  size: string | null;
  color: string | null;
}

const conditionVariant = (c: string | null) => {
  const lc = (c ?? "").toLowerCase();
  if (lc.includes("new") || lc === "excellent") return "default";
  if (lc === "good") return "secondary";
  if (lc === "fair") return "outline";
  return "destructive";
};

// Mock "worth now" — depreciate ~25% but boost for like-new electronics
const estimateWorth = (item: ItemFull): number => {
  const paid = item.original_price ?? 0;
  if (paid === 0) return 0;
  const cond = (item.condition ?? "").toLowerCase();
  let factor = 0.5;
  if (cond.includes("new") || cond === "excellent") factor = 0.85;
  else if (cond === "good") factor = 0.6;
  else if (cond === "fair") factor = 0.35;
  // Electronics resale boost simulation
  if (item.category_name?.toLowerCase().includes("electronic")) factor += 0.05;
  return Math.round(paid * factor);
};

const aiInsight = (item: ItemFull) => {
  const cat = (item.category_name ?? "").toLowerCase();
  const worth = estimateWorth(item);
  if (cat.includes("electronic")) {
    const lo = Math.round(worth * 0.9);
    const hi = Math.round(worth * 1.15);
    return `Resale is hot right now — similar ${item.brand ?? "items"} sell for $${lo}–$${hi} on local marketplaces.`;
  }
  if (cat.includes("sport") || cat.includes("outdoor") || cat.includes("tool")) {
    return "2 people in your network want this. Listing to lend could earn goodwill (and rental income).";
  }
  if (cat.includes("clothing")) {
    return "Rarely worn? Loop members in your area are looking for pieces like this — time to pass it on.";
  }
  if (cat.includes("kitchen") || cat.includes("furniture") || cat.includes("book")) {
    return "Sitting unused? Decluttering this could help a neighbor and free up space.";
  }
  return "Untouched for 8+ months — consider rehoming, swapping, or lending it out.";
};

export const ItemDetailSheet = ({ itemId, open, onOpenChange }: ItemDetailSheetProps) => {
  const navigate = useNavigate();
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const [item, setItem] = useState<ItemFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (!open || !itemId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setItem(null);

      // Demo mode: pull from in-memory demo data
      if (isDemoMode || itemId.startsWith("demo-")) {
        const found = demoItems.find((i: any) => i.id === itemId);
        if (found) {
          const cat = demoCategories.find((c: any) => c.id === found.category_id);
          if (!cancelled) {
            setItem({
              id: found.id,
              name: found.name,
              brand: found.brand ?? null,
              category_id: found.category_id ?? null,
              category_name: cat?.name ?? null,
              condition: found.condition ?? null,
              original_price: found.original_price ?? null,
              quantity: found.quantity ?? 1,
              image_urls: found.image_urls ?? null,
              description: found.description ?? null,
              tags: found.tags ?? null,
              purchase_date: found.purchase_date ?? null,
              created_at: found.created_at ?? null,
              size: found.size ?? null,
              color: found.color ?? null,
            });
            setNotesDraft(found.description ?? "");
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          toast.error("Demo item not found");
          setLoading(false);
        }
        return;
      }

      // Real mode
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, brand, category_id, condition, original_price, quantity, image_urls, description, tags, purchase_date, created_at, size, color")
        .eq("id", itemId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        toast.error("Failed to load item");
        setLoading(false);
        return;
      }

      let categoryName: string | null = null;
      if (data.category_id) {
        const { data: cat } = await supabase
          .from("categories")
          .select("name")
          .eq("id", data.category_id)
          .maybeSingle();
        categoryName = cat?.name ?? null;
      }

      setItem({ ...(data as any), category_name: categoryName });
      setNotesDraft(data.description ?? "");
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [itemId, open, isDemoMode, demoItems, demoCategories]);

  const saveNotes = async () => {
    if (!item) return;
    if (isDemoMode || item.id.startsWith("demo-")) {
      setItem({ ...item, description: notesDraft });
      setEditingNotes(false);
      toast.success("Notes saved (demo)");
      return;
    }
    const { error } = await supabase
      .from("inventory_items")
      .update({ description: notesDraft })
      .eq("id", item.id);
    if (error) {
      toast.error("Could not save notes");
      return;
    }
    setItem({ ...item, description: notesDraft });
    setEditingNotes(false);
    toast.success("Notes saved");
  };

  const handleAction = (action: string) => {
    if (!item) return;
    if (isDemoMode || item.id.startsWith("demo-")) {
      toast.success(`${action} (demo) — “${item.name}”`);
      return;
    }
    if (action === "List to sell") {
      navigate(`/dashboard/edit-item/${item.id}?action=sell`);
    } else if (action === "Mark as decluttered") {
      navigate(`/dashboard/edit-item/${item.id}?action=declutter`);
    } else {
      navigate(`/dashboard/edit-item/${item.id}`);
    }
  };

  const cover = item?.image_urls?.[0];
  const paid = item?.original_price ?? 0;
  const worth = item ? estimateWorth(item) : 0;
  const delta = worth - paid;
  const deltaPct = paid > 0 ? Math.round((delta / paid) * 100) : 0;
  const isUp = delta >= 0;

  const dateAdded = item?.purchase_date ?? item?.created_at ?? null;
  const formattedDate = dateAdded
    ? new Date(dateAdded).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0"
      >
        {loading || !item ? (
          <div className="p-6 space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* HEADER */}
              <div className="relative">
                <div className="aspect-[4/3] w-full bg-secondary/40 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-10 h-10 opacity-40" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-background"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pt-4 pb-2">
                <h2 className="text-xl font-semibold leading-tight">{item.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {item.brand && (
                    <span className="text-sm text-muted-foreground">{item.brand}</span>
                  )}
                  {item.category_name && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {item.category_name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* VALUE */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      You paid
                    </p>
                    <p className="text-2xl font-semibold tabular-nums mt-1">
                      {paid > 0 ? formatCurrency(paid) : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Worth now
                    </p>
                    <p
                      className={`text-2xl font-semibold tabular-nums mt-1 ${
                        isUp ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {worth > 0 ? formatCurrency(worth) : "—"}
                    </p>
                  </div>
                </div>
                {paid > 0 && (
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        isUp ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {isUp ? "+" : ""}
                      {formatCurrency(delta)} · {isUp ? "+" : ""}
                      {deltaPct}%
                    </span>
                    {formattedDate && (
                      <span className="text-muted-foreground">Added {formattedDate}</span>
                    )}
                  </div>
                )}
              </div>

              {/* AI INSIGHT */}
              <div className="px-5 pb-4">
                <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 flex gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400 font-semibold">
                      Loop insight
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-100 mt-0.5 leading-snug">
                      {aiInsight(item)}
                    </p>
                  </div>
                </div>
              </div>

              {/* DETAILS */}
              <div className="px-5 pb-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {item.condition && (
                    <Badge variant={conditionVariant(item.condition) as any}>
                      {item.condition}
                    </Badge>
                  )}
                  {item.color && (
                    <Badge variant="outline">{item.color}</Badge>
                  )}
                  {item.size && (
                    <Badge variant="outline">Size {item.size}</Badge>
                  )}
                  {item.quantity > 1 && (
                    <Badge variant="outline">×{item.quantity}</Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Notes
                    </p>
                    {!editingNotes ? (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={saveNotes}
                        className="text-xs inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <Textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Add a note about this item…"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed min-h-[1.5rem]">
                      {item.description || (
                        <span className="text-muted-foreground italic">No notes yet.</span>
                      )}
                    </p>
                  )}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          <TagIcon className="w-3 h-3" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="border-t bg-background/95 backdrop-blur px-5 py-3 space-y-2">
              <Button
                onClick={() => handleAction("List to sell")}
                className="w-full"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                List to sell
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAction("Offer to swap")}
                  variant="outline"
                  size="sm"
                >
                  <Repeat className="w-4 h-4 mr-1.5" />
                  Swap
                </Button>
                <Button
                  onClick={() => handleAction("Lend to someone")}
                  variant="outline"
                  size="sm"
                >
                  <HandHeart className="w-4 h-4 mr-1.5" />
                  Lend
                </Button>
              </div>
              <Button
                onClick={() => handleAction("Mark as decluttered")}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Mark as decluttered
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
