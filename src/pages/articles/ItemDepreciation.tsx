import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, AlertCircle } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

const ItemDepreciation = () => {
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
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Understanding Item Depreciation</h1>
            <p className="text-muted-foreground text-lg">6 min read</p>
          </header>

          <Card>
            <CardContent className="prose prose-lg max-w-none p-8">
              <p className="lead">
                Understanding how your possessions lose value over time is crucial for making smart financial decisions, 
                whether you're selling items, planning purchases, or managing insurance.
              </p>

              <h2>What is Depreciation?</h2>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <TrendingUp className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Depreciation is the decrease in value of an asset over time due to wear, age, and market factors. 
                    Most household items depreciate, though the rate varies significantly by category.
                  </p>
                </div>
              </div>

              <h2>Why Track Depreciation?</h2>
              <p>Understanding depreciation helps you:</p>
              <ul>
                <li><strong>Make better selling decisions:</strong> Know when to sell for maximum return</li>
                <li><strong>Time purchases wisely:</strong> Buy items when they offer the best value</li>
                <li><strong>Plan finances:</strong> Understand the true cost of ownership</li>
                <li><strong>Manage insurance:</strong> Maintain accurate coverage for your possessions</li>
                <li><strong>Calculate net worth:</strong> Get a realistic picture of your assets</li>
              </ul>

              <h2>Depreciation Rates by Category</h2>
              
              <h3>Fast Depreciation (50-70% in first year)</h3>
              <div className="p-4 bg-muted rounded-lg my-4">
                <p className="m-0"><strong>Electronics & Technology</strong></p>
                <ul className="mt-2 mb-0">
                  <li>Computers and laptops: 40-50% first year</li>
                  <li>Smartphones: 50-60% first year</li>
                  <li>Gaming consoles: 30-40% first year</li>
                  <li>TVs and monitors: 40-50% first year</li>
                </ul>
              </div>

              <h3>Moderate Depreciation (20-40% first year)</h3>
              <div className="p-4 bg-muted rounded-lg my-4">
                <p className="m-0"><strong>Furniture & Appliances</strong></p>
                <ul className="mt-2 mb-0">
                  <li>Kitchen appliances: 30-40% first year</li>
                  <li>Furniture: 20-30% first year</li>
                  <li>Power tools: 25-35% first year</li>
                  <li>Sporting equipment: 30-40% first year</li>
                </ul>
              </div>

              <h3>Slow Depreciation (10-20% first year)</h3>
              <div className="p-4 bg-muted rounded-lg my-4">
                <p className="m-0"><strong>Collectibles & Quality Items</strong></p>
                <ul className="mt-2 mb-0">
                  <li>High-end watches: 10-20% first year</li>
                  <li>Designer handbags: 15-25% first year</li>
                  <li>Musical instruments: 15-20% first year</li>
                  <li>Antique furniture: May appreciate</li>
                </ul>
              </div>

              <h2>Factors Affecting Depreciation</h2>
              
              <div className="grid gap-4 my-6">
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <Calendar className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="mt-0 mb-2">Age</h4>
                    <p className="m-0 text-sm">Older items generally have lower value, with steepest decline in first 1-2 years</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <AlertCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="mt-0 mb-2">Condition</h4>
                    <p className="m-0 text-sm">Well-maintained items retain more value; damage accelerates depreciation</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="mt-0 mb-2">Market Demand</h4>
                    <p className="m-0 text-sm">Popular brands and in-demand items depreciate more slowly</p>
                  </div>
                </div>
              </div>

              <h2>Calculating Current Value</h2>
              <p>To estimate an item's current value:</p>
              <ol>
                <li>Start with the original purchase price</li>
                <li>Apply the typical depreciation rate for that category</li>
                <li>Adjust for condition (excellent: +10%, poor: -20%)</li>
                <li>Factor in market demand and brand premium</li>
                <li>Check comparable listings on resale platforms</li>
              </ol>

              <div className="p-4 bg-primary/10 border-l-4 border-primary rounded my-6">
                <p className="m-0">
                  <strong>Example:</strong> A $1,200 laptop purchased 2 years ago in good condition:<br/>
                  Year 1: $1,200 × 0.5 = $600<br/>
                  Year 2: $600 × 0.7 = $420<br/>
                  Current estimated value: ~$400-450
                </p>
              </div>

              <h2>Slowing Depreciation</h2>
              <p>You can minimize value loss by:</p>
              <ul>
                <li>Maintaining items carefully and regularly</li>
                <li>Keeping original packaging and documentation</li>
                <li>Storing items properly when not in use</li>
                <li>Choosing quality brands with proven longevity</li>
                <li>Staying within warranty periods for major repairs</li>
              </ul>

              <h2>When to Sell</h2>
              <p>
                The optimal time to sell depends on the item category. For fast-depreciating electronics, 
                selling within 12-18 months often yields the best return relative to remaining utility. 
                For furniture and appliances, you might wait 3-5 years when you've maximized use but value 
                remains reasonable.
              </p>

              <h2>Making It Work for You</h2>
              <p>
                Track your items' values using inventory management tools. Regular updates help you spot 
                opportunities to sell before major value drops, make informed replacement decisions, and 
                maintain accurate insurance coverage. Understanding depreciation turns you into a more 
                strategic consumer and helps maximize the return on your purchases.
              </p>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
};

export default ItemDepreciation;
