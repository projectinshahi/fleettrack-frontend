"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getTripBreadcrumbs } from "@/services/trip.service";
import { TrailPoint } from "@/lib/gps-utils";
import { GeoPoint } from "@/types/trip";

/** Milliseconds between auto-advance steps during playback. */
const STEP_MS = 220;

/**
 * Loads a completed trip's breadcrumb trail and drives playback: a scrubbable
 * index, play/pause with auto-advance, and the derived current point + travelled
 * trail. Goes through the service only; components consume this hook.
 */
export function useTripPlayback(tripId: string) {
  const [breadcrumbs, setBreadcrumbs] = useState<TrailPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load breadcrumbs — inlined (not a shared callback) to satisfy the
  // no-setState-in-effect rule, mirroring the other trip hooks.
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setIndex(0);
        setIsPlaying(false);
        const res = await getTripBreadcrumbs(tripId);
        setBreadcrumbs(res.breadcrumbs);
      } catch (err) {
        console.log(err);
        setBreadcrumbs([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId]);

  // Auto-advance while playing. setState lives in the interval callback (async),
  // not the effect body, so the no-setState-in-effect rule is satisfied. indexRef
  // avoids a stale read without re-subscribing the timer on every step.
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (!isPlaying || breadcrumbs.length < 2) return;

    const timer = setInterval(() => {
      const next = indexRef.current + 1;
      if (next >= breadcrumbs.length - 1) {
        setIndex(breadcrumbs.length - 1);
        setIsPlaying(false);
      } else {
        setIndex(next);
      }
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [isPlaying, breadcrumbs.length]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    // Starting — restart from the beginning if parked at the end.
    setIndex((i) => (i >= breadcrumbs.length - 1 ? 0 : i));
    setIsPlaying(true);
  }, [isPlaying, breadcrumbs.length]);

  const seek = useCallback((i: number) => {
    setIsPlaying(false);
    setIndex(i);
  }, []);

  const current: TrailPoint | null = breadcrumbs[index] ?? null;
  const trail: GeoPoint[] = breadcrumbs
    .slice(0, index + 1)
    .map((p) => ({ lat: p.lat, lng: p.lng }));

  return {
    breadcrumbs,
    loading,
    index,
    isPlaying,
    current,
    trail,
    toggle,
    seek,
  };
}
