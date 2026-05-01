import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Image as ImageIcon } from "lucide-react";
import { QuirkyLoader } from "@/components/QuirkyLoader";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { useDemo } from "@/contexts/DemoContext";
import {
  categoryToGroup,
  TOP_LEVEL_GROUPS,
  TopLevelGroup,
} from "@/lib/topLevelGroups";

interface Item {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  group: TopLevelGroup;
  original_price: number | null;
  quantity: number;
  
  condition: string | null;
  brand: string | null;
  image_url: string | null;
}

type SortKey = "recent" | "price_desc" | "price_asc" | "name_asc";

const PRICE_BUCKETS = [
  { label: "Under $20", min: 0, max: 20 },
  { label: "$20 – $100", min: 20, max: 100 },
  { label: "$100 – $500", min: 100, max: 500 },
  { label: "$500+", min: 500, max: Infinity },
] as const;

const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const;

const InventoryPickleView = () => {
  const navigate = useNavigate();
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  // filters
  const [activeGroups, setActiveGroups] = useState<Set<TopLevelGroup>>(new Set());
  
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [activeConditions, setActiveConditions] = useState<Set<string>>(new Set());
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [withImagesOnly, setWithImagesOnly] = useState(false);
  const [excessOnly, setExcessOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isDemoMode) {
          const catMap = new Map(demoCategories.map((c: any) => [c.id, c.name]));
          setItems(
            demoItems.map((it: any) => {
              const catName = catMap.get(it.category_id) ?? null;
              const img =
                Array.isArray(it.image_urls) && it.image_urls.length
                  ? it.image_urls[0]
                  : it.image ?? null;
              return {
                id: it.id,
                name: it.name,
                category_id: it.category_id,
                category_name: catName,
                group: categoryToGroup(catName),
                original_price: it.original_price ?? null,
                quantity: it.quantity ?? 1,
                condition: it.condition ?? null,
                brand: it.brand ?? null,
                image_url: img,
              };
            })
          );
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setItems([]);
          return;
        }

        const [{ data: rows }, { data: cats }] = await Promise.all([
          supabase
            .from("inventory_items")
            .select(
              "id, name, category_id, original_price, quantity, condition, brand, image_urls, created_at, is_donated, is_sold, is_eliminated"
            )
            .eq("user_id", user.id)
            .eq("is_donated", false)
            .eq("is_sold", false)
            .eq("is_eliminated", false)
            .order("created_at", { ascending: false }),
          supabase.from("categories").select("id, name"),
        ]);

        const catMap = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
        setItems(
          (rows ?? []).map((it: any) => {
            const catName = it.category_id
              ? catMap.get(it.category_id) ?? null
              : null;
            return {
              id: it.id,
              name: it.name,
              category_id: it.category_id,
              category_name: catName,
              group: categoryToGroup(catName),
              original_price: it.original_price ?? null,
              quantity: it.quantity ?? 1,
              
              condition: it.condition ?? null,
              brand: it.brand ?? null,
              image_url:
                Array.isArray(it.image_urls) && it.image_urls.length
                  ? it.image_urls[0]
                  : null,
            };
          })
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isDemoMode, demoItems, demoCategories]);


  const brands = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.brand && s.add(i.brand));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((it) => {
      if (q) {
        const hay = [it.name, it.brand, it.category_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeGroups.size && !activeGroups.has(it.group)) return false;
      if (activeBrands.size && !(it.brand && activeBrands.has(it.brand)))
        return false;
      if (activeConditions.size && !(it.condition && activeConditions.has(it.condition)))
        return false;
      if (activePrice) {
        const bucket = PRICE_BUCKETS.find((b) => b.label === activePrice);
        const p = it.original_price ?? 0;
        if (bucket && (p < bucket.min || p >= bucket.max)) return false;
      }
      if (withImagesOnly && !it.image_url) return false;
      if (excessOnly && (it.quantity ?? 1) <= 1) return false;
      return true;
    });

    if (sort === "price_desc")
      list = [...list].sort(
        (a, b) => (b.original_price ?? 0) - (a.original_price ?? 0)
      );
    if (sort === "price_asc")
      list = [...list].sort(
        (a, b) => (a.original_price ?? 0) - (b.original_price ?? 0)
      );
    if (sort === "name_asc")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    // "recent" already from query order
    return list;
  }, [
    items,
    search,
    sort,
    activeGroups,
    activeBrands,
    activeConditions,
    activePrice,
    withImagesOnly,
    excessOnly,
  ]);

  const toggleSet = <T,>(setter: (s: Set<T>) => void, current: Set<T>, val: T) => {
    const next = new Set(current);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const clearAll = () => {
    setActiveGroups(new Set());
    
    setActiveBrands(new Set());
    setActiveConditions(new Set());
    setActivePrice(null);
    setWithImagesOnly(false);
    setExcessOnly(false);
  };

  const excessCount = useMemo(
    () => items.filter((i) => (i.quantity ?? 1) > 1).length,
    [items]
  );

  const hasFilters =
    activeGroups.size > 0 ||
    
    activeBrands.size > 0 ||
    activeConditions.size > 0 ||
    activePrice !== null ||
    withImagesOnly ||
    excessOnly;

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <QuirkyLoader />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your estate is empty"
        description="Add your first item to start building your inventory."
        action={{
          label: "Add an item",
          onClick: () => navigate("/dashboard/add-item"),
        }}
      />
    );
  }

  // Quick chips at top of sidebar
  const chips: { label: string; active: boolean; onClick: () => void }[] = [
    {
      label: "With photo",
      active: withImagesOnly,
      onClick: () => setWithImagesOnly((v) => !v),
    },
    ...(excessCount > 0
      ? [
          {
            label: `Excess / duplicates (${excessCount})`,
            active: excessOnly,
            onClick: () => setExcessOnly((v) => !v),
          },
        ]
      : []),
    ...PRICE_BUCKETS.map((b) => ({
      label: b.label,
      active: activePrice === b.label,
      onClick: () =>
        setActivePrice((p) => (p === b.label ? null : b.label)),
    })),
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 -mx-4 md:-mx-0">
      {/* Sidebar filter rail */}
      <aside className="lg:w-60 lg:shrink-0 px-4 lg:px-0 lg:border-r border-border/60 lg:pr-6">
        <div className="space-y-4 sticky top-24">
          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={c.onClick}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  c.active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/40"
                }`}
              >
                {c.label}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-xs px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <Accordion
            type="multiple"
            defaultValue={["category"]}
            className="border-t border-border/60"
          >
            <AccordionItem value="category" className="border-border/60">
              <AccordionTrigger className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:no-underline">
                Category
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  {TOP_LEVEL_GROUPS.map((g) => {
                    const count = items.filter((i) => i.group === g).length;
                    if (count === 0) return null;
                    const active = activeGroups.has(g);
                    return (
                      <label
                        key={g}
                        className="flex items-center justify-between text-sm cursor-pointer hover:text-foreground"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              toggleSet(setActiveGroups, activeGroups, g)
                            }
                            className="rounded border-border"
                          />
                          {g}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>


            {brands.length > 0 && (
              <AccordionItem value="brand" className="border-border/60">
                <AccordionTrigger className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:no-underline">
                  Brand
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1.5 max-h-60 overflow-auto pr-1">
                    {brands.map((b) => {
                      const count = items.filter((i) => i.brand === b).length;
                      const active = activeBrands.has(b);
                      return (
                        <label
                          key={b}
                          className="flex items-center justify-between text-sm cursor-pointer hover:text-foreground"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                toggleSet(setActiveBrands, activeBrands, b)
                              }
                              className="rounded border-border"
                            />
                            <span className="truncate">{b}</span>
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="condition" className="border-border/60">
              <AccordionTrigger className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:no-underline">
                Condition
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  {CONDITIONS.map((c) => {
                    const count = items.filter((i) => i.condition === c).length;
                    if (count === 0) return null;
                    const active = activeConditions.has(c);
                    return (
                      <label
                        key={c}
                        className="flex items-center justify-between text-sm cursor-pointer hover:text-foreground"
                      >
                        <span className="flex items-center gap-2 capitalize">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              toggleSet(setActiveConditions, activeConditions, c)
                            }
                            className="rounded border-border"
                          />
                          {c.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </aside>

      {/* Main grid area */}
      <div className="flex-1 min-w-0 px-4 lg:px-0">
        {/* Utility bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, brands, rooms…"
                className="pl-9 h-9 rounded-full bg-secondary/40 border-transparent focus-visible:bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground tabular-nums">
              {filtered.length.toLocaleString()}{" "}
              {filtered.length === 1 ? "item" : "items"}
            </span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-8 w-[160px] text-xs rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently added</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="name_asc">Name: A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            No items match your filters.
            {hasFilters && (
              <Button
                variant="link"
                onClick={clearAll}
                className="ml-2 h-auto p-0 text-sm"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-6">
            {filtered.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                onClick={() => navigate(`/dashboard/edit-item/${it.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ItemCard = ({ item, onClick }: { item: Item; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group text-left flex flex-col gap-2 focus:outline-none"
    >
      <div className="aspect-[4/5] w-full bg-secondary/40 overflow-hidden relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1.5">
            <ImageIcon className="w-6 h-6 opacity-40" />
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">
              {item.group}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="text-sm font-medium leading-tight truncate group-hover:underline underline-offset-2">
          {item.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {item.brand ||
            item.category_name ||
            "—"}
        </p>
        <p className="text-xs tabular-nums mt-0.5">
          {item.original_price != null
            ? formatCurrency(item.original_price)
            : <span className="text-muted-foreground">No price</span>}
          {item.quantity > 1 && (
            <span className="text-muted-foreground"> · ×{item.quantity}</span>
          )}
        </p>
      </div>
    </button>
  );
};

export default InventoryPickleView;
