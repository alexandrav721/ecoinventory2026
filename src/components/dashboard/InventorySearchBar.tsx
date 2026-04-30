import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QuickFilter {
  label: string;
  value: string;
  type: 'category' | 'location' | 'condition' | 'recent';
}

interface InventorySearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: QuickFilter[];
  onFilterToggle: (filter: QuickFilter) => void;
  onClearFilters: () => void;
  suggestedFilters: QuickFilter[];
}

const InventorySearchBar = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterToggle,
  onClearFilters,
  suggestedFilters,
}: InventorySearchBarProps) => {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search your stuff..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-11 text-base bg-muted/30 border-muted-foreground/20 focus:bg-background"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => onSearchChange("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {activeFilters.length > 0 && (
          <>
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.type}-${filter.value}`}
                variant="default"
                className="cursor-pointer gap-1 pr-1"
                onClick={() => onFilterToggle(filter)}
              >
                {filter.label}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={onClearFilters}
            >
              Clear all
            </Button>
          </>
        )}
        
        {activeFilters.length === 0 && suggestedFilters.slice(0, 6).map((filter) => (
          <Badge
            key={`${filter.type}-${filter.value}`}
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
            onClick={() => onFilterToggle(filter)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default InventorySearchBar;
