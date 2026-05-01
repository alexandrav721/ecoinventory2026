import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronRight, SlidersHorizontal, X, Lock, Globe, Users, Layers, ShoppingBag, HandHeart } from "lucide-react";

type Item = {
  id: string;
  user_id: string;
  name: string;
  image_urls: string[] | null;
  condition: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  original_price: number | null;
  sharing_price: number | null;
  category_id: string | null;
  owner_city: string | null;
  owner_state: string | null;
};

type Chip = "today" | "discounts" | "fifty";
type Offer = "all" | "borrow" | "buy";
type Audience = "public" | "friends" | "all";

const CHIP_OPTIONS: { value: Chip; label: string }[] = [
  { value: "today", label: "Get it today" },
  { value: "discounts", label: "Discounts" },
  { value: "fifty", label: "50%+ off" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

const PAGE_SIZE = 24;

export function PickleStyleSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [audience, setAudience] = useState<Audience>("all");
  const [offer, setOffer] = useState<Offer>("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [chips, setChips] = useState<Set<Chip>>(new Set());
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [conditions, setConditions] = useState<Set<string>>(new Set());
  const [locations, setLocations] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("recommended");

  // Sync ?q= changes (header search) into local state
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setAuthed(!!session);
      setCurrentUserId(uid);
      if (uid) {
        const { data: fr } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .eq("status", "accepted")
          .or(`user_id.eq.${uid},friend_id.eq.${uid}`);
        const ids = new Set<string>();
        (fr ?? []).forEach((f: any) => {
          ids.add(f.user_id === uid ? f.friend_id : f.user_id);
        });
        setFriendIds(ids);
      }
    });
    supabase
      .from("categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from("inventory_items")
        .select(
          "id, user_id, name, image_urls, condition, brand, color, size, original_price, sharing_price, category_id"
        )
        .eq("is_available_for_sharing", true)
        .eq("is_donated", false)
        .eq("is_sold", false)
        .eq("is_eliminated", false)
        .order("created_at", { ascending: false })
        .limit(200);

      const ownerIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
      const ownerMap: Record<string, { city: string | null; state: string | null }> = {};
      if (ownerIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, city, state")
          .in("id", ownerIds);
        (profiles ?? []).forEach((p: any) => {
          ownerMap[p.id] = { city: p.city, state: p.state };
        });
      }

      const enriched: Item[] = (rows ?? []).map((r: any) => ({
        ...r,
        owner_city: ownerMap[r.user_id]?.city ?? null,
        owner_state: ownerMap[r.user_id]?.state ?? null,
      }));

      if (!cancelled) {
        setItems(enriched);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build dynamic filter facets from data
  const facets = useMemo(() => {
    const sizeSet = new Set<string>();
    const brandSet = new Set<string>();
    const colorSet = new Set<string>();
    const condSet = new Set<string>();
    const locSet = new Set<string>();
    items.forEach((it) => {
      if (it.size) sizeSet.add(it.size);
      if (it.brand) brandSet.add(it.brand);
      if (it.color) colorSet.add(it.color);
      if (it.condition) condSet.add(it.condition);
      if (it.owner_city) locSet.add(it.owner_city);
    });
    const sortStr = (a: string, b: string) => a.localeCompare(b);
    return {
      sizes: Array.from(sizeSet).sort(sortStr),
      brands: Array.from(brandSet).sort(sortStr),
      colors: Array.from(colorSet).sort(sortStr),
      conditions: Array.from(condSet).sort(sortStr),
      locations: Array.from(locSet).sort(sortStr),
    };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    // Audience filter: 'all' shows everyone, 'public' = strangers (not friends, not me),
    // 'friends' = only my accepted friends
    if (audience === "friends") {
      list = list.filter((it) => friendIds.has(it.user_id));
    } else if (audience === "public") {
      list = list.filter((it) => !friendIds.has(it.user_id) && it.user_id !== currentUserId);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((it) =>
        `${it.name} ${it.brand ?? ""} ${it.color ?? ""}`.toLowerCase().includes(q)
      );
    }
    if (sizes.size) list = list.filter((it) => it.size && sizes.has(it.size));
    if (brands.size) list = list.filter((it) => it.brand && brands.has(it.brand));
    if (colors.size) list = list.filter((it) => it.color && colors.has(it.color));
    if (cats.size) list = list.filter((it) => it.category_id && cats.has(it.category_id));
    if (conditions.size) list = list.filter((it) => it.condition && conditions.has(it.condition));
    if (locations.size) list = list.filter((it) => it.owner_city && locations.has(it.owner_city));
    if (priceMin) list = list.filter((it) => Number(it.sharing_price ?? 0) >= Number(priceMin));
    if (priceMax) list = list.filter((it) => Number(it.sharing_price ?? 0) <= Number(priceMax));

    if (offer === "borrow") list = list.filter((it) => !it.sharing_price || Number(it.sharing_price) === 0);
    if (offer === "buy") list = list.filter((it) => it.sharing_price && Number(it.sharing_price) > 0);
    if (chips.has("discounts"))
      list = list.filter(
        (it) =>
          it.original_price &&
          it.sharing_price &&
          Number(it.sharing_price) < Number(it.original_price)
      );
    if (chips.has("fifty"))
      list = list.filter(
        (it) =>
          it.original_price &&
          it.sharing_price &&
          Number(it.sharing_price) <= Number(it.original_price) * 0.5
      );

    switch (sort) {
      case "price-low":
        list = [...list].sort((a, b) => Number(a.sharing_price ?? 0) - Number(b.sharing_price ?? 0));
        break;
      case "price-high":
        list = [...list].sort((a, b) => Number(b.sharing_price ?? 0) - Number(a.sharing_price ?? 0));
        break;
      case "newest":
        // already sorted desc by created_at from query
        break;
    }
    return list;
  }, [items, query, sizes, brands, colors, cats, conditions, locations, priceMin, priceMax, chips, sort, audience, offer, friendIds, currentUserId]);

  const toggleSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleChip = (c: Chip) => toggleSet(setChips, c);

  const clearAll = () => {
    setChips(new Set());
    setSizes(new Set());
    setBrands(new Set());
    setColors(new Set());
    setCats(new Set());
    setConditions(new Set());
    setLocations(new Set());
    setPriceMin("");
    setPriceMax("");
    setQuery("");
    setSearchParams({});
  };

  const activeCount =
    chips.size + sizes.size + brands.size + colors.size + cats.size + conditions.size + locations.size +
    (priceMin ? 1 : 0) + (priceMax ? 1 : 0);

  const Sidebar = (
    <div className="space-y-1">
      <Accordion type="multiple" defaultValue={["category", "price"]} className="w-full">
        <FacetGroup
          id="size"
          label="Size"
          options={facets.sizes}
          selected={sizes}
          onToggle={(v) => toggleSet(setSizes, v)}
        />
        <FacetGroup
          id="brand"
          label="Brand"
          options={facets.brands}
          selected={brands}
          onToggle={(v) => toggleSet(setBrands, v)}
        />
        <FacetGroup
          id="category"
          label="Category"
          options={categories.map((c) => c.name)}
          selected={
            new Set(
              categories
                .filter((c) => cats.has(c.id))
                .map((c) => c.name)
            )
          }
          onToggle={(name) => {
            const cat = categories.find((c) => c.name === name);
            if (cat) toggleSet(setCats, cat.id);
          }}
        />
        <AccordionItem value="price" className="border-b">
          <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
            Price
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2 pb-2">
              <Input
                inputMode="decimal"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="h-9"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                inputMode="decimal"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="h-9"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        <FacetGroup
          id="color"
          label="Color"
          options={facets.colors}
          selected={colors}
          onToggle={(v) => toggleSet(setColors, v)}
        />
        <FacetGroup
          id="condition"
          label="Condition"
          options={facets.conditions}
          selected={conditions}
          onToggle={(v) => toggleSet(setConditions, v)}
        />
        <FacetGroup
          id="location"
          label="Location"
          options={facets.locations}
          selected={locations}
          onToggle={(v) => toggleSet(setLocations, v)}
        />
      </Accordion>
    </div>
  );

  return (
    <div className="bg-background">
      {/* Breadcrumb + Audience + Offer toggles */}
      <div className="container mx-auto px-4 pt-6 pb-3 flex items-center justify-between gap-4 flex-wrap">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Search</span>
        </nav>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Audience: All / Public / Friends */}
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            {([
              { value: "all" as Audience, label: "All", Icon: Layers },
              { value: "public" as Audience, label: "Public", Icon: Globe },
              { value: "friends" as Audience, label: `Friends${authed && friendIds.size > 0 ? ` · ${friendIds.size}` : ""}`, Icon: Users },
            ]).map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setAudience(value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  audience === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          {/* Offer type: All / Borrow / Buy */}
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            {([
              { value: "all" as Offer, label: "All", Icon: Layers },
              { value: "borrow" as Offer, label: "Borrow", Icon: HandHeart },
              { value: "buy" as Offer, label: "Buy", Icon: ShoppingBag },
            ]).map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setOffer(value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  offer === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {audience === "friends" && friendIds.size === 0 && (
        <div className="container mx-auto px-4 pb-2">
          <p className="text-sm text-muted-foreground italic">
            You don't have any friends yet —{" "}
            <Link to="/friends" className="underline hover:text-foreground">add some</Link>{" "}
            to see their items here. Switch to <button onClick={() => setAudience("all")} className="underline hover:text-foreground">All</button> to browse everyone.
          </p>
        </div>
      )}

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              {activeCount > 0 ? (
                <button
                  onClick={clearAll}
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              ) : (
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Filters</span>
              )}
            </div>
            {/* Chip filters */}
            <div className="flex flex-wrap gap-2 pb-4 border-b mb-2">
              {CHIP_OPTIONS.map((opt) => {
                const active = chips.has(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleChip(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {Sidebar}
          </aside>

          {/* Results */}
          <section>
            {/* Top controls */}
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b">
              <div className="flex items-center gap-3">
                {/* Mobile filter trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Sort & Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] overflow-y-auto">
                    <div className="pt-6 space-y-4">
                      <div className="flex flex-wrap gap-2 pb-4 border-b">
                        {CHIP_OPTIONS.map((opt) => {
                          const active = chips.has(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => toggleChip(opt.value)}
                              className={`text-xs px-3 py-1.5 rounded-full border ${
                                active
                                  ? "bg-foreground text-background border-foreground"
                                  : "bg-background border-border"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      {Sidebar}
                    </div>
                  </SheetContent>
                </Sheet>
                <span className="text-sm text-muted-foreground">
                  {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
                </span>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filter pills */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {[...chips].map((c) => (
                  <Pill key={`c-${c}`} label={CHIP_OPTIONS.find((o) => o.value === c)?.label ?? c} onRemove={() => toggleChip(c)} />
                ))}
                {[...sizes].map((v) => (
                  <Pill key={`s-${v}`} label={`Size: ${v}`} onRemove={() => toggleSet(setSizes, v)} />
                ))}
                {[...brands].map((v) => (
                  <Pill key={`b-${v}`} label={v} onRemove={() => toggleSet(setBrands, v)} />
                ))}
                {[...colors].map((v) => (
                  <Pill key={`co-${v}`} label={v} onRemove={() => toggleSet(setColors, v)} />
                ))}
                {[...conditions].map((v) => (
                  <Pill key={`cd-${v}`} label={v} onRemove={() => toggleSet(setConditions, v)} />
                ))}
                {[...locations].map((v) => (
                  <Pill key={`l-${v}`} label={v} onRemove={() => toggleSet(setLocations, v)} />
                ))}
                {(priceMin || priceMax) && (
                  <Pill
                    label={`$${priceMin || "0"} – $${priceMax || "∞"}`}
                    onRemove={() => {
                      setPriceMin("");
                      setPriceMax("");
                    }}
                  />
                )}
              </div>
            )}

            {!authed && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Lock className="w-3 h-3" />
                <span>
                  Browse freely.{" "}
                  <Link to="/auth" className="underline hover:text-foreground">
                    Sign in
                  </Link>{" "}
                  to borrow, buy, or message owners.
                </span>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[3/4] bg-muted animate-pulse rounded-sm" />
                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <p>No items match your filters.</p>
                <button onClick={clearAll} className="mt-3 text-sm underline text-foreground">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                {filtered.slice(0, PAGE_SIZE).map((it) => (
                  <ProductCard key={it.id} item={it} onOpen={() => navigate(`/profile/${it.user_id}`)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FacetGroup({
  id,
  label,
  options,
  selected,
  onToggle,
}: {
  id: string;
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <AccordionItem value={id} className="border-b">
      <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
        {label}
        {selected.size > 0 && (
          <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
            {selected.size}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pb-1">No options yet</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {options.map((opt) => {
              const checked = selected.has(opt);
              return (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-${opt}`}
                    checked={checked}
                    onCheckedChange={() => onToggle(opt)}
                  />
                  <Label
                    htmlFor={`${id}-${opt}`}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-secondary text-foreground hover:bg-secondary/80"
    >
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}

function ProductCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const cover = item.image_urls?.[0];
  const isFree = !item.sharing_price || Number(item.sharing_price) === 0;
  const orig = item.original_price ? Number(item.original_price) : null;
  const price = item.sharing_price ? Number(item.sharing_price) : null;
  const locText = [item.owner_city, item.owner_state].filter(Boolean).join(", ");

  return (
    <Link to={`/profile/${item.user_id}`} onClick={onOpen} className="group block">
      <div className="aspect-[3/4] bg-secondary/40 overflow-hidden rounded-sm mb-3">
        {cover ? (
          <img
            src={cover}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:underline">
          {item.brand ? `${item.brand} ` : ""}
          {item.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {item.size ? `Size: ${item.size}` : null}
          {item.size && locText ? " · " : null}
          {locText || (!item.size && "Location not set")}
        </p>
        <div className="flex items-baseline justify-between pt-1.5 text-sm">
          <div className="flex items-baseline gap-2">
            {orig != null && (
              <>
                <span className="text-muted-foreground text-xs">Orig. Retail</span>
                <span className={price != null && orig > price ? "line-through text-muted-foreground text-xs" : "text-xs"}>
                  ${orig.toFixed(0)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-muted-foreground text-xs">{isFree ? "Borrow" : "Rent"}</span>
            <span className="font-semibold">{isFree ? "Free" : `$${price!.toFixed(0)}`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
