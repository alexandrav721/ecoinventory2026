import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, HandHeart, ShoppingCart, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import { DEMO_NEARBY_ITEMS } from "@/data/demoData";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DemoNearbyItems() {
  const [searchQuery, setSearchQuery] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("all");
  
  const filterItems = (items: typeof DEMO_NEARBY_ITEMS) => {
    return items.filter(item => {
      const matchesSearch = searchQuery === "" || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDistance = distanceFilter === "all" || 
        item.distance <= parseFloat(distanceFilter);
      
      return matchesSearch && matchesDistance;
    });
  };

  const allFilteredItems = filterItems(DEMO_NEARBY_ITEMS);
  const borrowItems = allFilteredItems.filter(item => item.type === "borrow");
  const purchaseItems = allFilteredItems.filter(item => item.type === "purchase");

  const handleBorrowRequest = (itemName: string, ownerName: string) => {
    toast.success(`Borrow request sent to ${ownerName} for "${itemName}"! 🎉`);
  };

  const handlePurchaseInterest = (itemName: string, ownerName: string) => {
    toast.success(`Message sent to ${ownerName} about "${itemName}"! 💬`);
  };

  const ItemCard = ({ item }: { item: typeof DEMO_NEARBY_ITEMS[0] }) => (
    <Card className="overflow-hidden hover-lift transition-all duration-300 group">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {item.category_icon}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-background/90 backdrop-blur-sm">
            <MapPin className="w-3 h-3" />
            {item.distance} mi
          </Badge>
        </div>
        {item.type === "borrow" && item.sharing_price === 0 && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary text-primary-foreground">Free to borrow</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.category_icon}</span>
              <h3 className="font-semibold truncate">{item.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize">{item.condition}</Badge>
          {item.type === "borrow" && item.sharing_price !== undefined && item.sharing_price > 0 && (
            <Badge variant="secondary">${item.sharing_price}/day</Badge>
          )}
          {item.type === "purchase" && item.selling_price !== undefined && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">${item.selling_price}</Badge>
          )}
        </div>

        <div className="pt-2 border-t flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback className="text-xs">{item.owner_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">{item.owner_name}</span>
          </div>
          {item.type === "borrow" ? (
            <Button 
              size="sm" 
              onClick={() => handleBorrowRequest(item.name, item.owner_name)}
              className="flex-shrink-0"
            >
              <HandHeart className="w-4 h-4 mr-1" />
              Borrow
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => handlePurchaseInterest(item.name, item.owner_name)}
              className="flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Buy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Items Near You</CardTitle>
          <Badge variant="secondary" className="ml-auto">Demo</Badge>
        </div>
        <CardDescription>
          Discover what your neighbors are sharing and selling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for items (e.g., drill, camera, bike)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <Select value={distanceFilter} onValueChange={setDistanceFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All distances</SelectItem>
                <SelectItem value="0.5">Within 0.5 mi</SelectItem>
                <SelectItem value="1">Within 1 mi</SelectItem>
                <SelectItem value="2">Within 2 mi</SelectItem>
                <SelectItem value="5">Within 5 mi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || distanceFilter !== "all") && (
          <p className="text-sm text-muted-foreground">
            Found {allFilteredItems.length} item{allFilteredItems.length !== 1 ? "s" : ""} 
            {searchQuery && ` matching "${searchQuery}"`}
            {distanceFilter !== "all" && ` within ${distanceFilter} miles`}
          </p>
        )}

        <Tabs defaultValue="borrow" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="borrow" className="flex items-center gap-2">
              <HandHeart className="w-4 h-4" />
              Borrow ({borrowItems.length})
            </TabsTrigger>
            <TabsTrigger value="purchase" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Purchase ({purchaseItems.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="borrow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {borrowItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="purchase">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchaseItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
