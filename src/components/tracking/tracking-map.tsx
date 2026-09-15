"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FLOAT_PANE,
  GoogleMap,
  OverlayViewF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { LocateFixed, Minus, Navigation2, Plus } from "lucide-react";
// haversineDistance is still needed for move/jump detection and animation duration;
// calculateBearing is deliberately no longer imported — the icon never rotates.
import { haversineDistance, isValidCoordinate } from "@/lib/gps-utils";
import VehiclePopupCard from "./vehicle-popup-card";
import { StatusCue } from "@/components/ui/status-chip";

/* -------------------------------------------------- */
/* TYPES                                              */
/* -------------------------------------------------- */

export interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  gpsDeviceId: string;
  driverName: string;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  /** Provider GPS fix time — the real "when did this vehicle last report". */
  lastProviderUpdate?: string | null;
  updatedAt: string;
  timestamp?: number;
  ignition?: boolean;
  batteryVoltage?: number;
  client?: {
    id: string;
    name: string;
  };
}

interface TrackingMapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  /** External "re-centre on the selection" pulse. The map also has its own (see
   *  MapControls / the popup card), so a caller that doesn't need one can omit it. */
  centerTrigger?: number;
  followMode?: boolean;
  /** Fired on a marker click. The map only ever SELECTS — it never deselects, so nothing
   *  the user does on the map can reset the caller's selection. Clearing it is an explicit
   *  action elsewhere (the vehicle list's "All Vehicles"), hence the `null` in the type. */
  onVehicleSelect?: (vehicle: Vehicle | null) => void;
  /** Allow the compact popup card over a clicked marker. /tracking opts in; the
   *  single-vehicle /tracking/[id] route keeps its own side panel instead. */
  showVehicleCard?: boolean;
}

/* -------------------------------------------------- */
/* CONSTANTS                                          */
/* -------------------------------------------------- */

const DEFAULT_LOCATION = { lat: 11.2588, lng: 75.7804 };
const DEFAULT_ZOOM = 8;

// Stable reference — an inline array would make useJsApiLoader reload the script.
const MAP_LIBRARIES: "marker"[] = ["marker"];

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  height: "100%",
  width: "100%",
};

// AdvancedMarkerElement requires a mapId. With a mapId present Google ignores the
// inline `styles` array (and warns) — POI/transit hiding must be done via Cloud
// styling on the mapId, so `styles` is intentionally omitted here.
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "greedy",
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: false,
  clickableIcons: false,
  mapId: "DEMO_MAP_ID",
};

/* -------------------------------------------------- */
/* MARKER ORIENTATION                                 */
/* -------------------------------------------------- */

/* The truck icon is deliberately NOT rotated.
 *
 * It used to be turned to the GPS bearing (derived from consecutive fixes), which made the
 * same truck appear upside-down heading south and sideways heading east/west — the asset is
 * drawn facing up, so any rotation reads as a broken icon rather than as direction. The
 * bearing/heading machinery that fed that transform (calculateBearing, shortestAngleDelta,
 * the per-vehicle heading refs and the rotate wrapper) has been removed rather than
 * neutralised, so nothing can start rotating the icon again by accident.
 *
 * Direction is not lost from the UI: the marker still animates ALONG its real path between
 * fixes, so movement direction is visible from the motion itself.
 */

/* -------------------------------------------------- */
/* MARKER MOVEMENT (RC6 / RC7 / RC15)                 */
/* -------------------------------------------------- */

/** Below this a position change is snapped directly (no animation). */
const MOVE_THRESHOLD_M = 1;
/** RC6: a single move beyond this is treated as a GPS spike and ignored… */
const MAX_JUMP_DISTANCE_M = 5000;
/** …unless it persists this many samples, then it's accepted as the new reality
 *  (so a genuine relocation can never leave the marker stuck forever). */
