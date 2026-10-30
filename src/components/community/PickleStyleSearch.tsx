/**
 * The community / marketplace browse grid.
 *
 * THIS FILE WAS LEAKING FRIENDS-ONLY ITEMS. It selected eleven columns,
 * none of them `sharing_level`, and filtered only on
 * `is_available_for_sharing = true` — which both add flows set to true for
 * "Friends only" exactly as they do for "Public". /community and
 * /marketplace have no auth guard, so every friends-only item in the
 * database was on a public web page, under a heading inviting anonymous
 * visitors to browse freely. The word `sharing_level` did not appear
 * anywhere in this file.
 *
 * It now routes every row through src/lib/itemVisibility.ts, the app's own
 * rule, ported. Three other things followed from using the real rule:
 *
 *   • FREE ITEMS COME BACK. `.not("is_donated", "is", true)` was excluding
 *     them. In this schema `is_donated` means "offered free to anyone",
 *     which is one of the three ways an item IS offered — the app counts it
 *     as such and never filters it out of browse. The completed-giveaway
 *     signal is `donated_date`. So the website was hiding precisely the
 *     listings people are most likely to want.
 *
 *   • PHOTOLESS ITEMS GO. Loop's rule is that a thing is not visible until
 *     it has a photo; the grid was rendering grey "No photo" tiles.
 *
 *   • NEVER-OFFERED ITEMS GO. Something catalogued but not listed to
 *     borrow, sell or give is not for anyone — the grid was advertising
 *     those as "Free to borrow".
 *
 * And the grid no longer shows you your own things, which the app's browse
 * surfaces never do.
 *
 * WHY IT WAITS FOR `ready`. The friend and block sets have no database
 * backstop (see useVisibilityContext), so rendering before they arrive
 * would show a stranger a friend's item for one frame and keep showing a
 * blocked person's items if the query failed. Nothing renders until the
 * sets are known.
 */
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
import { isItemVisible } from "@/lib/itemVisibility";
import { asRentWindow, formatRentPrice } from "@/lib/rentWindow";
import { displayText } from "@/lib/displayText";
import { ADMIN_HIDDEN_COLUMN_PRESENT } from "@/lib/schemaFlags";
import { useVisibilityContext } from "@/hooks/useVisibilityContext";

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
  /* Read by isItemVisible. Selecting them is not optional: a missing
     sharing_level makes every row look public. */
  sharing_level: string | null;
  is_for_sale: boolean | null;
  is_for_borrow: boolean | null;
  is_donated: boolean | null;
  rent_price: number | null;
  rent_window: string | null;
  owner_city: string | null;
  owner_state: string | null;
};

type Chip = "today";
type Offer = "all" | "borrow" | "buy";
type Audience = "public" | "friends" | "all";

