// API base URL. The single source of truth lives in fetcher.ts (next to apiFetch);
// this module re-exports it so existing `@/lib/api` imports keep working.
export { API_URL } from "./fetcher";
