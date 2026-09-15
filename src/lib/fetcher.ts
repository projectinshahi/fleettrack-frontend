export const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * A non-2xx HTTP response from the API.
 *
 * `apiFetch` throws this instead of returning the response, so a 4xx/5xx can never be
 * mistaken for a successful empty result ("No trips" when the real answer is 403).
 * Callers that need to react to a specific failure read `status`; callers that just
 * show a message read `message`, which carries the API's own text when it sent one.
 *
 * Only the status and the API's user-facing message are exposed — no headers, no token.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  /** Parsed JSON error body when the API sent one, else null (HTML/empty responses). */
  readonly body: unknown;

  constructor(
    status: number,
    statusText: string,
    message: string,
    body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/** True for an ApiError, optionally narrowed to a specific status. */
export function isApiError(error: unknown, status?: number): error is ApiError {
  return (
    error instanceof ApiError && (status === undefined || error.status === status)
  );
}

/**
 * Message to show the user for a failed call: the API's own text when it sent one,
 * otherwise `fallback`. A network failure (fetch rejects with "Failed to fetch") is
 * deliberately NOT surfaced verbatim — the caller's wording is friendlier.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return isApiError(error) && error.message ? error.message : fallback;
}

/**
 * Best-effort message for a failed response. Nest sends `{ message, error, statusCode }`,
 * where `message` is a string, or a string[] from the ValidationPipe. Anything else
 * (HTML error page, empty body, unreadable stream) falls back to the status line.
 */
async function readErrorMessage(response: Response): Promise<{
  message: string;
  body: unknown;
}> {
  const fallback = `Request failed (${response.status})`;

  let body: unknown = null;
  try {
    const text = await response.text();
    if (!text) return { message: fallback, body: null };
    try {
      body = JSON.parse(text);
    } catch {
      // Non-JSON error (proxy HTML page, plain text) — keep the status line as the
      // message rather than surfacing markup to the user.
      return { message: fallback, body: null };
    }
  } catch {
    return { message: fallback, body: null };
  }

  const raw = (body as { message?: unknown })?.message;
  if (typeof raw === "string" && raw.trim()) return { message: raw, body };
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return { message: raw.join(", "), body };
  }

  return { message: fallback, body };
}

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem("token");

  // FormData uploads must NOT carry a JSON Content-Type — the browser sets the
  // multipart boundary itself. Everything else (JSON requests) is unchanged.
  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),

      Authorization: token ? `Bearer ${token}` : "",

      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.clear();

    window.location.href = "/login";
  }

  // Reject every non-2xx centrally. `response.ok` covers 200–299, so 204 No Content
  // and other bodyless successes still return the Response untouched. A network
  // failure never reaches here — fetch itself rejects, and callers catch that the
  // same way they catch this.
  if (!response.ok) {
    const { message, body } = await readErrorMessage(response);
    throw new ApiError(response.status, response.statusText, message, body);
  }

  return response;
}
