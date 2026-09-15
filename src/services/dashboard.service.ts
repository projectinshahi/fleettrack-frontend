import { apiFetch } from "@/lib/fetcher";

/* DASHBOARD STATS */
export async function getDashboardStats(clientId?: string) {
  const query = clientId
    ? `?clientId=${clientId}`
    : "";

  const response = await apiFetch(
    `/dashboard/stats${query}`
  );

  return response.json();
}

/* ACTIVE VEHICLES */
export async function getActiveVehicles(clientId?: string) {
  const query = clientId
    ? `?clientId=${clientId}`
    : "";

  const response = await apiFetch(
    `/dashboard/active-vehicles${query}`
  );

  return response.json();
}

/* TRIP SUMMARY (DSH-01.1) */
export async function getTripSummary(clientId?: string) {
  const query = clientId
    ? `?clientId=${clientId}`
    : "";

  const response = await apiFetch(
    `/dashboard/trip-summary${query}`
  );

  return response.json();
}

/* WEEKLY ACTIVITY (DSH-05) — trips scheduled to start on each of the last 7 days.
   The server owns the day bucketing (fixed timezone) and always returns 7 entries,
   oldest → newest, so the chart renders the response as-is. */
export async function getWeeklyActivity(clientId?: string) {
  const query = clientId
    ? `?clientId=${clientId}`
    : "";

  const response = await apiFetch(
    `/dashboard/weekly-activity${query}`
  );

  return response.json();
}

/* DELIVERY METRICS (DSH-04.1) */
export async function getDeliveryMetrics(clientId?: string) {
  const query = clientId
    ? `?clientId=${clientId}`
    : "";

  const response = await apiFetch(
    `/dashboard/delivery-metrics${query}`
  );

  return response.json();
}