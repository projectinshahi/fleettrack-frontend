import { apiFetch } from "@/lib/fetcher";
import { FileAsset, FileCategory } from "@/types/upload";

/**
 * Shared upload service. Talks to the domain-agnostic /uploads API — the same endpoints
 * back trip-cost receipts and (later) POD media, discriminated only by `category`.
 * Files are served behind JWT, so previews are loaded as authenticated blobs → object
 * URLs (never a public <img src> to the API).
 *
 *   API: POST   /uploads                 (multipart: file + category + tripId)
 *        GET    /uploads?tripId=&category=
 *        GET    /uploads/file/:key       (authenticated stream)
 *        DELETE /uploads/:id
 */
export async function listFiles(
  tripId: string,
  category?: FileCategory,
  costComponent?: string,
): Promise<FileAsset[]> {
  const params = new URLSearchParams({ tripId });
  if (category) params.set("category", category);
  if (costComponent) params.set("costComponent", costComponent); // TCM-03.2
  const res = await apiFetch(`/uploads?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.files ?? [];
}

export async function uploadFile(params: {
  tripId: string;
  category: FileCategory;
  /** TCM-03.2 — cost component for a per-line receipt (UPPERCASE enum value). */
  costComponent?: string;
  file: File;
}): Promise<Response> {
  const form = new FormData();
  form.append("file", params.file);
  form.append("tripId", params.tripId);
  form.append("category", params.category);
  if (params.costComponent) form.append("costComponent", params.costComponent);
  return apiFetch(`/uploads`, { method: "POST", body: form });
}

export async function deleteFile(id: string): Promise<Response> {
  return apiFetch(`/uploads/${id}`, { method: "DELETE" });
}

/**
 * Fetch a file's bytes with the bearer token and return an object URL for inline
 * preview. The caller owns the object URL and must revoke it when done.
 */
export async function fetchFileObjectUrl(file: FileAsset): Promise<string> {
  const res = await apiFetch(file.url);
  if (!res.ok) throw new Error("Failed to load file");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
