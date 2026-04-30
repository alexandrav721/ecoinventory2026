import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

interface SuggestedLocation {
  id: string;
  location_name: string;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<SuggestedLocation[]>([]);
  const [customValue, setCustomValue] = useState(value);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    setCustomValue(value);
  }, [value]);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("suggested_locations")
      .select("id, location_name")
      .order("usage_count", { ascending: false })
      .limit(50);

    setLocations(data || []);
  };

  const handleSelect = async (locationName: string) => {
    onChange(locationName);
    setCustomValue(locationName);
    setOpen(false);

    // Increment usage count
    const location = locations.find((l) => l.location_name === locationName);
    if (location) {
      await supabase
        .from("suggested_locations")
        .update({ usage_count: (await supabase.from("suggested_locations").select("usage_count").eq("id", location.id).single()).data?.usage_count || 0 + 1 })
        .eq("id", location.id);
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
          {customValue || "Select or type a location..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search or type location..."
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
            <CommandGroup heading="Suggested Locations">
              {locations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.location_name}
                  onSelect={() => handleSelect(location.location_name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      customValue === location.location_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {location.location_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}