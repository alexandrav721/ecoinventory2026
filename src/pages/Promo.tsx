import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Package, Users, TrendingUp, MapPin, Share2, Download, BarChart3, Image as ImageIcon, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Promo = () => {
  const navigate = useNavigate();

  const handleDownloadPDF = () => {
    window.print();
  };

  const features = [
    {
      icon: Package,
      title: "Smart Inventory Dashboard",
      description: "Organize and track all your belongings in one place. View items by category, search instantly, and monitor value over time.",
      screenshot: "Dashboard view with categorized items and statistics"
    },
    {
      icon: ImageIcon,
      title: "Visual Catalog",
      description: "Upload photos of your items with automatic categorization. See your inventory in a beautiful gallery layout.",
      screenshot: "Gallery view showing item images and details"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track item depreciation, usage patterns, and your collection's total value with detailed statistics.",
      screenshot: "Charts showing inventory value and trends"
    },
    {
      icon: MapPin,
      title: "Community Sharing",
      description: "Connect with neighbors to borrow and lend items. Find what you need nearby instead of buying new.",
      screenshot: "Map view with available items in your area"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find items in your inventory or community quickly with advanced search and filtering options.",
      screenshot: "Search interface with filters and results"
    },
    {
      icon: Share2,
      title: "Easy Item Management",
      description: "Add, edit, and manage items with a simple interface. Mark items for sharing, track conditions, and more.",
      screenshot: "Item detail and editing interface"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Download PDF Button - Hidden in print */}
      <div className="print:hidden fixed top-20 right-4 z-50">
        <Button onClick={handleDownloadPDF} className="gap-2 shadow-lg">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 bg-gradient-eco opacity-5"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-eco flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight">
              Loop
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Track your belongings, share with your community, and build a sustainable future
            </p>
            
            <div className="pt-4 text-sm text-muted-foreground">
              A comprehensive platform for managing your inventory and connecting with your local sharing economy
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-12 border-y bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">What is Loop?</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Loop is a comprehensive web application that helps you organize, track, and share your belongings while building a sustainable community network.
              </p>
              <p>
                Whether you want to keep track of your personal items, monitor their value over time, or participate in a local sharing economy, Loop provides all the tools you need in one intuitive platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Key Features & Screenshots
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A visual tour of what Loop can do for you
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  className="border-2 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Screenshot placeholder */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 aspect-video md:aspect-auto flex items-center justify-center p-8 border-r">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-eco flex items-center justify-center mx-auto">
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-sm text-muted-foreground italic">
                            {feature.screenshot}
                          </p>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div className="p-6 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-card/50 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Loop?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-eco flex items-center justify-center mx-auto mb-4">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Organize Everything</h3>
                  <p className="text-sm text-muted-foreground">Keep track of all your belongings in one centralized, searchable system</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-eco flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Share Locally</h3>
                  <p className="text-sm text-muted-foreground">Connect with neighbors and reduce waste through community sharing</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-eco flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Track Value</h3>
                  <p className="text-sm text-muted-foreground">Monitor depreciation and understand the true worth of your possessions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-eco opacity-10"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Get Started Today
            </h2>
            
            <p className="text-lg text-muted-foreground">
              Join Loop and start building a more organized, sustainable lifestyle
            </p>
            
            <div className="pt-4 print:hidden">
              <Button 
                size="lg" 
                className="text-lg px-12"
                onClick={() => navigate("/auth")}
              >
                Sign Up Free
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Free to start • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-eco flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Loop</span>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">
                About
              </button>
              <button onClick={() => navigate("/articles")} className="hover:text-foreground transition-colors">
                Articles
              </button>
              <button onClick={() => navigate("/community")} className="hover:text-foreground transition-colors">
                Community
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Loop - Building sustainable communities through smart sharing
            </p>
          </div>
        </div>
      </footer>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          nav, header { display: none !important; }
          button { display: none !important; }
          section { page-break-inside: avoid; break-inside: avoid; }
          h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </div>
  );
};

export default Promo;