const MAX_CONSECUTIVE_REJECTS = 2;
/** RC7: animation duration scales with distance, then clamped to [min, max] ms. */
const ANIM_MS_PER_METER = 3;
const ANIM_MIN_MS = 400;
const ANIM_MAX_MS = 4000;

/* -------------------------------------------------- */
/* MARKER STACKING (RC14)                             */
/* -------------------------------------------------- */

/** Selected marker always renders above every base marker. */
const SELECTED_Z_INDEX = 1_000_000;
/** RC14: deterministic z from latitude so overlapping markers stack the same way on
 *  every render (further south → higher z → drawn on top), instead of all sharing
 *  z=1 and flickering when the DOM/insertion order changes. */
function baseZIndex(latitude: number): number {
  return Math.round((90 - latitude) * 1000);
}

/* -------------------------------------------------- */
/* INJECT PULSE KEYFRAMES                             */
/* -------------------------------------------------- */

if (typeof window !== "undefined") {
  const styleId = "ft-pulse-ring-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes pulse-ring {
        0%   { transform: scale(1);   opacity: 0.8; }
        80%  { transform: scale(1.8); opacity: 0;   }
        100% { transform: scale(1.8); opacity: 0;   }
      }

      /* MARKER. Google draws the basemap light in BOTH app themes, so these colours are
       * fixed rather than themed: the light-theme status hues, the only steps that clear
       * 3:1 against every default roadmap fill (worst case, water: moving 3.10, idle 3.08,
       * offline 4.03, selected 4.56). This DOM is built with innerHTML outside React, which
       * makes it the one documented place in the app that carries raw hex.
       *
       * State rides on the ring's STYLE as well as its colour (WCAG 1.4.1): solid for
       * moving, dashed for idle, dotted with a faded icon for offline. */
      .ft-marker {
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ft-marker--moving  { --ft-ring: #1A7F4B; }
      .ft-marker--idle    { --ft-ring: #9A6400; }
      .ft-marker--offline { --ft-ring: #B3261E; }

      .ft-marker-disc {
        box-sizing: border-box;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #FFFFFF;
        border: 3px solid var(--ft-ring);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .ft-marker--idle .ft-marker-disc    { border-style: dashed; }
      .ft-marker--offline .ft-marker-disc { border-style: dotted; }
      .ft-marker--offline .ft-marker-disc img { opacity: 0.45; }

      .ft-marker-pulse {
        position: absolute;
        top: -6px;
        left: -6px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 2px solid var(--ft-ring);
        animation: pulse-ring 1.5s ease-out infinite;
        pointer-events: none;
      }

      /* Selected: a second ring OUTSIDE the status ring, in the FleetTrack signal, with a
       * white gap between so the two never merge into one colour. It marks selection only;
       * the status ring underneath is unchanged. */
      [data-ft-selected] .ft-marker-disc {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px #FFFFFF, 0 0 0 5px #A3175E;
      }

      /* The pulse is an infinite animation, exactly what reduced motion asks us to drop.
       * Hidden rather than frozen: a still 52px ring would read as a selection ring. */
      @media (prefers-reduced-motion: reduce) {
        .ft-marker-pulse { display: none; }
      }

      /* Vehicle-number label shown while a pointer rests on the marker.
       *
       * Driven purely by :hover on the marker element rather than by JS mouse events, so
       * it works for ANY pointing device the browser reports as hovering — laptop trackpad,
       * desktop mouse, and a TV's remote/air-mouse cursor alike — with no device sniffing
       * and no extra listeners.
       *
       * pointer-events:none is what keeps it from stealing the marker's own click: the
       * label can never sit between the cursor and the marker, so gmp-click still fires
       * and the existing click behaviour is untouched.
       *
       * Sized in rem and readable from a distance for large displays; positioned above the
       * 40px marker so it does not cover the icon the user is aiming at.
       */
      .ft-marker-label {
        position: absolute;
        bottom: 48px;
        left: 50%;
        transform: translateX(-50%);
        padding: 3px 8px;
        border-radius: 6px;
        /* Map chrome tokens: the same fixed dark layer as the map controls and the popup,
         * with the registration set in the identifier face. */
        background: var(--chrome-bg);
        border: 1px solid var(--chrome-line);
        color: var(--chrome-fg);
        font-family: var(--font-mono);
        font-size: 0.8125rem;
        font-weight: 600;
        line-height: 1.2;
        letter-spacing: 0.02em;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 120ms ease;
        pointer-events: none;
      }

      .ft-marker:hover .ft-marker-label,
      .ft-marker:focus-visible .ft-marker-label {
        opacity: 1;
        visibility: visible;
      }

      /* A pointer-less device (touch-only phone/tablet) can never hover, so the label
       * would be dead weight there — tapping opens the popup card instead. */
      @media (hover: none) {
        .ft-marker-label { display: none; }
      }
    `;
    document.head.appendChild(style);
  }
}

/* -------------------------------------------------- */
/* VEHICLE MARKER                                     */
/* -------------------------------------------------- */

interface VehicleMarkerProps {
  map: google.maps.Map | null;
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}

function VehicleMarker({
  map,
  vehicle,
  isSelected,
  onClick,
}: VehicleMarkerProps) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const animationFrameRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const prevPos = useRef<{ lat: number; lng: number }>({
    lat: vehicle.latitude,
    lng: vehicle.longitude,
  });
  // RC7: arrival time of the last accepted position (for interval-based duration).
  const prevUpdateTimeRef = useRef<number | null>(null);
  // RC6: consecutive rejected-jump counter (recovery guard).
  const rejectCountRef = useRef(0);
  // RC8: keep the latest onClick in a ref so the click listener (bound once) never
  // fires a stale closure — without re-subscribing on every render.
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  // RC15: stop any in-flight animation so a running frame can't overwrite a
  // subsequent direct position set (animation fighting).
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Smooth animated move toward new position
  const animateMarkerTo = useCallback(
    (
      marker: google.maps.marker.AdvancedMarkerElement,
      destination: { lat: number; lng: number },
      duration: number,
    ) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const start = marker.position;
      if (!start) return;

      const startLat =
        typeof start.lat === "function"
          ? (start as any).lat()
          : (start.lat ?? destination.lat);

      const startLng =
        typeof start.lng === "function"
          ? (start as any).lng()
          : (start.lng ?? destination.lng);

      const destLat = destination.lat;
      const destLng = destination.lng;

      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const lat = startLat + (destLat - startLat) * ease;
        const lng = startLng + (destLng - startLng) * ease;

        marker.position = { lat, lng };

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    [],
  );

  // Create the AdvancedMarkerElement. This component is only mounted once the parent
  // confirms the map is authorized and rendered (the `tilesloaded` gate), so `map` is
  // always a live, authorized instance here — the marker-library precondition below is
  // a final belt-and-suspenders check. This is a real readiness gate, NOT a try/catch:
  // markers never construct against a dead map, so the internal marker.js crashes
  // ("reading 'keys'" / IntersectionObserver.observe on undefined) can't occur.
  useEffect(() => {
    if (!map || !google.maps.marker?.AdvancedMarkerElement) return;

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "40px";
    container.style.height = "40px";
    container.style.cursor = "pointer";
    elementRef.current = container;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: vehicle.latitude, lng: vehicle.longitude },
      content: container,
      // Native hover tooltip showing the vehicle number (also the marker's aria-label).
      title: vehicle.vehicleNumber,
      // Required for `gmp-click`. The legacy MVC "click" event enabled itself as soon as
      // a listener was attached; the DOM event does not — without this, clicks are dead.
      gmpClickable: true,
    });

    markerRef.current = marker;

    // AdvancedMarkerElement extends HTMLElement, so this is a real DOM event. Google
    // deprecated `addListener("click")` on it ("[gmp-advanced-marker]: Please use
    // addEventListener('gmp-click', ...)"). Named handler so the cleanup below removes
    // this exact reference; the effect is keyed on [map], so it binds once per map and
    // a re-render cannot stack duplicate listeners (onClick is read via onClickRef).
    const handleClick = () => {
      onClickRef.current();
    };
    marker.addEventListener("gmp-click", handleClick);

    return () => {
      marker.removeEventListener("gmp-click", handleClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      marker.map = null;
    };
  }, [map]);

  // Smooth slide when position changes
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const newLat = vehicle.latitude;
    const newLng = vehicle.longitude;

    if (!isValidCoordinate(newLat, newLng)) return;

    const { lat: prevLat, lng: prevLng } = prevPos.current;
    const dist = haversineDistance(prevLat, prevLng, newLat, newLng);

    // RC6: ignore a physically impossible jump (GPS spike) and keep the last valid
    // position. A lone spike is skipped; if it persists past MAX_CONSECUTIVE_REJECTS
    // it is accepted as the new reality, so the marker can never get stuck forever.
    if (dist > MAX_JUMP_DISTANCE_M) {
      if (rejectCountRef.current < MAX_CONSECUTIVE_REJECTS) {
        rejectCountRef.current += 1;
        return;
      }
    }
    rejectCountRef.current = 0;

    // RC7: real gap since the last accepted position.
    const now = performance.now();
    const intervalMs =
      prevUpdateTimeRef.current !== null ? now - prevUpdateTimeRef.current : null;
    prevUpdateTimeRef.current = now;

    if (dist > MOVE_THRESHOLD_M) {
      // RC7: duration scales with distance (consistent visual speed), clamped, and
      // capped by the update interval so the next update doesn't cut it short.
      let duration = Math.min(
        Math.max(dist * ANIM_MS_PER_METER, ANIM_MIN_MS),
        ANIM_MAX_MS,
      );
      // Cap to the interval but keep a small non-zero floor (avoids a 0ms/NaN step).
      if (intervalMs !== null) duration = Math.min(duration, Math.max(intervalMs, 50));

      animateMarkerTo(marker, { lat: newLat, lng: newLng }, duration);
      prevPos.current = { lat: newLat, lng: newLng };
    } else {
      // RC15: a tiny move snaps directly — cancel any in-flight animation first so a
      // running frame can't overwrite this position (animation fighting).
      stopAnimation();
      marker.position = { lat: newLat, lng: newLng };
      prevPos.current = { lat: newLat, lng: newLng };
    }
  }, [vehicle.latitude, vehicle.longitude, animateMarkerTo, stopAnimation]);

  // RC14: deterministic stacking — selected always on top, otherwise ordered by
  // latitude so overlapping markers keep a stable draw order (no z=1 flicker).
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.zIndex = isSelected ? SELECTED_Z_INDEX : baseZIndex(vehicle.latitude);
    // Styling hook for the selection ring. It sits on the persistent container rather than
    // inside the innerHTML below, so a status rebuild can never drop it.
    elementRef.current?.toggleAttribute("data-ft-selected", isSelected);
  }, [isSelected, vehicle.latitude]);

  // RC5: rebuild the marker's DOM only when status changes (color / pulse). Heading
  // ticks no longer trigger this innerHTML rebuild — they only mutate the transform.
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Branch order unchanged: MOVING, then IDLE, and every other status draws as offline.
    // Each state's ring colour and ring style live in the injected stylesheet above.
    const state =
      vehicle.status === "MOVING"
        ? "moving"
        : vehicle.status === "IDLE"
          ? "idle"
          : "offline";

    const pulseHtml =
      state === "moving" ? `<span class="ft-marker-pulse"></span>` : "";

    // NO transform on this wrapper — the icon's orientation is fixed (see MARKER
    // ORIENTATION above). The label is a sibling of the icon, so it is unaffected by
    // anything applied to the icon itself and always reads horizontally.
    el.innerHTML = `
      <div class="ft-marker ft-marker--${state}">
        ${pulseHtml}
        <div class="ft-marker-disc">
          <img src="/cargo-truck.png" alt="" style="width:22px;height:22px;object-fit:contain;" />
        </div>
        <span class="ft-marker-label">${vehicle.vehicleNumber}</span>
      </div>
    `;
  }, [vehicle.status, vehicle.vehicleNumber]);

  return null;
}

/* -------------------------------------------------- */
/* LIVE STATUS CARD                                   */
/* -------------------------------------------------- */

interface LiveStatusCardProps {
  vehicles: Vehicle[];
}

// Stays pinned bottom-left. It used to jump up to bottom-[300px] on mobile to clear the
// selected-vehicle bottom sheet; the sheet is gone, so the position is now constant.
// bottom-8, like the map controls, keeps Google's logo and attribution strip uncovered.
function LiveStatusCard({ vehicles }: LiveStatusCardProps) {
  const moving = vehicles.filter((v) => v.status === "MOVING").length;
  const idle = vehicles.filter((v) => v.status === "IDLE").length;

  // Map chrome: fixed dark in both themes, border-led, no shadow. The counts stay in ink with
  // tabular figures (they tick with live updates); each status rides on the cue by its label.
  return (
    <div className="absolute bottom-8 left-3 z-[40] select-none rounded-lg border border-chrome-line bg-chrome-bg px-4 py-2.5 text-chrome-fg md:left-4">
      <div className="flex items-center gap-4">
        <div>
          <p className="font-heading text-base font-semibold leading-none tabular-nums">
            {moving}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-chrome-fg-dim">
            <StatusCue tone="ok" className="text-status-ok" />
            Moving
          </p>
        </div>

        <div className="h-8 w-px bg-chrome-line" />

        <div>
          <p className="font-heading text-base font-semibold leading-none tabular-nums">
            {idle}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-chrome-fg-dim">
            <StatusCue tone="attn" className="text-status-attn" />
            Idle
          </p>
        </div>

        <div className="h-8 w-px bg-chrome-line" />

        <div>
          <p className="font-heading text-base font-semibold leading-none tabular-nums">
            {vehicles.length}
          </p>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-chrome-fg-dim">
            Total
          </p>
        </div>
      </div>
    </div>
  );
}

interface MapControlsProps {
  onLocate: () => void;
  followMode: boolean;
  onToggleFollow: () => void;
  mapRef: React.RefObject<google.maps.Map | null>;
}

// The same chrome layer. The focus ring is drawn INSIDE each control, so it is measured
// against the chrome fill it sits on (6.28:1) instead of whatever tile is under the control.
const MAP_CONTROL =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset";
const MAP_CONTROL_IDLE =
  "border-chrome-line bg-chrome-bg text-chrome-fg hover:bg-chrome-bg-2 focus-visible:ring-chrome-signal";

function MapControls({
  onLocate,
  followMode,
  onToggleFollow,
  mapRef,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-8 right-3 z-[40] flex flex-col gap-1.5 md:right-4">
      <button
        onClick={() =>
          mapRef.current?.setZoom(
            (mapRef.current.getZoom() ?? DEFAULT_ZOOM) + 1,
          )
        }
        className={`${MAP_CONTROL} ${MAP_CONTROL_IDLE}`}
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>

      <button
        onClick={() =>
          mapRef.current?.setZoom(
            (mapRef.current.getZoom() ?? DEFAULT_ZOOM) - 1,
          )
        }
        className={`${MAP_CONTROL} ${MAP_CONTROL_IDLE}`}
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        onClick={onLocate}
        className={`${MAP_CONTROL} ${MAP_CONTROL_IDLE}`}
        title="Center on vehicle"
      >
        <LocateFixed className="h-4 w-4" />
      </button>

      <button
        onClick={onToggleFollow}
        className={`${MAP_CONTROL} ${
          followMode
            ? "border-chrome-signal bg-chrome-signal text-chrome-bg hover:bg-chrome-signal/90 focus-visible:ring-chrome-bg"
            : MAP_CONTROL_IDLE
        }`}
        title={
          followMode ? "Following vehicle (click to stop)" : "Follow vehicle"
        }
      >
        {/* Filled while following, outlined when not, so the state survives without colour. */}
        <Navigation2 className={`h-4 w-4 ${followMode ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}

/* -------------------------------------------------- */
/* MAIN COMPONENT                                     */
/* -------------------------------------------------- */

export default function TrackingMap({
  vehicles,
  selectedVehicle,
  centerTrigger = 0,
  followMode: externalFollowMode = false,
  onVehicleSelect,
  showVehicleCard = false,
}: TrackingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    id: "google-map-script",
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  // Map READINESS gate. `onLoad` fires with a map instance even when authorization
  // later fails, so it is NOT a safe signal to attach AdvancedMarkerElements. The
  // map's `tilesloaded` event fires only once the map is authorized AND has actually
  // rendered — the definitive "safe to create markers" signal. On a
  // RefererNotAllowedMapError the tiles never render, so this stays false and markers
  // are never constructed against a dead map (which is what throws inside marker.js).
  const [mapReady, setMapReady] = useState(false);
  const [internalFollowMode, setInternalFollowMode] = useState(false);
  const [localCenterTrigger, setLocalCenterTrigger] = useState(0);
  const followMode = externalFollowMode || internalFollowMode;

  // useJsApiLoader's `loadError` only covers SCRIPT-load failures. An invalid key or a
  // referrer that isn't authorized (RefererNotAllowedMapError) loads the script fine
  // but fails auth AFTER — Google signals that via the global `window.gm_authFailure`.
  // Catch it so the map degrades to the fallback UI instead of rendering a dead map.
  const [authFailed, setAuthFailed] = useState(false);
  useEffect(() => {
    const w = window as unknown as { gm_authFailure?: () => void };
    w.gm_authFailure = () => setAuthFailed(true);
    return () => {
      w.gm_authFailure = undefined;
    };
  }, []);

  // Google Maps instance ref
  const mapRef = useRef<google.maps.Map | null>(null);

  const validVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.latitude != null &&
          v.longitude != null &&
          isValidCoordinate(v.latitude, v.longitude),
      ),
    [vehicles],
  );

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
    setMapReady(false);
  }, []);

  const fitAllVehicles = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || validVehicles.length === 0) return;

    if (validVehicles.length === 1) {
      mapInstance.setCenter({
        lat: validVehicles[0].latitude,
        lng: validVehicles[0].longitude,
      });
      mapInstance.setZoom(15);
    } else {
      const bounds = new google.maps.LatLngBounds();
      validVehicles.forEach((v) =>
        bounds.extend({ lat: v.latitude, lng: v.longitude }),
      );
      mapInstance.fitBounds(bounds, 80);
    }
  }, [validVehicles]);

  /* ------------------------------------------------ */
  /* FIT ALL VEHICLES on initial map load             */
  /* ------------------------------------------------ */

  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      mapRef.current = mapInstance;
      setMap(mapInstance);

      // Mark the map ready only after tiles actually render — proof that auth
      // succeeded. This gates marker creation (see the markers block below), so a
      // map left dead by an auth failure never gets AdvancedMarkerElements attached.
      google.maps.event.addListenerOnce(mapInstance, "tilesloaded", () => {
        setMapReady(true);
      });

      setTimeout(() => {
        if (!selectedVehicle) {
          fitAllVehicles();
        }
      }, 100);
    },
    [selectedVehicle, fitAllVehicles],
  );

  const effectiveCenterTrigger = centerTrigger + localCenterTrigger;
  const lastCenterTriggerRef = useRef(effectiveCenterTrigger);

  useEffect(() => {
    if (effectiveCenterTrigger === lastCenterTriggerRef.current) return;
    lastCenterTriggerRef.current = effectiveCenterTrigger;

    if (!selectedVehicle) return;
    if (!isValidCoordinate(selectedVehicle.latitude, selectedVehicle.longitude))
      return;
    if (!mapRef.current) return;

    mapRef.current.panTo({
      lat: selectedVehicle.latitude,
      lng: selectedVehicle.longitude,
    });
    mapRef.current.setZoom(16);
  }, [effectiveCenterTrigger, selectedVehicle]);
  const prevSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prevId = prevSelectedIdRef.current;
    const currId = selectedVehicle?.id ?? null;

    prevSelectedIdRef.current = currId;

    if (!mapRef.current) return;

    if (currId !== null) {
      // A vehicle was selected → pan & zoom in
      if (
        !isValidCoordinate(
          selectedVehicle!.latitude,
          selectedVehicle!.longitude,
        )
      )
        return;
      mapRef.current.panTo({
        lat: selectedVehicle!.latitude,
        lng: selectedVehicle!.longitude,
      });
      mapRef.current.setZoom(16);
    } else if (prevId !== null) {
      fitAllVehicles();
    }
  }, [selectedVehicle?.id]);

  useEffect(() => {
    if (!followMode || !selectedVehicle) return;
    if (!isValidCoordinate(selectedVehicle.latitude, selectedVehicle.longitude))
      return;
    if (!mapRef.current) return;

    mapRef.current.panTo({
      lat: selectedVehicle.latitude,
      lng: selectedVehicle.longitude,
    });
  }, [
    followMode,
    selectedVehicle,
    selectedVehicle?.latitude,
    selectedVehicle?.longitude,
  ]);

  // The per-vehicle heading derivation that used to live here has been removed along with
  // the rotating marker: nothing consumes a bearing any more, so computing one every render
  // (and carrying headingsRef / prevPositionsRef across commits to do it) was pure dead
  // weight. Marker movement between fixes is handled inside VehicleMarker itself.

  const handleDragStart = useCallback(() => {
    setInternalFollowMode(false);
  }, []);

  // Which vehicle the popup card is open FOR — deliberately separate from which vehicle is
  // selected. Selection is owned by the page (the list sets it too); the card is a
  // map-local concern that only a marker click opens. Keeping them apart is what lets the
  // card close without disturbing the selection, and stops a list selection from popping
  // the card open. Storing the id (not a boolean) also means picking a different vehicle
  // from the list hides a stale card for free — no extra effect to keep them in sync.
  const [cardVehicleId, setCardVehicleId] = useState<string | null>(null);
  const cardOpen = cardVehicleId !== null && cardVehicleId === selectedVehicle?.id;

  // A marker click also reaches the map's own click handler in some builds, which would
  // close the card in the same tick it was opened. Recording the marker click and ignoring
  // a map click that lands right behind it makes the order irrelevant.
  const lastMarkerClickRef = useRef(0);

  // The ONLY thing that opens the card. It still selects too, so clicking an unselected
  // marker both focuses that vehicle and shows its details in one action.
  const handleMarkerClick = useCallback(
    (vehicle: Vehicle) => {
      lastMarkerClickRef.current = performance.now();
      onVehicleSelect?.(vehicle);
      setCardVehicleId(vehicle.id);
    },
    [onVehicleSelect],
  );

  // Clicking empty map dismisses the card ONLY. It used to call onVehicleSelect(null),
  // which cleared the selection and sent the map back to fitAllVehicles — the selected
  // vehicle must survive both this and the card's own close button. "Show all" stays an
  // explicit action via the vehicle list.
  const handleMapClick = useCallback(() => {
    if (performance.now() - lastMarkerClickRef.current < 300) return;
    setCardVehicleId(null);
  }, []);

  if (loadError || authFailed) {
    return (
      <div className="relative h-full min-h-[300px] md:min-h-[350px] w-full overflow-hidden flex flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Unable to load the map
        </p>
        <p className="text-xs text-muted-foreground">
          {authFailed
            ? "The map could not be authorized for this site."
            : "Check your internet connection and try again."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 cursor-pointer rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative h-full min-h-[300px] md:min-h-[350px] w-full overflow-hidden flex items-center justify-center bg-muted">
        <span className="text-muted-foreground text-sm">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[300px] md:min-h-[350px] w-full overflow-hidden">
      {/* LIVE BADGE — map chrome. Live is the FleetTrack signal: magenta with the diamond
          cue, never the green that means MOVING. */}
      <div className="absolute right-4 top-4 z-[40] flex items-center gap-2 rounded-lg border border-chrome-line bg-chrome-bg px-3 py-1.5">
        <StatusCue tone="signal" className="text-chrome-signal" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-chrome-fg">
          Live Tracking
        </span>
      </div>

      {/* STATUS CARD */}
      <LiveStatusCard vehicles={vehicles} />

      {/* MAP CONTROLS (outside GoogleMap so they remain above the map) */}
      <MapControls
        onLocate={() => setLocalCenterTrigger((prev) => prev + 1)}
        followMode={followMode}
        onToggleFollow={() => setInternalFollowMode((v) => !v)}
        mapRef={mapRef}
      />

      {/* GOOGLE MAP */}
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_LOCATION}
        zoom={DEFAULT_ZOOM}
        options={MAP_OPTIONS}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        onDragStart={handleDragStart}
        onClick={handleMapClick}
      >
        {/* VEHICLE MARKERS — gated on mapReady (tilesloaded) so they are only ever
            created against an authorized, fully-rendered map. Selecting a vehicle used
            to filter this list down to the selection alone; every marker now stays drawn
            so a second marker is there to click when switching vehicles. The selection
            reads through z-index (SELECTED_Z_INDEX) and the popup card below. */}
        {map &&
          mapReady &&
          validVehicles.map((vehicle) => (
            <VehicleMarker
              key={vehicle.id}
              map={map}
              vehicle={vehicle}
              isSelected={selectedVehicle?.id === vehicle.id}
              onClick={() => handleMarkerClick(vehicle)}
            />
          ))}

        {/* SELECTED-VEHICLE POPUP — anchored to the marker's own LatLng, so OverlayView
            keeps it glued to the vehicle through pan, zoom and live position updates
            rather than to a fixed screen corner. Gated on `cardOpen`, NOT on
            `selectedVehicle` alone: a vehicle picked from the list is selected and
            focused, but shows no card until its marker is clicked. */}
        {showVehicleCard &&
          cardOpen &&
          mapReady &&
          selectedVehicle &&
          isValidCoordinate(
            selectedVehicle.latitude,
            selectedVehicle.longitude,
          ) && (
            <OverlayViewF
              position={{
                lat: selectedVehicle.latitude,
                lng: selectedVehicle.longitude,
              }}
              mapPaneName={FLOAT_PANE}
              // Centre the card on the marker and lift it clear of it. The marker is anchored at
              // its bottom edge, so it rises 40px above this point and its selection ring 5px
              // more; at the old 30px the card sat over the very ring it describes.
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height - 56,
              })}
            >
              <VehiclePopupCard
                vehicle={selectedVehicle}
                onCenterMap={() => setLocalCenterTrigger((prev) => prev + 1)}
                // Closes the card and NOTHING else — the vehicle stays selected and the
                // map stays focused on it. This used to clear the selection, which is
                // what snapped the map back to the all-vehicles view.
                onClose={() => setCardVehicleId(null)}
              />
            </OverlayViewF>
          )}
      </GoogleMap>
    </div>
  );
}
