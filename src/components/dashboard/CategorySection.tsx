import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight, Edit } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ItemDetailDialog from "./ItemDetailDialog";
import EditItemDialog from "./EditItemDialog";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  original_price: number | null;
  purchase_date: string | null;
  image_urls: string[] | null;
  condition: string | null;
  usage_frequency: string | null;
  is_available_for_sharing: boolean;
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

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface CategorySectionProps {
  category: Category;
  items: InventoryItem[];
  subcategories?: Array<{ category: Category; items: InventoryItem[] }>;
  onDelete: (id: string) => void;
}

const CategorySection = ({ category, items, subcategories, onDelete }: CategorySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleItemUpdated = () => {
    setIsDetailOpen(false);
    setIsEditOpen(false);
  };

  const handleEdit = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleRowClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const totalItems = items.length + (subcategories?.reduce((sum, sub) => sum + sub.items.length, 0) || 0);

  if (totalItems === 0) return null;

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        <h3 className="text-xl font-semibold flex items-center gap-2">
          {category.icon && <span className="text-2xl">{category.icon}</span>}
          {category.name}
          <Badge variant="secondary" className="ml-2">{totalItems}</Badge>
        </h3>
      </div>

      {isExpanded && (
        <div className="ml-7 space-y-6">
          {items.length > 0 && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Item</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {item.name}
                            {item.is_available_for_sharing && (
                              <Badge variant="secondary" className="text-xs">Sharing</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.brand && (
                          <span className="text-sm">{item.brand}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.color && (
                          <span className="text-sm">{item.color}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.original_price ? formatCurrency(item.original_price) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.condition && (
                          <Badge variant="outline" className="capitalize text-xs">
                            {item.condition}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEdit(item, e)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this item from your inventory.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {subcategories?.map(({ category: subcat, items: subitems }) => (
            subitems.length > 0 && (
              <div key={subcat.id} className="space-y-3">
                <h4 className="text-lg font-medium flex items-center gap-2">
                  {subcat.icon && <span className="text-xl">{subcat.icon}</span>}
                  {subcat.name}
                  <Badge variant="outline">{subitems.length}</Badge>
                </h4>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Item</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subitems.map((item) => (
                        <TableRow 
                          key={item.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(item)}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2">
                                {item.name}
                                {item.is_available_for_sharing && (
                                  <Badge variant="secondary" className="text-xs">Sharing</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.brand && (
                              <span className="text-sm">{item.brand}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.color && (
                              <span className="text-sm">{item.color}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.original_price ? formatCurrency(item.original_price) : '-'}
                          </TableCell>
                          <TableCell>
                            {item.condition && (
                              <Badge variant="outline" className="capitalize text-xs">
                                {item.condition}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEdit(item, e)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this item from your inventory.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )
          ))}
        </div>
      )}
      
      <ItemDetailDialog
        item={selectedItem}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onItemUpdated={handleItemUpdated}
      />
      
      <EditItemDialog
        item={selectedItem}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onItemUpdated={handleItemUpdated}
      />
    </div>
  );
};

export default CategorySection;
