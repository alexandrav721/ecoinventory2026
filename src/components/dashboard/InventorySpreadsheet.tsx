import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { QuirkyLoader } from "@/components/QuirkyLoader";
import { EmptyState } from "@/components/EmptyState";
import { useDemo } from "@/contexts/DemoContext";
import { categoryToGroup, TOP_LEVEL_GROUPS, TopLevelGroup } from "@/lib/topLevelGroups";

interface Row {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  group: TopLevelGroup;
  original_price: number | null;
  quantity: number;
  location: string | null;
  condition: string | null;
  brand: string | null;
}

type SortField = "name" | "original_price" | "location" | "condition" | "brand";
type SortDir = "asc" | "desc";

const InventorySpreadsheet = () => {
  const navigate = useNavigate();
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("original_price");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Collapsed by default — only header rows visible on load
  const [openGroups, setOpenGroups] = useState<Set<TopLevelGroup>>(new Set());

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        const cats = demoCategories.map((c: any) => ({ id: c.id, name: c.name }));
        const catMap = new Map(cats.map((c) => [c.id, c.name]));
        setRows(
          demoItems.map((it: any) => {
            const catName = catMap.get(it.category_id) ?? null;
            return {
              id: it.id,
              name: it.name,
              category_id: it.category_id,
              category_name: catName,
              group: categoryToGroup(catName),
              original_price: it.original_price ?? null,
              quantity: it.quantity ?? 1,
              location: it.location ?? null,
              condition: it.condition ?? null,
              brand: it.brand ?? null,
            };
          })
        );
        return;
      }

      const [{ data: items }, { data: cats }] = await Promise.all([
        supabase
          .from("inventory_items")
          .select(
            "id, name, category_id, original_price, quantity, location, condition, brand, is_donated, is_sold, is_eliminated"
          )
          .eq("is_donated", false)
          .eq("is_sold", false)
          .eq("is_eliminated", false),
        supabase.from("categories").select("id, name"),
      ]);

      const catMap = new Map((cats ?? []).map((c: any) => [c.id, c.name]));

      setRows(
        (items ?? []).map((it: any) => {
          const catName = it.category_id ? catMap.get(it.category_id) ?? null : null;
          return {
            id: it.id,
            name: it.name,
            category_id: it.category_id,
            category_name: catName,
            group: categoryToGroup(catName),
            original_price: it.original_price ?? null,
            quantity: it.quantity ?? 1,
            location: it.location ?? null,
            condition: it.condition ?? null,
            brand: it.brand ?? null,
          };
        })
      );
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load inventory");
    } finally {
      setLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) =>
        [r.name, r.brand, r.category_name, r.location]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [rows, search, sortField, sortDir]);

  const grouped = useMemo(() => {
    const map = new Map<TopLevelGroup, Row[]>();
    for (const g of TOP_LEVEL_GROUPS) map.set(g, []);
    for (const r of filteredSorted) {
      map.get(r.group)!.push(r);
    }
    return TOP_LEVEL_GROUPS
      .map((g) => {
        const items = map.get(g)!;
        const value = items.reduce(
          (s, it) => s + (it.original_price ?? 0) * (it.quantity ?? 1),
          0
        );
        return { group: g, items, value };
      })
      .filter((g) => g.items.length > 0);
  }, [filteredSorted]);

  const totalValue = useMemo(
    () => grouped.reduce((s, g) => s + g.value, 0),
    [grouped]
  );

  // When searching, auto-expand all groups so results aren't hidden
  const isSearching = search.trim().length > 0;

  const toggleGroup = (g: TopLevelGroup) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const expandAll = () =>
    setOpenGroups(new Set(grouped.map((g) => g.group)));
  const collapseAll = () => setOpenGroups(new Set());

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "original_price" ? "desc" : "asc");
    }
  };

  const handleDelete = async (rowId: string) => {
    if (isDemoMode) {
      toast.info("Demo mode — changes don't save");
      return;
    }
    if (!confirm("Delete this item?")) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    const { error } = await supabase.from("inventory_items").delete().eq("id", rowId);
    if (error) {
      toast.error("Couldn't delete");
      loadData();
    } else {
      toast.success("Item deleted");
    }
  };

  const SortHeader = ({
    field,
    children,
    align = "left",
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: "left" | "right";
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${
        align === "right" ? "text-right" : ""
      } ${className}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field &&
          (sortDir === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          ))}
      </span>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <QuirkyLoader size="md" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No items yet"
        description="Add your first item or take the quiz to get started."
        action={{
          label: "Add an item",
          onClick: () => navigate("/dashboard/add-item"),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items, brands, locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button
            onClick={expandAll}
            className="hover:text-foreground transition-colors"
          >
            Expand all
          </button>
          <span>·</span>
          <button
            onClick={collapseAll}
            className="hover:text-foreground transition-colors"
          >
            Collapse all
          </button>
          <span>·</span>
          <span>
            <strong className="text-foreground">{filteredSorted.length}</strong>{" "}
            items
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{formatCurrency(totalValue)}</strong>
          </span>
        </div>
      </div>

      {/* Table with collapsible groups */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <SortHeader field="name">Item</SortHeader>
              <SortHeader field="original_price" align="right">
                Value
              </SortHeader>
              <SortHeader field="location">Location</SortHeader>
              <SortHeader field="brand">Brand</SortHeader>
              <SortHeader field="condition">Condition</SortHeader>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map(({ group, items, value }) => {
              const open = isSearching || openGroups.has(group);
              return (
                <Fragment key={`group-${group}`}>
                  <TableRow
                    key={`group-${group}`}
                    className="bg-muted/20 hover:bg-muted/40 cursor-pointer border-t"
                    onClick={() => toggleGroup(group)}
                  >
                    <TableCell colSpan={2} className="font-medium">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            open ? "rotate-90" : ""
                          }`}
                        />
                        <span>{group}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {items.length} item{items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      colSpan={5}
                      className="text-right font-mono text-sm text-muted-foreground"
                    >
                      {formatCurrency(value)}
                    </TableCell>
                  </TableRow>
                  {open &&
                    items.map((r) => (
                      <TableRow key={r.id} className="group">
                        <TableCell className="font-medium pl-8">
                          <div className="flex flex-col leading-tight">
                            <span>{r.name}</span>
                            {r.category_name && (
                              <span className="text-xs text-muted-foreground">
                                {r.category_name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {r.original_price != null ? (
                            formatCurrency(r.original_price * (r.quantity ?? 1))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {r.location ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {r.brand ?? "—"}
                        </TableCell>
                        <TableCell>
                          {r.condition ? (
                            <Badge variant="outline" className="text-xs capitalize">
                              {r.condition}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {r.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() =>
                                navigate(`/dashboard/edit-item/${r.id}`)
                              }
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventorySpreadsheet;
