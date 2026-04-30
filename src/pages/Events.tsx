import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, LogOut, Calendar, MapPin, Users as UsersIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import { useDemo } from "@/contexts/DemoContext";
import { EVENT_TYPE_META, EventType, BOROUGHS, formatEventDate, formatEventTime } from "@/lib/events";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  host_name: string | null;
  starts_at: string;
  ends_at: string | null;
  neighborhood: string | null;
  borough: string | null;
  address: string | null;
  is_free: boolean;
  items_focus: string | null;
  cover_image_url: string | null;
  external_url?: string | null;
}

const Events = () => {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [boroughFilter, setBoroughFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { isDemoMode, demoEvents } = useDemo();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isDemoMode) {
        setEvents(demoEvents as EventRow[]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("community_events")
        .select("*")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      setEvents((data as EventRow[]) || []);

      if (user) {
        const { data: rsvps } = await supabase
          .from("event_rsvps")
          .select("event_id")
          .eq("user_id", user.id);
        setRsvpedIds(new Set((rsvps || []).map((r: any) => r.event_id)));
      }
      setLoading(false);
    })();
  }, [isDemoMode, demoEvents, user]);

  const handleRsvp = async (eventId: string) => {
    if (isDemoMode) {
      toast.success("RSVP confirmed (demo)");
      setRsvpedIds(new Set([...rsvpedIds, eventId]));
      return;
    }
    if (!user) {
      toast.error("Please sign in to RSVP");
      navigate("/auth");
      return;
    }
    const { error } = await supabase
      .from("event_rsvps")
      .upsert({ event_id: eventId, user_id: user.id, status: "going" }, { onConflict: "event_id,user_id" });
    if (error) {
      toast.error("Could not RSVP");
      return;
    }
    setRsvpedIds(new Set([...rsvpedIds, eventId]));
    toast.success("You're going! 🎉");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const filtered = events.filter((e) => {
    if (boroughFilter !== "All" && e.borough !== boroughFilter) return false;
    if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
    return true;
  });

  const eventTypes = Object.keys(EVENT_TYPE_META) as EventType[];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-eco flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EcoInventory</h1>
              {user && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          )}
        </div>
        <div className="container mx-auto px-4">
          <DashboardNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Community Events
          </h2>
          <p className="text-muted-foreground">
            Swap parties, repair cafés, stoop sales, and more across NYC. Bring stuff, take stuff, meet your neighbors.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Borough</p>
            <div className="flex flex-wrap gap-2">
              {BOROUGHS.map((b) => (
                <Button
                  key={b}
                  variant={boroughFilter === b ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBoroughFilter(b)}
                >
                  {b}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Type</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("all")}
              >
                All types
              </Button>
              {eventTypes.map((t) => {
                const meta = EVENT_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <Button
                    key={t}
                    variant={typeFilter === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter(t)}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {meta.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading events…</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No events match those filters. Try widening your search.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((evt) => {
              const meta = EVENT_TYPE_META[evt.event_type];
              const Icon = meta.icon;
              const isRsvped = rsvpedIds.has(evt.id);
              return (
                <Card key={evt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="secondary" className="text-xs">{meta.label}</Badge>
                          {evt.is_free && <Badge variant="outline" className="text-xs">Free</Badge>}
                        </div>
                        <h3 className="font-semibold leading-tight">{evt.title}</h3>
                      </div>
                    </div>

                    {evt.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{evt.description}</p>
                    )}

                    <div className="space-y-1.5 text-sm mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatEventDate(evt.starts_at)} · {formatEventTime(evt.starts_at)}</span>
                      </div>
                      {(evt.neighborhood || evt.address) && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            {evt.neighborhood && <strong className="text-foreground">{evt.neighborhood}</strong>}
                            {evt.borough && <span>, {evt.borough}</span>}
                            {evt.address && <div className="text-xs">{evt.address}</div>}
                          </span>
                        </div>
                      )}
                      {evt.host_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UsersIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Hosted by {evt.host_name}</span>
                        </div>
                      )}
                      {evt.items_focus && (
                        <p className="text-xs text-muted-foreground italic pt-1">
                          Bring: {evt.items_focus}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isRsvped ? "secondary" : "default"}
                        onClick={() => handleRsvp(evt.id)}
                        disabled={isRsvped}
                        className="flex-1"
                      >
                        {isRsvped ? "✓ Going" : "RSVP"}
                      </Button>
                      {evt.external_url && (
                        <Button asChild size="sm" variant="outline">
                          <a href={evt.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;
