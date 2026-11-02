import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CLARET } from "@/components/brand";
import type { Zone } from "@/components/landing/ZoneMap";

/**
 * The Leaflet half of the map, in its own file so it can be lazily loaded.
 *
 * WHY THE SPLIT. Leaflet and react-leaflet are about 160 KB, and the map
 * draws nothing at all until public_map_zones() exists and returns cells.
 * Imported directly, every visitor would have downloaded a mapping library
 * to render nothing — on a page whose hero is a photograph and whose whole
 * argument depends on not feeling slow. ZoneMap asks the database first and
 * only then pulls this in, so the cost is paid by the people who get a map.
 */
export default function ZoneMapCanvas({ zones }: { zones: Zone[] }) {
  const bounds: [number, number][] = zones.map((z) => [z.lat, z.lng]);

  return (
    <MapContainer
      bounds={bounds.length > 1 ? (bounds as never) : undefined}
      center={bounds.length === 1 ? bounds[0] : undefined}
      zoom={bounds.length === 1 ? 11 : undefined}
      boundsOptions={{ padding: [48, 48] }}
      scrollWheelZoom={false}
      style={{ height: 420, width: "100%", background: "#F7F2EA" }}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="loop-tiles"
      />
      {zones.map((z) => (
        <CircleMarker
          key={`${z.lat}:${z.lng}`}
          center={[z.lat, z.lng]}
          /* Area, not radius, carries the count — a radius scaled linearly
             overstates a big number by its square. */
          radius={9 + Math.sqrt(z.items) * 5}
          pathOptions={{
            color: CLARET,
            fillColor: CLARET,
            fillOpacity: 0.26,
            weight: 1.5,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <span style={{ fontFamily: "Archivo, system-ui, sans-serif" }}>
              {z.items} {z.items === 1 ? "thing" : "things"}
              {z.people > 1 ? `, ${z.people} neighbours` : ""}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
