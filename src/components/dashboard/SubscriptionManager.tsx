import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string | null;
}

export const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
    } else if (!data) {
      // Create default free subscription
      const { data: newSub, error: insertError } = await supabase
        .from("subscriptions")
        .insert({ user_id: user.id, tier: "free", status: "active" })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating subscription:", insertError);
      } else {
        setSubscription(newSub);
      }
    } else {
      setSubscription(data);
    }
    setLoading(false);
  };

  const handleUpgrade = () => {
    toast.info("Stripe integration pending", {
      description: "Please add your Stripe API key in Settings → Integrations → Stripe to enable upgrades."
    });
  };

  if (loading) {
    return <div>Loading subscription...</div>;
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["Basic inventory management", "Up to 100 items", "Community access"],
      tier: "free"
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      features: [
        "Unlimited items",
        "AI similarity analysis",
        "Advanced analytics",
        "Priority support",
        "Export data"
      ],
      tier: "pro"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Current Plan</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={subscription?.tier === "pro" ? "default" : "secondary"}>
          {subscription?.tier?.toUpperCase() || "FREE"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {subscription?.status === "active" ? "Active" : subscription?.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.tier} className={subscription?.tier === plan.tier ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {subscription?.tier === plan.tier ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : plan.tier === "pro" ? (
                <Button onClick={handleUpgrade} className="w-full">
                  Upgrade to Pro
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  Downgrade
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
