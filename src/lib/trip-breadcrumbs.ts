import { TrailPoint } from "@/lib/gps-utils";

/**
 * Response for a trip's GPS breadcrumb history (route playback).
 *
 * Breadcrumbs are recorded server-side from the vehicle GPS feed while a trip is
 * active; the playback UI consumes this `TrailPoint[]` directly (see
 * use-trip-playback). Reuses the tracking `TrailPoint` shape — no new GPS types.
 */
export interface TripBreadcrumbsResponse {
  breadcrumbs: TrailPoint[];
}
