import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  image_urls: string[] | null;
  brand: string | null;
  original_price: number | null;
}

interface CategoryGalleryCardProps {
  categoryName: string;
  categoryIcon: string | null;
  items: InventoryItem[];
  totalItems: number;
  onViewAll: () => void;
}

export function CategoryGalleryCard({
  categoryName,
  categoryIcon,
  items,
  totalItems,
  onViewAll,
}: CategoryGalleryCardProps) {
  const previewItems = items.slice(0, 4);
  const hasMore = totalItems > 4;

  const totalValue = items.reduce((sum, item) => sum + (item.original_price || 0), 0);

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewAll}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {categoryIcon ? (
              <span className="text-2xl">{categoryIcon}</span>
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">{categoryName}</CardTitle>
          </div>
          <Badge variant="secondary" className="ml-2">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        {totalValue > 0 && (
          <p className="text-sm text-muted-foreground">
            Total value: {formatCurrency(totalValue)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {previewItems.map((item, index) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              {item.image_urls && item.image_urls.length > 0 && item.image_urls[0] ? (
                item.image_urls[0].startsWith("emoji:") ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-6xl">{item.image_urls[0].slice(6)}</span>
                  </div>
                ) : (
                  <img
                    src={item.image_urls[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <Package className="w-8 h-8 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.name}
                  </p>
                </div>
              )}
              {index === 3 && hasMore && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    +{totalItems - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full group-hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onViewAll();
          }}
        >
          View All Items
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
