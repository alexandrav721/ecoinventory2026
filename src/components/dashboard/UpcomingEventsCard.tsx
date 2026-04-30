import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { EVENT_TYPE_META, EventType, formatEventDate, formatEventTime } from "@/lib/events";

interface EventRow {
  id: string;
  title: string;
  event_type: EventType;
  starts_at: string;
  neighborhood: string | null;
  borough: string | null;
}

export function UpcomingEventsCard() {
  const { isDemoMode, demoEvents } = useDemo();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setEvents(demoEvents.slice(0, 3) as EventRow[]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("community_events")
        .select("id, title, event_type, starts_at, neighborhood, borough")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3);
      setEvents((data as EventRow[]) || []);
      setLoading(false);
    })();
  }, [isDemoMode, demoEvents]);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Upcoming events near you
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
          <Link to="/events">
            See all <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No upcoming events yet — check back soon.
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((evt) => {
              const meta = EVENT_TYPE_META[evt.event_type];
              const Icon = meta.icon;
              return (
                <Link
                  key={evt.id}
                  to="/events"
                  className="flex items-start gap-3 p-2.5 -mx-2.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-md ${meta.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{evt.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatEventDate(evt.starts_at)} · {formatEventTime(evt.starts_at)}</span>
                      {evt.neighborhood && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {evt.neighborhood}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
