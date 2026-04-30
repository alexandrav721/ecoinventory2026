import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ImageIcon, Pencil, MoreHorizontal, AlertTriangle, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface InventoryItem {
  id: string;
  name: string;
  image_urls: string[] | null;
  category_name?: string;
  brand: string | null;
  original_price: number | null;
  quantity: number;
  location: string | null;
  condition: string | null;
}

interface ExcessInfo {
  level: 'slightly_over' | 'excessive';
  quantity: number;
  typical: number;
  max: number;
  itemName: string;
}

interface InventoryGalleryViewProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onEditClick: (itemId: string) => void;
  onDeleteClick: (itemId: string) => void;
  onDuplicateClick: (item: InventoryItem) => void;
  getExcessForItem?: (itemId: string) => ExcessInfo | null;
}

const InventoryGalleryView = ({
  items,
  onItemClick,
  onEditClick,
  onDeleteClick,
  onDuplicateClick,
  getExcessForItem,
}: InventoryGalleryViewProps) => {
  const navigate = useNavigate();

  if (items.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => {
          const excessInfo = getExcessForItem?.(item.id);
          const hasImage = item.image_urls && item.image_urls.length > 0 && item.image_urls[0];
          const isEmoji = hasImage && item.image_urls![0].startsWith("emoji:");
          
          return (
            <Card
              key={item.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              onClick={() => onItemClick(item)}
            >
              {/* Image */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {hasImage ? (
                  isEmoji ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-5xl">{item.image_urls![0].slice(6)}</span>
                    </div>
                  ) : (
                    <img
                      src={item.image_urls![0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                
                {/* Quantity badge */}
                {item.quantity > 1 && (
                  <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs">
                    ×{item.quantity}
                  </Badge>
                )}
                
                {/* Excess warning */}
                {excessInfo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        className={`absolute top-2 right-2 gap-1 ${
                          excessInfo.level === 'excessive' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {excessInfo.level === 'excessive' ? 'Excess' : 'Over'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You have {excessInfo.quantity}. Most need {excessInfo.typical}-{excessInfo.max}.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(item.id);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onDuplicateClick(item)}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteClick(item.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Info */}
              <div className="p-3 space-y-1">
                <h3 className="font-medium text-sm truncate">{item.name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{item.category_name || item.brand || 'Uncategorized'}</span>
                  {item.original_price && (
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.original_price)}
                    </span>
                  )}
                </div>
                {item.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default InventoryGalleryView;
