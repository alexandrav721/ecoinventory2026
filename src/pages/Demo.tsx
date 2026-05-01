import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Play, Eye, Sparkles, Shield, Package, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useDemo } from "@/contexts/DemoContext";

const Demo = () => {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemo();

  const startDemo = () => {
    enterDemoMode();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="sm" />
          <Button asChild variant="ghost" size="sm">
            <Link to="/welcome">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 md:py-24 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-3">
          <span className="editorial-rule" />
          <span>§ Try it out — no signup</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] font-light">
          Take Loop for a <span className="italic font-display-wonk text-primary">spin.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-8 leading-relaxed">
          Demo mode loads a sample household — a few rooms of stuff, a handful of friends, some
          neighborhood listings. Click around like you would on your own account.{" "}
          <span className="italic font-display-wonk text-foreground">Nothing saves.</span>
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          {[
            { icon: Package, title: "Sample inventory", desc: "Items across rooms, with values, conditions, photos." },
            { icon: Users, title: "Mock friends", desc: "See what borrowing, lending, and following look like." },
            { icon: Sparkles, title: "AI insights", desc: "Excess flags, opportunities, and Before-You-Buy checks." },
          ].map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardContent className="p-5 space-y-2">
                <f.icon className="w-5 h-5 text-primary" />
                <div className="font-medium">{f.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-border/60 bg-muted/30">
          <CardContent className="p-5 flex gap-3 items-start">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed">
              The demo runs entirely in your browser. No account is created, no data is stored on
              our servers. You'll see a banner at the top so you always know you're in demo mode.
              Exit anytime from the banner.
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 mt-12">
          <Button
            onClick={startDemo}
            size="lg"
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 h-14 px-8 text-base"
          >
            <Play className="w-4 h-4" />
            Start the demo
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-foreground/30 hover:bg-foreground hover:text-background gap-2 h-14 px-8 text-base"
          >
            <Link to="/auth">
              <Eye className="w-4 h-4" />
              Skip demo, sign up
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Demo;
