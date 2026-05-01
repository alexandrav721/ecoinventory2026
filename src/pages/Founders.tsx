import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sprout, TreeDeciduous, Check, Heart, MessageCircle, Star, Crown, Sparkles, Mail, Quote, Recycle, Home, Users } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

const Founders = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // TODO: Connect to backend for waitlist
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("You're on the list! 🎉", {
      description: "We'll send you updates and early access invites."
    });
    setEmail("");
    setIsSubmitting(false);
  };

  const handlePurchase = (tier: string, price: number) => {
    // TODO: Connect to Stripe
    toast.info("Coming soon! 🚀", {
      description: `${tier} tier ($${price}) - Payment integration launching soon.`
    });
  };

  const tiers = [
    {
      name: "Founding Member",
      price: 49,
      icon: Sprout,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      description: "Best default option",
      features: [
        "Early access to Loop",
        "Lifetime discount on all paid plans",
        "Founder badge on your profile",
        "Vote on upcoming features",
        "Priority support during beta"
      ],
      cta: "Join as a Founding Member",
      popular: true
    },
    {
      name: "Supporting Founder",
      price: 99,
      icon: Leaf,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      description: "For people who want to go further",
      features: [
        "Everything in Founding Member",
        "Direct feedback channel with the founder",
        "Early access to new tools and experiments",
        "Name listed on Founding Supporters page"
      ],
      cta: "Become a Supporting Founder",
      popular: false
    },
    {
      name: "Champion",
      price: 249,
      icon: TreeDeciduous,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
      description: "Maximum impact",
      features: [
        "Everything in Supporting Founder",
        "30-minute 1-on-1 call with the founder",
        "Personalized onboarding & use-case setup",
        "Long-term influence on product direction"
      ],
      cta: "Become a Champion",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />

          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Limited Early Access
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-green-500 to-emerald-500 bg-clip-text text-transparent">
          Help Build the Anti-Consumption Economy
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          We're building a world where people make money off the stuff they own — and stop buying things they don't need.
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          Founding members get early access, lifetime perks, and a real seat at the table. Help us prove that sharing economies can save people thousands while cutting waste.
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-5 h-5 text-red-400" />
            <span>Built with love</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span>Direct founder access</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>Lifetime perks</span>
          </div>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Photo placeholder */}
            <div className="md:col-span-2 flex flex-col items-center">
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary/20 via-green-500/20 to-emerald-500/20 flex items-center justify-center border-2 border-dashed border-primary/30 mb-4">
                <div className="text-center">
                  <Users className="w-12 h-12 text-primary/50 mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground">Your photo here</span>
                </div>
              </div>
              <p className="font-semibold text-lg">Your Name</p>
              <p className="text-muted-foreground text-sm">Founder, Loop</p>
            </div>
            
            {/* Story */}
            <div className="md:col-span-3 space-y-6">
              <div className="flex items-start gap-3">
                <Quote className="w-8 h-8 text-primary/30 shrink-0 rotate-180" />
                <h2 className="text-2xl md:text-3xl font-bold">Why I'm Building This</h2>
              </div>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  It started with a drawer full of phone chargers. I had <span className="text-foreground font-medium">seven of them</span> — 
                  and I'd just bought another one because I couldn't find any of them when I needed one.
                </p>
                
                <p>
                  That moment made me realize something: <span className="text-foreground font-medium">we don't have a stuff problem, 
                  we have an awareness problem.</span> We buy things we already own. We forget what we have. 
                  And when we need something, we buy new instead of borrowing from a neighbor.
                </p>
                
                <p>
                  I started Loop because I believe there's a better way. What if we could easily see 
                  everything we own? What if we could share with our community instead of everyone buying 
                  their own ladder, their own drill, their own camping gear?
                </p>
                
                <p className="text-foreground font-medium">
                  This isn't just an inventory app. It's a small step toward a world where we consume less, 
                  share more, and actually know what we have.
                </p>
              </div>
              
              {/* Mission pillars */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Home className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Know What You Own</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Recycle className="w-5 h-5 mx-auto mb-2 text-green-500" />
                  <p className="text-xs font-medium">Buy Less Stuff</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Heart className="w-5 h-5 mx-auto mb-2 text-red-400" />
                  <p className="text-xs font-medium">Share With Others</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                tier.popular ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
              } ${tier.borderColor}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 rounded-2xl ${tier.bgColor} flex items-center justify-center mx-auto mb-4`}>
                  <tier.icon className={`w-8 h-8 ${tier.color}`} />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground ml-1">one-time</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 ${tier.color} shrink-0 mt-0.5`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full mt-6" 
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(tier.name, tier.price)}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto bg-muted/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              What this is (and isn't)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                This is early-stage software
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Features will evolve based on feedback
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Founding members help guide priorities
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                No fixed launch deadlines — we're building responsibly
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Waitlist Section */}
      <section className="container mx-auto px-4 py-16 pb-24">
        <Card className="max-w-xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Not ready to join yet?</CardTitle>
            <CardDescription>
              Join the free beta waitlist to get updates, early access invites, and launch announcements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Joining..." : "Join the Waitlist"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2025 Loop. Built for a sustainable future.
        </div>
      </footer>
    </div>
  );
};

export default Founders;
