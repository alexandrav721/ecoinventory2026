import { Package, DollarSign, FolderOpen, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InventorySummaryBarProps {
  totalItems: number;
  totalValue: number;
  categoryCount: number;
  locationCount: number;
}

const InventorySummaryBar = ({ 
  totalItems, 
  totalValue, 
  categoryCount, 
  locationCount 
}: InventorySummaryBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6 py-3 px-4 bg-muted/30 rounded-xl border">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Package className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{totalItems}</p>
          <p className="text-xs text-muted-foreground">items</p>
        </div>
      </div>
      
      <div className="w-px h-8 bg-border hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/10">
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-muted-foreground">value</p>
        </div>
      </div>
      
      <div className="w-px h-8 bg-border hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <FolderOpen className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{categoryCount}</p>
          <p className="text-xs text-muted-foreground">categories</p>
        </div>
      </div>
      
      <div className="w-px h-8 bg-border hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <MapPin className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{locationCount}</p>
          <p className="text-xs text-muted-foreground">locations</p>
        </div>
      </div>
    </div>
  );
};

export default InventorySummaryBar;
