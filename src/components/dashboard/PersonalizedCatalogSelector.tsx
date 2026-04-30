import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Package, Search, Sparkles, ShoppingCart } from "lucide-react";

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  image_urls: string[] | null;
  typical_price: number | null;
  size: string | null;
  color: string | null;
  dimensions: string | null;
  categories?: { name: string };
}

interface PersonalizedCatalogSelectorProps {
  onAddItems: (items: CatalogProduct[]) => void;
}

export function PersonalizedCatalogSelector({ onAddItems }: PersonalizedCatalogSelectorProps) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-catalog-items');

      if (error) {
        console.error('Recommendation error:', error);
        // Fallback to regular catalog
        await fetchAllProducts();
        return;
      }

      if (data?.recommendations) {
        setProducts(data.recommendations);
        setIsPersonalized(data.personalized === true);
        if (data.personalized) {
          toast.success("Catalog personalized for you!");
        }
      } else {
        await fetchAllProducts();
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      await fetchAllProducts();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_catalog')
        .select(`
          id,
          name,
          description,
          category_id,
          image_urls,
          typical_price,
          size,
          color,
          dimensions,
          categories (name)
        `)
        .limit(100)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load catalog');
    }
  };

  const toggleSelection = (productId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleAddSelected = () => {
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one item");
      return;
    }
    onAddItems(selectedProducts);
    setSelectedIds(new Set());
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isPersonalized && <Sparkles className="h-5 w-5 text-primary" />}
            EcoInventory Catalog
          </h3>
          <p className="text-sm text-muted-foreground">
            {isPersonalized 
              ? "Personalized recommendations based on your profile" 
              : "Select items to add to your inventory"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedIds.size} selected
          </Badge>
          <Button 
            onClick={handleAddSelected}
            disabled={selectedIds.size === 0}
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add Selected
          </Button>
        </div>
      </div>

      {/* Search & Select All */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={toggleAll}
        >
          {selectedIds.size === filteredProducts.length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {/* Products Grid */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.has(product.id);
            
            return (
              <Card
                key={product.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleSelection(product.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(product.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex-1 min-w-0">
                    {/* Image */}
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-md mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-muted rounded-md mb-2 flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Details */}
                    <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                    
                    {product.categories && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {product.categories.name}
                      </Badge>
                    )}
                    
                    {product.typical_price && (
                      <p className="text-sm font-medium mt-2">
                        ${product.typical_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <Button onClick={handleAddSelected}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add {selectedIds.size} Items to Inventory
          </Button>
        </div>
      )}
    </div>
  );
}
