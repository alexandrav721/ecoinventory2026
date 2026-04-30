import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Home, ChefHat, Bed, Bath, Sofa, Car, TreeDeciduous,
  Warehouse, Building, ChevronDown, ChevronRight, ImageIcon, MapPin
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  image_urls: string[] | null;
  location: string | null;
  original_price: number | null;
  quantity: number;
}

interface InventoryLocationViewProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
}

const locationIcons: Record<string, typeof Home> = {
  'kitchen': ChefHat,
  'bedroom': Bed,
  'bathroom': Bath,
  'living room': Sofa,
  'garage': Car,
  'garden': TreeDeciduous,
  'storage': Warehouse,
  'office': Building,
};

const getLocationIcon = (location: string) => {
  const lowerLocation = location.toLowerCase();
  for (const [key, Icon] of Object.entries(locationIcons)) {
    if (lowerLocation.includes(key)) {
      return Icon;
    }
  }
  return Home;
};

const InventoryLocationView = ({ items, onItemClick }: InventoryLocationViewProps) => {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set(['all']));

  // Group items by location
  const groupedByLocation = items.reduce((acc, item) => {
    const location = item.location || 'Unassigned';
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Sort locations alphabetically, with 'Unassigned' last
  const sortedLocations = Object.keys(groupedByLocation).sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    return a.localeCompare(b);
  });

  const toggleLocation = (location: string) => {
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(location)) {
        next.delete(location);
      } else {
        next.add(location);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLocations(new Set(sortedLocations));
  };

  const collapseAll = () => {
    setExpandedLocations(new Set());
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      {/* Location Groups */}
      <div className="space-y-3">
        {sortedLocations.map((location) => {
          const locationItems = groupedByLocation[location];
          const isExpanded = expandedLocations.has(location);
          const LocationIcon = getLocationIcon(location);
          const totalValue = locationItems.reduce((sum, item) => 
            sum + ((item.original_price || 0) * item.quantity), 0
          );
          const totalItems = locationItems.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <Collapsible
              key={location}
              open={isExpanded}
              onOpenChange={() => toggleLocation(location)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        location === 'Unassigned' 
                          ? 'bg-muted' 
                          : 'bg-primary/10'
                      }`}>
                        <LocationIcon className={`w-5 h-5 ${
                          location === 'Unassigned' 
                            ? 'text-muted-foreground' 
                            : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{location}</h3>
                        <p className="text-sm text-muted-foreground">
                          {totalItems} item{totalItems !== 1 ? 's' : ''} • {formatCurrency(totalValue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {locationItems.map((item) => {
                        const hasImage = item.image_urls && item.image_urls.length > 0 && item.image_urls[0];
                        const isEmoji = hasImage && item.image_urls![0].startsWith("emoji:");
                        
                        return (
                          <div
                            key={item.id}
                            className="group cursor-pointer"
                            onClick={() => onItemClick(item)}
                          >
                            <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-2 relative group-hover:ring-2 ring-primary transition-all">
                              {hasImage ? (
                                isEmoji ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-3xl">{item.image_urls![0].slice(6)}</span>
                                  </div>
                                ) : (
                                  <img
                                    src={item.image_urls![0]}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                              )}
                              {item.quantity > 1 && (
                                <Badge className="absolute top-1 left-1 text-xs h-5 px-1.5 bg-background/90 text-foreground">
                                  ×{item.quantity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {item.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryLocationView;
