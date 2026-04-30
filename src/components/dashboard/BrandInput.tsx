import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandInputProps {
  value: string;
  onChange: (value: string) => void;
  categoryId?: string;
}

interface SuggestedBrand {
  id: string;
  brand_name: string;
  category_id: string | null;
}

export default function BrandInput({ value, onChange, categoryId }: BrandInputProps) {
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<SuggestedBrand[]>([]);
  const [customValue, setCustomValue] = useState(value);

  useEffect(() => {
    fetchBrands();
  }, [categoryId]);

  useEffect(() => {
    setCustomValue(value);
  }, [value]);

  const fetchBrands = async () => {
    let query = supabase
      .from("suggested_brands")
      .select("id, brand_name, category_id")
      .order("usage_count", { ascending: false })
      .limit(50);

    // Show brands for this category + generic brands (no category)
    if (categoryId) {
      query = query.or(`category_id.eq.${categoryId},category_id.is.null`);
    } else {
      query = query.is("category_id", null);
    }

    const { data } = await query;
    setBrands(data || []);
  };

  const handleSelect = async (brandName: string) => {
    onChange(brandName);
    setCustomValue(brandName);
    setOpen(false);

    // Increment usage count
    const brand = brands.find((b) => b.brand_name === brandName);
    if (brand) {
      const { data: currentData } = await supabase
        .from("suggested_brands")
        .select("usage_count")
        .eq("id", brand.id)
        .single();

      await supabase
        .from("suggested_brands")
        .update({ usage_count: (currentData?.usage_count || 0) + 1 })
        .eq("id", brand.id);
    }
  };

  const handleCustomInput = (inputValue: string) => {
    setCustomValue(inputValue);
    onChange(inputValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {customValue || "Select or type a brand..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search or type brand..."
            value={customValue}
            onValueChange={handleCustomInput}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-sm">
                <p className="text-muted-foreground">No suggestions found.</p>
                <p className="text-xs mt-1">Press Enter to use "{customValue}"</p>
              </div>
            </CommandEmpty>
            <CommandGroup heading="Suggested Brands">
              {brands.map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={brand.brand_name}
                  onSelect={() => handleSelect(brand.brand_name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      customValue === brand.brand_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {brand.brand_name}
                  {brand.category_id && (
                    <span className="ml-2 text-xs text-muted-foreground">(category-specific)</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}