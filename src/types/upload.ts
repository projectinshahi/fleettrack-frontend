/**
 * Uploaded file (shared upload infrastructure), API-shaped. Provider-agnostic: `url` is
 * an API-relative path the frontend loads with its bearer token (files are never public);
 * `category` says what the file is (a trip cost receipt, POD photo/signature).
 */
export type FileCategory = "RECEIPT" | "POD_PHOTO" | "POD_SIGNATURE";

export interface FileAsset {
  id: string;
  category: FileCategory;
  /**
   * TCM-03.2 — for a RECEIPT, the cost component it's attached to (UPPERCASE enum value,
   * e.g. "FUEL"); null for POD media and general/trip-level receipts.
   */
  costComponent: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  tripId: string;
  /** API-relative streaming path, e.g. /uploads/file/<key> — fetched with auth. */
  url: string;
  createdAt: string;
}
