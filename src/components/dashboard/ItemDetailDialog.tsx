import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Package, Edit, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number | null;
  original_price: number | null;
  purchase_date: string | null;
  condition: string | null;
  usage_frequency: string | null;
  image_urls: string[] | null;
  is_available_for_sharing: boolean | null;
  sharing_level: string | null;
  sharing_price: number | null;
  category_id: string | null;
  brand: string | null;
  color: string | null;
  dimensions: string | null;
  size: string | null;
  is_donated: boolean | null;
  is_sold: boolean | null;
  donated_price: number | null;
  sold_price: number | null;
  donated_date: string | null;
  sold_date: string | null;
  is_eliminated: boolean | null;
  eliminated_date: string | null;
}

interface ItemDetailDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated?: () => void;
}

const ItemDetailDialog = ({ item, open, onOpenChange, onItemUpdated }: ItemDetailDialogProps) => {
  const navigate = useNavigate();
  const [duplicating, setDuplicating] = useState(false);

  if (!item) return null;


  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("inventory_items").insert([
        {
          name: `${item.name} (Copy)`,
          description: item.description,
          brand: item.brand,
          color: item.color,
          dimensions: item.dimensions,
          size: item.size,
          user_id: user.id,
          original_price: item.original_price,
          purchase_date: item.purchase_date,
          image_urls: item.image_urls,
          category_id: item.category_id,
          quantity: item.quantity,
          condition: item.condition,
          usage_frequency: item.usage_frequency,
          is_available_for_sharing: item.is_available_for_sharing,
          sharing_level: item.sharing_level || "private",
          is_donated: false,
          is_sold: false,
        },
      ]);

      if (error) throw error;

      toast.success("Item duplicated successfully!");
      onOpenChange(false);
      onItemUpdated?.();
    } catch (error: any) {
      console.error("Error duplicating item:", error);
      toast.error(error.message || "Failed to duplicate item");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{item.name}</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {duplicating ? "Duplicating..." : "Duplicate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/edit-item/${item.id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogHeader>
        
        <div className="space-y-6">
          {item.image_urls && item.image_urls.length > 0 && item.image_urls[0] && (
            <div className="w-full h-64 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {item.image_urls[0].startsWith("emoji:") ? (
                <span className="text-9xl">{item.image_urls[0].slice(6)}</span>
              ) : (
                <img
                  src={item.image_urls[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}

          {item.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {item.brand && (
              <div>
                <span className="text-sm font-semibold">Brand:</span>
                <p className="text-sm text-muted-foreground">{item.brand}</p>
              </div>
            )}

            {item.color && (
              <div>
                <span className="text-sm font-semibold">Color:</span>
                <p className="text-sm text-muted-foreground">{item.color}</p>
              </div>
            )}

            {item.dimensions && (
              <div className="col-span-2">
                <span className="text-sm font-semibold">Dimensions:</span>
                <p className="text-sm text-muted-foreground">{item.dimensions}</p>
              </div>
            )}

            {item.size && (
              <div>
                <span className="text-sm font-semibold">Size:</span>
                <p className="text-sm text-muted-foreground">{item.size}</p>
              </div>
            )}

            {item.quantity !== null && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">Quantity:</span> {item.quantity}
                </span>
              </div>
            )}

            {item.original_price !== null && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">Price:</span> {formatCurrency(item.original_price)}
                </span>
              </div>
            )}

            {item.purchase_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">Purchased:</span>{" "}
                  {new Date(item.purchase_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {item.condition && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {item.condition}
                </Badge>
              </div>
            )}

            {item.usage_frequency && (
              <div>
                <span className="text-sm font-semibold">Usage:</span>
                <p className="text-sm text-muted-foreground capitalize">
                  {item.usage_frequency === 'never' && 'Never Used'}
                  {item.usage_frequency === 'daily' && 'Daily Use'}
                  {item.usage_frequency === 'frequent' && 'Frequently (Weekly)'}
                  {item.usage_frequency === 'occasional' && 'Occasionally (Monthly)'}
                  {item.usage_frequency === 'rare' && 'Rarely Used'}
                  {item.usage_frequency === 'seasonal' && 'Seasonal Use'}
                </p>
              </div>
            )}
          </div>

          {item.is_available_for_sharing && (
            <Badge className="w-fit">Available for Sharing</Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  </>
);
};

export default ItemDetailDialog;