const CHIP_OPTIONS: { value: Chip; label: string }[] = [
  { value: "today", label: "Get it today" },
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
  /* One source for "who are my friends" and "who have I blocked", shared
     with the visibility rule below. */
  const vis = useVisibilityContext(currentUserId ?? undefined);
  const friendIds = vis.friendSet;
  const [audience, setAudience] = useState<Audience>(
    (searchParams.get("audience") as Audience) || "all"
  );
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

  // Sync ?q= and ?audience= changes (header search) into local state
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    const a = searchParams.get("audience") as Audience | null;
    if (a && (a === "all" || a === "public" || a === "friends")) {
      setAudience(a);
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setCurrentUserId(session?.user?.id ?? null);
      /* The friendships query that used to live here is gone: friend ids
         now come from useVisibilityContext, so the audience filter below
         and the visibility rule read the SAME set. Two copies of "who are
         my friends" on one screen is how the audience toggle and the
         privacy check drift apart. */
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
      /* Over-fetch, because isItemVisible below will drop rows and a grid
         that renders 40 of 200 because the filter ate the rest is still a
         full page. The app's equivalent over-fetches for the same reason. */
      let q = supabase
        .from("inventory_items")
        .select(
          "id, user_id, name, image_urls, condition, brand, color, size, original_price, sharing_price, category_id, sharing_level, is_for_sale, is_for_borrow, is_donated, rent_price, rent_window"
        )
        .eq("is_available_for_sharing", true)
        /* NOT filtering is_donated — see the header. It means "offered
           free", not "already gone". */
        .not("is_sold", "is", true)
        .not("is_eliminated", "is", true)
        ;
      if (ADMIN_HIDDEN_COLUMN_PRESENT) q = q.not("admin_hidden", "is", true);
      /* Browse is other people's things. The app's never shows you yours. */
      if (currentUserId) q = q.neq("user_id", currentUserId);
      const { data: rows } = await q
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
    /* currentUserId is a real dependency: the query excludes your own rows,
       so it has to re-run once the session resolves. Leaving it out is how
       a signed-in visitor kept seeing their own things in browse. */
  }, [currentUserId]);

  // Build dynamic filter facets from data
  const facets = useMemo(() => {
    const sizeSet = new Set<string>();
    const brandSet = new Set<string>();
    const colorSet = new Set<string>();
    const condSet = new Set<string>();
    const locSet = new Set<string>();
    items.forEach((it) => {
      /* Same reason: without this the Size filter offered "null" as a
         size you could tick, and Brand offered "null" as a brand. */
      const size = displayText(it.size);
      const brand = displayText(it.brand);
      const color = displayText(it.color);
      const cond = displayText(it.condition);
      if (size) sizeSet.add(size);
      if (brand) brandSet.add(brand);
      if (color) colorSet.add(color);
      if (cond) condSet.add(cond);
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
    /* THE PRIVACY GATE, FIRST, BEFORE ANY UI FILTER.
       Order matters: putting this after the audience/search filters would
       mean a search could surface a row the rule excludes. Nothing below
       can widen what this allows. */
    let list = vis.ready
      ? items.filter((it) =>
          isItemVisible(it, {
            friendSet: vis.friendSet,
            muteSet: vis.muteSet,
            requirePhoto: true,
            requireOffered: true,
          })
        )
      : [];
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

    /* These filtered on sharing_price, so "Borrow" returned every item
       with no SALE price — paid rentals and free giveaways alike — and
       "Buy" worked only by accident. The flags are what the toggle is
       actually asking about. A giveaway counts as borrowable here for the
       same reason the app counts it as offered: it is a way to get the
       thing without buying it. */
    if (offer === "borrow")
      list = list.filter((it) => !!it.is_for_borrow || !!it.is_donated);
    if (offer === "buy") list = list.filter((it) => !!it.is_for_sale);



    // Quality score: rewards multiple photos + filled-in brand so the best
    // listings rise to the top of the feed.
    const qualityScore = (it: Item) => {
      const photos = it.image_urls?.length ?? 0;
      let score = 0;
      if (photos >= 3) score += 50;
      else if (photos === 2) score += 35;
      else if (photos === 1) score += 15;
      if (it.brand && it.brand.trim().length > 0) score += 30;
      if (it.condition && /^(new|like-?new|excellent)$/i.test(it.condition)) score += 8;
      if (it.original_price && Number(it.original_price) >= 100) score += 5;
      return score;
    };

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
      case "recommended":
      default:
        list = [...list].sort((a, b) => qualityScore(b) - qualityScore(a));
        break;
    }
    return list;
  }, [items, query, sizes, brands, colors, cats, conditions, locations, priceMin, priceMax, chips, sort, audience, offer, friendIds, currentUserId, vis.ready, vis.friendSet, vis.muteSet]);

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
      {/* A plain champagne band.
          This was a four-stop rainbow gradient (blue -> pink -> yellow ->
          green) with two 288px blurred pink and blue blobs floating over
          it. None of those colours is in Loop's palette, and blurred
          colour blobs are the 2021-SaaS look index.css rules out. The band
          now does the one job it had: separate the header from the grid. */}
      <div
        className="relative overflow-hidden border-b"
        style={{ background: "hsl(var(--champagne))" }}
      >
        <div className="container mx-auto px-4 py-5 md:py-6">
          {/* Was a breadcrumb reading "About Loop > Search" above an H1
              reading "Search" — the generic chrome of a search page, on the
              one screen where a visitor who has just read the landing page
              arrives. The landing page's whole argument is that Loop
              publishes its real inventory; this is that inventory, so it
              says so, in the same voice and the same face. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h1
              className="text-[26px] italic leading-none md:text-[32px]"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              The register
            </h1>
            <Link
              to="/"
              className="text-xs hover:opacity-70"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              &larr; celebrateloop.com
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {/* Audience */}
            <div className="inline-flex rounded-full border border-border bg-background/80 backdrop-blur p-1">
              {([
                { value: "all" as Audience, label: "Everyone", Icon: Layers },
                { value: "public" as Audience, label: "Public", Icon: Globe },
                { value: "friends" as Audience, label: `In network${authed && friendIds.size > 0 ? ` · ${friendIds.size}` : ""}`, Icon: Users },
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
            {/* Offer */}
            <div className="inline-flex rounded-full border border-border bg-background/80 backdrop-blur p-1">
              {([
                { value: "all" as Offer, label: "All", Icon: Layers, tone: "" },
                { value: "borrow" as Offer, label: "Borrow", Icon: HandHeart, tone: "hsl(var(--primary))" },
                { value: "buy" as Offer, label: "Buy", Icon: ShoppingBag, tone: "hsl(var(--claret))" },
              ]).map(({ value, label, Icon, tone }) => (
                <button
                  key={value}
                  onClick={() => setOffer(value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    offer === value
                      ? "text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={offer === value ? { background: tone || "hsl(var(--foreground))" } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {audience === "friends" && friendIds.size === 0 && (
        <div className="container mx-auto px-4 pt-3">
          <p className="text-sm text-muted-foreground italic">
            You're not following anyone yet —{" "}
            <Link to="/people" className="underline hover:text-foreground">find people to follow</Link>{" "}
            to see their items here. Switch to <button onClick={() => setAudience("all")} className="underline hover:text-foreground">Everyone</button> to browse all of NYC.
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
                  {/* `degraded` never hides the grid — it only adds a
                      note, because a count with a caveat beats a blank
                      page. "friends" is the one worth saying out loud: it
                      means friends-only things are being left out. */}
                  {loading || !vis.ready
                    ? "Loading…"
                    : `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
                  {!loading &&
                  vis.ready &&
                  (vis.degraded === "friends" || vis.degraded === "both")
                    ? " · couldn't check who you're connected to, so friends-only things are hidden"
                    : ""}
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

            {/* Grid.
                `!vis.ready` counts as loading: until the friend and block
                sets are known there is no safe set of rows to draw. */}
            {loading || !vis.ready ? (
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
  /* FOUR OF THE TWENTY-TWO PHOTOS IN THIS DATABASE ARE HEIC — iPhone's
     format, uploaded straight from the phone and stored with a
     content-type of image/jpeg that lies about it. No browser renders
     HEIC, so those items showed the browser's broken-image glyph: a grey
     box with a torn-page icon, which looks like the site is broken rather
     than like a photo that did not load.

     The real fix is to transcode on upload, in the app. Supabase's own
     image-transformation endpoint would also do it on the fly, but it
     returns FeatureNotEnabled on this plan. Until one of those happens,
     a failed image falls back to the same honest placeholder a photoless
     item gets. */
  const [coverFailed, setCoverFailed] = useState(false);
  /* THE PRICE LABEL used to be derived from sharing_price alone, so every
     item with no SALE price printed "Free to borrow" — paid rentals
     included, which the website could not even set until today. It also
     printed the SALE asking price as the borrow price on items that were
     both.

     Three distinct states now, read from the columns that mean them:
       - a rent rate  -> "$8/day", through the app's own formatter, so the
         phone and the web quote the same string
       - offered to borrow with no rate -> genuinely free
       - for sale -> the sale price
     formatRentPrice returns null for a zero or missing rate rather than
     "$0", which is why this is a fallthrough and not a ternary. */
  const rentLabel = formatRentPrice(
    item.rent_price,
    asRentWindow(item.rent_window),
    { compact: true }
  );
  const isFree = !rentLabel && !!item.is_for_borrow && !item.is_for_sale;
  const isGiveaway = !!item.is_donated && !item.is_for_sale;
  const sellable = !!item.is_for_sale;
  /* The app's nearbyAction ladder (src/hooks/useNearbyItems.ts), so the
     same row gets the same word on both surfaces. */
  const action = item.is_for_sale
    ? item.is_for_borrow || item.is_donated
      ? "Buy + borrow"
      : "Buy"
    : item.is_donated
      ? "Free"
      : item.is_for_borrow
        ? "Borrow"
        : "Nearby";
  const orig = item.original_price ? Number(item.original_price) : null;
  const price = item.sharing_price ? Number(item.sharing_price) : null;
  const locText = [item.owner_city, item.owner_state].filter(Boolean).join(", ");
  const photoCount = item.image_urls?.length ?? 0;
  const discountPct =
    orig && price && orig > price ? Math.round(((orig - price) / orig) * 100) : null;

  return (
    <Link to={`/profile/${item.user_id}`} onClick={onOpen} className="group block">
      {/* A plate, not a card: 2px radius, a hairline, no shadow and no
          zoom. The hover shadow and the scale-105 were the two remaining
          "2014 card metaphor" behaviours index.css rules out, and a
          photograph that grows under the cursor is the one thing that makes
          an honest phone snapshot look like stock. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm mb-3 bg-secondary/40 ring-1 ring-border/60 transition-colors duration-200 group-hover:ring-foreground/25">
        {cover && !coverFailed ? (
          <img
            src={cover}
            alt={item.name}
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-3 text-center text-xs text-muted-foreground">
            {coverFailed ? "Photo won't load" : "No photo"}
          </div>
        )}

        {/* Top-left: Borrow / Buy chip */}
        {/* The BORROW / BUY chip used to be stamped on the photograph in a
            coloured pill with an icon and a shadow. It now sits in type
            under the plate, beside the price, where the difference belongs:
            the words "a day" and "to buy" already carry it. `action` is
            still the app's own ladder from useNearbyItems.nearbyAction —
            the chip once read `isFree ? "Borrow" : "Buy"`, inferred from
            the price rather than from the flags, so a paid rental was
            labelled "Buy". */}




        {/* Bottom-right: photo count */}
        {photoCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-black/60 text-white backdrop-blur">
              {photoCount}
            </span>
          </div>
        )}

        {/* The hover scrim is gone. It was a bg-gradient-to-t black wash
            over the photograph — the only gradient left on the site, on a
            brand whose stylesheet rules them out, darkening the one asset
            these pages have. Nothing is overlaid on a plate. */}
      </div>

      <div className="space-y-1 px-0.5">
        {/* displayText, not a truthiness check: the live database holds
            the literal string "null" in some brands and sizes. It is
            truthy, so it was printing as "NULL" above the item name. */}
        {displayText(item.brand) && (
          <p className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: "hsl(var(--subtle))" }}>
            {displayText(item.brand)}
          </p>
        )}
        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:underline">
          {item.name}
        </h3>
        {action && (
          <p
            className="text-[10px] uppercase tracking-[0.14em] font-semibold"
            style={{ color: "hsl(var(--primary))" }}
          >
            {action}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {displayText(item.size) ? `Size ${displayText(item.size)}` : null}
          {displayText(item.size) && locText ? " · " : null}
          {locText || (!displayText(item.size) && "NYC")}
        </p>
        <div className="flex items-baseline justify-between pt-1.5">
          <div className="flex items-baseline gap-1.5">
            {/* Four states, and NO non-null assertion on the price.
                `price!.toFixed(0)` used to sit in the final branch, which
                was only safe because the old isFree swallowed every
                priceless item. With isFree narrowed to "offered to borrow,
                no rate", a free GIVEAWAY (is_donated, no sale price) fell
                through to it and would have thrown on null. */}
            {rentLabel ? (
              <span className="text-base font-bold" style={{ color: "hsl(var(--primary))" }}>
                {rentLabel}
              </span>
            ) : isFree ? (
              <span className="text-base font-bold" style={{ color: "hsl(var(--primary))" }}>Free to borrow</span>
            ) : isGiveaway ? (
              /* The app's word for is_donated is "Free" (see
                 useNearbyItems.nearbyAction). Not "donated", which on the
                 website still reads as "already gone". */
              <span className="text-base font-bold" style={{ color: "hsl(var(--primary))" }}>Free</span>
            ) : price !== null ? (
              <span className="text-base font-bold" style={{ color: "hsl(var(--claret))" }}>
                ${price.toFixed(0)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
