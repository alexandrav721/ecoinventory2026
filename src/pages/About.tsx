import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Heart, Target, Lightbulb, Leaf } from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import { Logo } from "@/components/Logo";

const About = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </header>

      {/* Navigation */}
      {user && <DashboardNav />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">How Loop Works</h1>
            <p className="text-xl text-muted-foreground">
              Helping you own less, share more, and actually use what you have
            </p>
          </div>

          {/* Our Story */}
          <Card className="shadow-card">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-eco flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">How We Got Started</h2>
              </div>
              <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
                <p>
                  Real talk: We kept buying stuff we already had because we forgot about it. 
                  Meanwhile, perfectly good things were collecting dust when someone nearby 
                  actually needed them.
                </p>
                <p>
                  So we built Loop. It helps you keep track of what you own, see what 
                  it's worth, and connect with people who might need what you're not using. 
                  Pretty simple, right?
                </p>
                <p>
                  This isn't just about organizing your closet (though that's cool too). It's 
                  about buying less, wasting less, and helping out your community. Every item 
                  you track and share makes a difference.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-eco flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">What We're All About</h2>
                </div>
                <p className="text-muted-foreground">
                  Help people stop buying duplicates, share more with their community, and 
                  actually think about what they own. Less mindless consumption, more mindful 
                  living.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-eco flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Where We're Going</h2>
                </div>
                <p className="text-muted-foreground">
                  A world where people actually use what they have, share what they don't, 
                  and communities help each other out. Where buying less feels good and 
                  sustainability isn't a buzzword—it's just how we live.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <Card className="shadow-card">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold mb-6">What We Stand For</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Sustainability 🌱</h3>
                  <p className="text-muted-foreground">
                    Less waste, more reusing. Make the most of what you already have.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Community 🤝</h3>
                  <p className="text-muted-foreground">
                    Better together. Build a network where people actually help each other out.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Transparency 💡</h3>
                  <p className="text-muted-foreground">
                    No BS. Know what you own, what it's worth, and make smarter choices.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Empowerment ✨</h3>
                  <p className="text-muted-foreground">
                    You're in control. Your stuff, your choices, your impact.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Us */}
          <div className="text-center space-y-6 py-8">
            <h2 className="text-3xl font-bold">Come Join Us!</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you want to get organized, help your neighbors, or just stop buying 
              stuff you already have—we're here to make it easy.
            </p>
            {!user && (
              <Button asChild size="lg" className="gap-2">
                <a href="/auth">
                  Let's Get Started
                  <Leaf className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
