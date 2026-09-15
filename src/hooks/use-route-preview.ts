"use client";

import { useCallback, useState } from "react";

import { previewTripRoute } from "@/services/trip.service";
import { RoutePoint } from "@/types/trip";

/**
 * On-demand route preview for the creation modal: geocodes draft addresses
 * (pickup, stops, destination) through the service and returns ordered points.
 */
export function useRoutePreview() {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async (input: { origin: string; destination: string; stops: string[] }) => {
      try {
        setLoading(true);
        const res = await previewTripRoute(input);
        setPoints(res.points);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => setPoints([]), []);

  return { points, loading, generate, clear };
}
