import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ViewerLocation {
  latitude: number;
  longitude: number;
  source: "profile" | "browser";
  city?: string | null;
}

export function useViewerLocation() {
  const [location, setLocation] = useState<ViewerLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("latitude, longitude, city")
            .eq("id", session.user.id)
            .maybeSingle();
          if (
            profile?.latitude != null &&
            profile?.longitude != null &&
            !cancelled
          ) {
            setLocation({
              latitude: Number(profile.latitude),
              longitude: Number(profile.longitude),
              source: "profile",
              city: profile.city,
            });
            setLoading(false);
            return;
          }
        }

        // Fallback: browser geolocation (best-effort, no prompt loop)
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                source: "browser",
              });
              setLoading(false);
            },
            () => {
              if (cancelled) return;
              setDenied(true);
              setLoading(false);
            },
            { timeout: 5000, maximumAge: 1000 * 60 * 60 }
          );
        } else {
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: "browser",
        });
        setLoading(false);
      },
      () => {
        setDenied(true);
        setLoading(false);
      }
    );
  };

  return { location, loading, denied, requestBrowserLocation };
}

// Haversine distance in miles
export function distanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const r = 3959;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
