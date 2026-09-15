import { apiFetch } from "./fetcher";

// Routes through apiFetch so every call carries the JWT (Authorization: Bearer)
// and gets the shared 401 handling. Raw fetch here sent no token, so the
// admin-guarded /users endpoint answered 401 and the page threw on load.
export async function getUsers() {
  const res = await apiFetch("/users", { cache: "no-store" });

  if (!res.ok) throw new Error("Failed to fetch users");

  return res.json();
}

export async function createUser(data: Record<string, unknown>) {
  const res = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const res = await apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deleteUser(id: string) {
  const res = await apiFetch(`/users/${id}`, {
    method: "DELETE",
  });

  return res.json();
}