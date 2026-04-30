import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import { useDemo } from "@/contexts/DemoContext";

export const CsvExport = () => {
  const { isDemoMode, demoItems, demoCategories } = useDemo();

  const handleExport = async () => {
    try {
      let rows: any[] = [];
      let categoryNameById = new Map<string, string>();

      if (isDemoMode) {
        categoryNameById = new Map(demoCategories.map((c: any) => [c.id, c.name]));
        rows = demoItems;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to export.");
          return;
        }

        const [{ data: items, error: itemsErr }, { data: cats }] = await Promise.all([
          supabase
            .from("inventory_items")
            .select(
              "name, brand, description, category_id, quantity, original_price, purchase_date, condition, color, size, dimensions, usage_frequency, sharing_level, sharing_price, is_available_for_sharing, is_donated, donated_date, donated_price, is_sold, sold_date, sold_price, is_eliminated, eliminated_date, tags, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("categories").select("id, name"),
        ]);

        if (itemsErr) throw itemsErr;
        categoryNameById = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
        rows = items ?? [];
      }

      if (!rows.length) {
        toast.info("Nothing to export yet — add some items first.");
        return;
      }

      const exportRows = rows.map((it: any) => ({
        name: it.name ?? "",
        brand: it.brand ?? "",
        description: it.description ?? "",
        category: it.category_id ? categoryNameById.get(it.category_id) ?? "" : "",
        quantity: it.quantity ?? 1,
        original_price: it.original_price ?? "",
        purchase_date: it.purchase_date ?? "",
        condition: it.condition ?? "",
        color: it.color ?? "",
        size: it.size ?? "",
        dimensions: it.dimensions ?? "",
        usage_frequency: it.usage_frequency ?? "",
        sharing_level: it.sharing_level ?? "",
        sharing_price: it.sharing_price ?? "",
        is_available_for_sharing: it.is_available_for_sharing ?? false,
        is_donated: it.is_donated ?? false,
        donated_date: it.donated_date ?? "",
        donated_price: it.donated_price ?? "",
        is_sold: it.is_sold ?? false,
        sold_date: it.sold_date ?? "",
        sold_price: it.sold_price ?? "",
        is_eliminated: it.is_eliminated ?? false,
        eliminated_date: it.eliminated_date ?? "",
        tags: Array.isArray(it.tags) ? it.tags.join("|") : "",
        created_at: it.created_at ?? "",
      }));

      const csv = Papa.unparse(exportRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `inventory-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${rows.length} item${rows.length === 1 ? "" : "s"} to CSV`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't export your items. Please try again.");
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  );
};

export default CsvExport;
