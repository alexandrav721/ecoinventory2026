import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Camera, Tag, FolderTree } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

const OrganizingInventory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardNav />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/articles")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>

        <article className="space-y-8">
          <header className="space-y-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-eco flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">10 Tips for Organizing Your Home Inventory</h1>
            <p className="text-muted-foreground text-lg">7 min read</p>
          </header>

          <Card>
            <CardContent className="prose prose-lg max-w-none p-8">
              <p className="lead">
                Managing your possessions effectively can save you time, money, and stress. 
                Here are ten practical strategies to help you catalog and organize your belongings efficiently.
              </p>

              <h2>1. Start with Categories</h2>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <FolderTree className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Begin by dividing your items into broad categories: electronics, furniture, kitchenware, clothing, etc. 
                    This provides a logical structure that makes finding items easier later.
                  </p>
                </div>
              </div>

              <h2>2. Take Photos of Everything</h2>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <Camera className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Visual documentation is invaluable. Take clear photos from multiple angles, especially for valuable items. 
                    This helps with insurance claims, selling items, and simply remembering what you own.
                  </p>
                </div>
              </div>

              <h2>3. Record Purchase Information</h2>
              <p>
                Document when and where you bought each item, along with the original price. This information helps you:
              </p>
              <ul>
                <li>Track depreciation over time</li>
                <li>Make informed decisions about replacements</li>
                <li>Provide proof of purchase for warranties</li>
                <li>Calculate your net worth accurately</li>
              </ul>

              <h2>4. Use Tags and Labels</h2>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <Tag className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Create a consistent tagging system. Use tags for condition (new, good, fair), usage frequency 
                    (daily, weekly, rarely), and purpose (work, hobby, seasonal). This makes searching and filtering much easier.
                  </p>
                </div>
              </div>

              <h2>5. Note Item Conditions</h2>
              <p>
                Honestly assess and record the condition of each item. This helps you:
              </p>
              <ul>
                <li>Identify items that need repair</li>
                <li>Determine accurate resale values</li>
                <li>Decide when it's time to replace something</li>
                <li>Share realistic expectations when lending items</li>
              </ul>

              <h2>6. Track Usage Patterns</h2>
              <p>
                Note how often you use each item. This reveals:
              </p>
              <ul>
                <li>Items that might be worth sharing with others</li>
                <li>Possessions you could declutter without impact</li>
                <li>Tools that justify their storage space</li>
                <li>Patterns in your lifestyle and needs</li>
              </ul>

              <h2>7. Include Dimensions and Specifications</h2>
              <p>
                Record physical measurements and technical specs, especially for:
              </p>
              <ul>
                <li>Furniture (for space planning and moving)</li>
                <li>Electronics (for compatibility and upgrades)</li>
                <li>Clothing and shoes (for online shopping)</li>
                <li>Storage containers (for organization projects)</li>
              </ul>

              <h2>8. Set Reminders for Maintenance</h2>
              <p>
                Many items require periodic maintenance. Create reminders for:
              </p>
              <ul>
                <li>Battery replacements in smoke detectors</li>
                <li>Filter changes in appliances</li>
                <li>Warranty expiration dates</li>
                <li>Seasonal equipment servicing</li>
              </ul>

              <h2>9. Review and Update Regularly</h2>
              <p>
                Schedule quarterly reviews of your inventory. Remove items you no longer own, update conditions, 
                and adjust values. A current inventory is far more useful than an outdated one.
              </p>

              <h2>10. Share Strategically</h2>
              <p>
                Mark items you're willing to share or lend to others. This:
              </p>
              <ul>
                <li>Builds community connections</li>
                <li>Maximizes the value of your possessions</li>
                <li>Reduces waste through shared resources</li>
                <li>Creates opportunities for reciprocal borrowing</li>
              </ul>

              <h2>Getting Started</h2>
              <p>
                Don't feel overwhelmed by the prospect of cataloging everything at once. Start with one room or category, 
                and gradually expand your inventory. The key is consistency—spending just 15 minutes a week can make 
                a significant difference over time.
              </p>

              <p>
                Tools like EcoInventory make this process seamless, providing templates and reminders to help you 
                maintain an organized, comprehensive inventory of your possessions.
              </p>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
};

export default OrganizingInventory;
