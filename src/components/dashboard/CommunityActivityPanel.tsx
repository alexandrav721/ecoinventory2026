import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/contexts/DemoContext";
import { Users, Eye, Search, TrendingUp, DollarSign, Clock } from "lucide-react";

const CommunityActivityPanel = () => {
  const { isDemoMode, demoCommunityActivity } = useDemo();

  if (!isDemoMode) {
    return null;
  }

  const activity = demoCommunityActivity;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          See how the community interacts with items like yours
        </p>
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background rounded-lg p-3 border text-center">
            <Search className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{activity.searchesForYourItems}</div>
            <div className="text-xs text-muted-foreground">Searches</div>
          </div>
          <div className="bg-background rounded-lg p-3 border text-center">
            <Eye className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold text-green-600">{activity.itemViews}</div>
            <div className="text-xs text-muted-foreground">Item Views</div>
          </div>
          <div className="bg-background rounded-lg p-3 border text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold text-purple-600">{activity.potentialBuyers}</div>
            <div className="text-xs text-muted-foreground">Interested</div>
          </div>
        </div>

        {/* Average Prices */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Average Selling Prices in Your Area</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(activity.averagePricesInArea).map(([category, price]) => (
              <div key={category} className="flex items-center justify-between bg-background rounded-lg p-2 border text-sm">
                <span className="text-muted-foreground">{category}</span>
                <span className="font-semibold text-green-600">${price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Recent Activity</span>
          </div>
          <div className="space-y-2">
            {activity.recentActivity.map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-background rounded-lg p-3 border">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  item.type === 'search' ? 'bg-blue-500' :
                  item.type === 'view' ? 'bg-green-500' :
                  item.type === 'price' ? 'bg-amber-500' :
                  'bg-purple-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.message}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Searches */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Trending Searches Near You</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activity.recentSearchTerms.map((term, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {term}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityActivityPanel;