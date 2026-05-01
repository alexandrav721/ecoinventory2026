import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Recycle, Users, ShoppingBag, TrendingDown } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

const CircularEconomyGuide = () => {
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
              <Recycle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">The Circular Economy: A Beginner's Guide</h1>
            <p className="text-muted-foreground text-lg">5 min read</p>
          </header>

          <Card>
            <CardContent className="prose prose-lg max-w-none p-8">
              <h2>What is the Circular Economy?</h2>
              <p>
                The circular economy is a sustainable economic model that aims to eliminate waste and maximize the use of resources. 
                Unlike the traditional linear economy (take-make-dispose), the circular economy keeps products and materials in use 
                for as long as possible through reuse, repair, refurbishment, and recycling.
              </p>

              <div className="flex gap-4 my-6">
                <div className="flex-1 p-4 bg-muted rounded-lg">
                  <Users className="w-6 h-6 mb-2 text-primary" />
                  <h3 className="text-sm font-semibold">Share</h3>
                  <p className="text-sm text-muted-foreground">Maximize usage by sharing items</p>
                </div>
                <div className="flex-1 p-4 bg-muted rounded-lg">
                  <ShoppingBag className="w-6 h-6 mb-2 text-primary" />
                  <h3 className="text-sm font-semibold">Reuse</h3>
                  <p className="text-sm text-muted-foreground">Give items a second life</p>
                </div>
                <div className="flex-1 p-4 bg-muted rounded-lg">
                  <TrendingDown className="w-6 h-6 mb-2 text-primary" />
                  <h3 className="text-sm font-semibold">Reduce</h3>
                  <p className="text-sm text-muted-foreground">Minimize waste production</p>
                </div>
              </div>

              <h2>Why Does It Matter?</h2>
              <p>
                Our planet's resources are finite, yet the traditional linear economy treats them as unlimited. 
                By 2050, the world's resource consumption is projected to triple if current trends continue. 
                The circular economy offers a solution by:
              </p>
              <ul>
                <li>Reducing environmental impact and carbon emissions</li>
                <li>Creating economic opportunities through new business models</li>
                <li>Building more resilient communities</li>
                <li>Preserving resources for future generations</li>
              </ul>

              <h2>How Can You Participate?</h2>
              <p>
                Everyone can contribute to the circular economy. Here are some practical ways to get started:
              </p>
              <ol>
                <li><strong>Share and borrow:</strong> Use platforms like Loop to share items with your community instead of buying new</li>
                <li><strong>Buy quality:</strong> Invest in durable, repairable products that last longer</li>
                <li><strong>Repair first:</strong> Fix broken items before replacing them</li>
                <li><strong>Donate and sell:</strong> Give items you no longer need a second life</li>
                <li><strong>Choose sustainable:</strong> Support businesses that prioritize sustainability</li>
              </ol>

              <h2>The Role of Technology</h2>
              <p>
                Digital platforms are making circular economy practices more accessible than ever. 
                Apps like Loop help you catalog your possessions, making it easier to share resources 
                with neighbors, track item lifecycles, and make informed decisions about purchases and disposals.
              </p>

              <h2>Getting Started Today</h2>
              <p>
                The transition to a circular economy starts with small steps. Begin by inventorying what you own, 
                identifying items you rarely use, and connecting with others in your community who might benefit 
                from sharing resources. Every shared tool, donated item, or repaired product is a step toward 
                a more sustainable future.
              </p>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
};

export default CircularEconomyGuide;
