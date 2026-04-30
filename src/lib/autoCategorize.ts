import { supabase } from "@/integrations/supabase/client";

/**
 * Calls the suggest-category edge function and updates the given inventory items
 * with the AI-picked category_id. Runs in the background — fires-and-forgets,
 * never blocks the user's "item added" success toast.
 *
 * Returns the count of items that were successfully categorized.
 */
export async function autoCategorizeItems(
  items: { id: string; name: string }[]
): Promise<number> {
  let success = 0;
  for (const item of items) {
    try {
      const { data, error } = await supabase.functions.invoke("suggest-category", {
        body: { itemName: item.name },
      });
      if (error || !data?.categoryId) continue;

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ category_id: data.categoryId })
        .eq("id", item.id);

      if (!updateError) success++;
    } catch (err) {
      console.warn("Auto-categorize failed for", item.name, err);
    }
  }
  return success;
}

/**
 * Convenience: insert one or more items and then auto-categorize them in the
 * background. Returns the inserted rows immediately; categorization continues
 * after this resolves.
 */
export async function insertAndAutoCategorize(
  rows: Array<{ name: string; user_id: string } & Record<string, any>>
): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(rows as any)
    .select("id, name");

  if (!error && data && data.length > 0) {
    // Fire-and-forget: don't await
    autoCategorizeItems(data).catch((err) =>
      console.warn("Background categorization failed:", err)
    );
  }

  return { data, error };
}
