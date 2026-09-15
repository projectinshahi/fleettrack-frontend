/**
 * Save a fetch Response body as a downloaded file. Centralises the blob →
 * object-URL → anchor-click pattern so report/export features don't each reinvent
 * it (mirrors the existing vehicle PDF download).
 */
export async function downloadResponse(
  response: Response,
  filename: string,
): Promise<void> {
  downloadBlob(await response.blob(), filename);
}

/**
 * Save an in-memory Blob as a downloaded file.
 *
 * Same object-URL → anchor-click mechanics as `downloadResponse`, split out for exports
 * the browser builds locally (CSV) rather than fetching from the server. `downloadResponse`
 * now delegates here, so the DOM plumbing exists in exactly one place.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
