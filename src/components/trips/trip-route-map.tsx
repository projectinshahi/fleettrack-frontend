"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

import { GeoPoint, RoutePoint, RoutePointType } from "@/types/trip";

/* Same loader config as the tracking map so the Google JS API is shared. */
const MAP_LIBRARIES: "marker"[] = ["marker"];

const CONTAINER_STYLE: React.CSSProperties = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 9.9312, lng: 76.2673 }; // Kochi
const DEFAULT_ZOOM = 8;

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "greedy",
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

/* Marker and line colours. Google draws these itself (symbols and polylines take colour
 * strings, not CSS variables), so they are literal values, each one a light-theme token:
 * the basemap is light in both app themes. Each clears 3:1 against Google's darkest large
 * fill (water): ink 10.70, neutral 3.51, signal 4.56, attention 3.08.
 *
 * Route points are nominal, so they are neutral and told apart by SHAPE, never by hue: a
 * filled disc for pickup, a numbered disc per stop, a hollow ring for the destination. The
 * vehicle and its travelled trail are the FleetTrack signal (magenta), and the vehicle is a
 * diamond, the app's signal shape; off route, it turns attention (amber). */
const INK = "#1C1A17"; // --foreground
const NEUTRAL = "#6B665E"; // --status-neutral
const SIGNAL = "#A3175E"; // --status-signal
const ATTN = "#9A6400"; // --status-attn
const CASING = "#FFFFFF"; // marker edge against the tiles

const POINT_ICON: Record<
  RoutePointType,
  { fillColor: string; strokeColor: string; strokeWeight: number; scale: number }
> = {
  pickup: { fillColor: INK, strokeColor: CASING, strokeWeight: 2, scale: 9 },
  stop: { fillColor: NEUTRAL, strokeColor: CASING, strokeWeight: 2, scale: 8 },
  destination: { fillColor: CASING, strokeColor: INK, strokeWeight: 3, scale: 9 },
};

// A unit diamond centred on the position, so it anchors exactly where the circle did.
const VEHICLE_PATH = "M 0 -1 L 1 0 L 0 1 L -1 0 Z";

const WRAPPER_CLASS =
  "relative h-[300px] w-full overflow-hidden rounded-lg border border-border sm:h-[380px]";

interface Props {
  points: RoutePoint[];
  vehiclePosition?: GeoPoint | null;
  /** Travelled path so far (route playback) — drawn over the planned route. */
  trail?: GeoPoint[];
  /** Tints the vehicle marker amber when it has strayed off the planned route. */
  deviating?: boolean;
  loading?: boolean;
}

export default function TripRouteMap({
  points,
  vehiclePosition = null,
  trail = [],
  deviating = false,
  loading = false,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    id: "google-map-script",
    libraries: MAP_LIBRARIES,
  });

  const vehicleColor = deviating ? ATTN : SIGNAL;

  const mapRef = useRef<google.maps.Map | null>(null);

  // Latest live position, read by fitToPoints without being a dependency — so the
  // map frames the vehicle on load but does NOT refit on every live tick (the
  // marker moves on its own; refitting each update would make the map jump around).
  const vehiclePositionRef = useRef<GeoPoint | null>(vehiclePosition);
  useEffect(() => {
    vehiclePositionRef.current = vehiclePosition;
  }, [vehiclePosition]);

  const fitToPoints = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const coords = points.map((p) => p.coords);
    const vp = vehiclePositionRef.current;
    if (vp) coords.push(vp);
    if (coords.length === 0) return;

    if (coords.length === 1) {
      map.setCenter(coords[0]);
      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    coords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, 60);
  }, [points]);

  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitToPoints();
    },
    [fitToPoints],
  );

  // Refit when the route changes (e.g. live preview updates in the modal) — not
  // on live position ticks, which only move the marker (see fitToPoints).
  useEffect(() => {
    fitToPoints();
  }, [fitToPoints]);

  if (loading || !isLoaded) {
    return (
      // A pulsing placeholder in the map's own frame, like every other loading state.
      <div role="status" className={`${WRAPPER_CLASS} animate-pulse bg-border/60`}>
        <span className="sr-only">Loading map…</span>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div
        className={`${WRAPPER_CLASS} flex items-center justify-center bg-muted`}
      >
        <span className="text-sm text-muted-foreground">
          No route to preview
        </span>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        options={MAP_OPTIONS}
        onLoad={handleLoad}
        onUnmount={() => {
          mapRef.current = null;
        }}
      >
        <Polyline
          path={points.map((p) => p.coords)}
          options={{
            strokeColor: NEUTRAL,
            // Fully opaque: at the old 0.85 the neutral line fell under 3:1 over water.
            strokeOpacity: 1,
            strokeWeight: 3,
          }}
        />

        {/* Travelled path (route playback) — overlays the planned route. */}
        {trail.length > 1 && (
          <Polyline
            path={trail}
            options={{
              strokeColor: SIGNAL,
              strokeOpacity: 0.95,
              strokeWeight: 5,
            }}
          />
        )}

        {points.map((point, index) => (
          <Marker
            key={`${point.type}-${index}`}
            position={point.coords}
            title={point.label}
            label={
              point.type === "stop" && point.sequence
                ? {
                    text: String(point.sequence),
                    color: CASING,
                    fontSize: "11px",
                    fontWeight: "700",
                  }
                : undefined
            }
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillOpacity: 1,
              ...POINT_ICON[point.type],
            }}
          />
        ))}

        {vehiclePosition && (
          <Marker
            position={vehiclePosition}
            title={
              deviating
                ? "Vehicle off planned route"
                : "Current vehicle position"
            }
            zIndex={1000}
            icon={{
              path: VEHICLE_PATH,
              scale: 8,
              fillColor: vehicleColor,
              fillOpacity: 1,
              strokeColor: CASING,
              strokeWeight: 3,
            }}
          />
        )}
      </GoogleMap>

      {/* Legend — map chrome, the same fixed dark layer as the tracking map's overlays. The
          swatches repeat each marker's SHAPE (filled, small, hollow, diamond), which is the
          encoding; on the dark chrome the fills are drawn light. */}
      <div className="absolute left-3 top-3 z-[5] flex flex-col gap-1.5 rounded-lg border border-chrome-line bg-chrome-bg px-3 py-2 text-xs font-medium text-chrome-fg">
        <span className="flex items-center gap-2">
          <span aria-hidden className="flex w-3 justify-center">
            <span className="size-2.5 rounded-full bg-chrome-fg" />
          </span>
          Pickup
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="flex w-3 justify-center">
            <span className="size-2 rounded-full bg-chrome-fg-dim" />
          </span>
          Stop
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="flex w-3 justify-center">
            <span className="size-2.5 rounded-full border-2 border-chrome-fg" />
          </span>
          Destination
        </span>
        {vehiclePosition && (
          <span className="flex items-center gap-2">
            <span aria-hidden className="flex w-3 justify-center">
              <span
                className={`size-[7px] rotate-45 ${
                  deviating ? "bg-status-attn" : "bg-chrome-signal"
                }`}
              />
            </span>
            {deviating ? "Vehicle (off route)" : "Vehicle"}
          </span>
        )}
      </div>
    </div>
  );
}
