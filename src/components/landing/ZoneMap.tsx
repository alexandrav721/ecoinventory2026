import { Suspense, lazy, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HAIRLINE, INK, MUTED } from "@/components/brand";

/* Leaflet is ~160 KB and the map draws nothing until the database has cells
   to draw. Loading it lazily means only the visitors who actually get a map
   pay for it. */
const ZoneMapCanvas = lazy(
  () => import("@/components/landing/ZoneMapCanvas")
);

/**
 * Where Loop is, on a map — at half-mile resolution and no finer.
 *
 * THE CONSTRAINT THIS IS BUILT AROUND. A map needs coordinates, and
 * docs/STEP-4 deliberately revoked latitude and longitude from anonymous
 * visitors so a stranger cannot harvest members' home locations. Both of
 * those are right and they contradict each other. The way out is that this
 * component never sees a coordinate: it calls public_map_zones(), a
 * SECURITY DEFINER function that reads the real columns and can only return
 * a grid cell centre and a count.
 *
 * The cell is 0.0075° — about 0.52 miles — which is the same size the
 * iPhone app already uses (ExploreMap.tsx, ZONE_STEP_DEG), and exactly what
 * the privacy policy already promises: "every item is snapped to a coarse
 * grid roughly half a mile across, so your exact address is never a pin."
 * Two neighbours in one cell produce the same output as one. There is
 * nothing here to un-round.
 *
 * WHY THE TILES ARE DESATURATED. A default OpenStreetMap basemap is the most
 * template-looking object that could be put on this page — colourful, busy,
 * and instantly recognisable as an embed. A CSS filter takes it down to
 * paper and ink so the geography reads as context rather than as decoration,
 * and the only colour left on it is claret. This is a filter rather than a
 * different tile provider on purpose: a greyscale basemap would mean adding
 * another company that receives every visitor's IP address.
 *
 * It renders nothing at all until it has zones. An empty map of Manhattan
 * with no bubbles on it would be the single most discouraging object on the
 * site, and the page says what it has in words either way.
 */

export type Zone = { lat: number; lng: number; items: number; people: number };

export function ZoneMap() {
  const [zones, setZones] = useState<Zone[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      /* public_map_zones post-dates the generated types, so the client has
         no signature for it. Narrowed to the one call rather than casting
         the whole client to `any`: the shape is fixed by STEP-8 and every
         field is re-checked below anyway. */
      const rpc = supabase.rpc as unknown as (
        fn: string
      ) => Promise<{ data: unknown; error: unknown }>;
      const { data, error } = await rpc("public_map_zones");
      if (cancelled) return;
      if (error || !Array.isArray(data)) {
        /* Most likely the SQL has not been run yet. Say nothing rather than
           show a broken frame. */
        setZones([]);
        return;
      }
      setZones(
        data
          .map((z: Record<string, unknown>) => ({
            lat: Number(z.lat),
            lng: Number(z.lng),
            items: Number(z.items),
            people: Number(z.people),
          }))
          .filter((z: Zone) => Number.isFinite(z.lat) && Number.isFinite(z.lng))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!zones || zones.length === 0) return null;

  const totalItems = zones.reduce((n, z) => n + z.items, 0);

  /* Whether anything is in FiDi yet is COMPUTED, not asserted. Every other
     number on this page is a live query and this sentence is the most
     load-bearing one on the map — it would be the first thing to quietly go
     stale the day somebody in Lower Manhattan lists a drill.
     Broad Street & Wall, and a 2 km radius, which is roughly the whole
     neighbourhood including Battery Park City. */
  const FIDI: [number, number] = [40.7069, -74.0113];
  const kmBetween = (a: [number, number], b: [number, number]) => {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const la1 = (a[0] * Math.PI) / 180;
    const la2 = (b[0] * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const inFidi = zones.filter((z) => kmBetween([z.lat, z.lng], FIDI) <= 2);
  const fidiItems = inFidi.reduce((n, z) => n + z.items, 0);

  return (
    <section className="px-6 py-20 md:px-12 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <h2
          className="text-[30px] leading-[1.06] md:text-[40px]"
          style={{
            fontFamily: "Instrument Serif, Georgia, serif",
            letterSpacing: "-0.015em",
          }}
        >
          And where that is.
        </h2>
        <p
          className="mt-4 max-w-[620px] text-[16px] leading-[1.62]"
          style={{ color: "#4A4540" }}
        >
          Each circle is a half-mile square with something in it. That is as
          precise as this map can be, on purpose — it is drawn from a function
          that rounds every location to the middle of its square before it
          leaves the database, so nobody's address is a pin, including mine.
        </p>

        <div
          className="mt-10 overflow-hidden"
          style={{ borderRadius: 2, border: `1px solid ${HAIRLINE}` }}
        >
          <Suspense
            fallback={<div style={{ height: 420, background: "#F7F2EA" }} />}
          >
            <ZoneMapCanvas zones={zones} />
          </Suspense>
        </div>

        <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
          {totalItems} {totalItems === 1 ? "thing" : "things"} across{" "}
          {zones.length} {zones.length === 1 ? "square" : "squares"}.{" "}
          <span style={{ color: INK }}>
            {fidiItems === 0 ? (
              <>
                None of them in the Financial District yet — that is what the
                list is for.
              </>
            ) : (
              <>
                {fidiItems} of them in the Financial District
                {inFidi.length > 1 ? `, across ${inFidi.length} squares` : ""}.
              </>
            )}
          </span>
        </p>
      </div>
    </section>
  );
}
