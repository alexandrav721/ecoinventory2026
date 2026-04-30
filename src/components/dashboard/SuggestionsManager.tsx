import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserCategoryManager from "./UserCategoryManager";
import LocationManager from "./LocationManager";
import BrandManager from "./BrandManager";
import SuggestionFeedbackManager from "./SuggestionFeedbackManager";
import ProductCategoryManager from "./ProductCategoryManager";

export default function SuggestionsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Suggestion Management</h2>
        <p className="text-muted-foreground">
          Manage the autocomplete suggestions that appear when users add items. 
          This helps reduce AI costs and standardize your inventory.
        </p>
      </div>
      
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <UserCategoryManager />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <ProductCategoryManager />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <LocationManager />
        </TabsContent>
        
        <TabsContent value="brands" className="space-y-4">
          <BrandManager />
        </TabsContent>
        
        <TabsContent value="feedback" className="space-y-4">
          <SuggestionFeedbackManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}