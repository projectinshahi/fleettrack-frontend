"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage, apiFetch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface AvailableVehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  providerName?: string | null;
}

interface Props {
  buttonText?: string;
  editUser?: Client | null;
  onSuccess?: () => void;
}

// Human-readable provider label (matches the vehicles table). Unknown → capitalized.
const PROVIDER_LABELS: Record<string, string> = {
  airotrack: "AiroTrack",
  transight: "Transight",
};
const providerLabel = (p: string) =>
  PROVIDER_LABELS[p] ?? (p === "other" ? "Other" : p.charAt(0).toUpperCase() + p.slice(1));

export default function ClientForm({
  buttonText = "Add Client",
  editUser,
  onSuccess,
}: Props) {
  const isEdit = !!editUser;

  const [name, setName] = useState(editUser?.name || "");
  const [email, setEmail] = useState(editUser?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(!isEdit);
  const [vehiclesError, setVehiclesError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load only currently-unassigned inventory (create mode). Backend enforces clientId=null.
  useEffect(() => {
    if (isEdit) return;
    let active = true;

    async function load() {
      try {
        setVehiclesLoading(true);
        setVehiclesError(false);
        const res = await apiFetch("/vehicles?assignment=unassigned");
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        if (active) setVehicles(data.vehicles || []);
      } catch (err) {
        console.error(err);
        if (active) setVehiclesError(true);
      } finally {
        if (active) setVehiclesLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isEdit]);

  const grouped = vehicles.reduce<Record<string, AvailableVehicle[]>>((acc, v) => {
    const key = v.providerName?.toLowerCase() || "other";
    (acc[key] ||= []).push(v);
    return acc;
  }, {});

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) return setFormError("Client name is required.");
    if (!email.trim()) return setFormError("Email / Username is required.");
    if (!isEdit && password.length < 6)
      return setFormError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = isEdit
        ? await apiFetch(`/clients/${editUser!.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name, email }),
          })
        : await apiFetch("/clients", {
            method: "POST",
            body: JSON.stringify({ name, email, password, vehicleIds: selectedIds }),
          });

      const data = await res.json();

      if (data.success) {
        toast.success(isEdit ? "Client updated" : "Client created");
        onSuccess?.();
      } else {
        setFormError(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      // apiFetch rejects on non-2xx, so this is where the backend message now arrives
      // (e.g. 409 "Already assigned to another client: …"). Keep showing it in the modal.
      setFormError(apiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Client Name"
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email / Username"
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />

      {!isEdit && (
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}

      {!isEdit && (
        <div className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">Vehicles</span>
            <span className="text-xs text-muted-foreground">
              Selected: {selectedIds.length}
            </span>
          </div>

          <div className="max-h-56 space-y-4 overflow-y-auto p-3">
            {vehiclesLoading ? (
              <p className="text-sm text-muted-foreground">Loading available vehicles…</p>
            ) : vehiclesError ? (
              <p className="text-sm text-destructive">Couldn&apos;t load vehicles.</p>
            ) : vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No unassigned vehicles available.
              </p>
            ) : (
              Object.entries(grouped).map(([key, list]) => (
                <div key={key}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {providerLabel(key)} ({list.length})
                  </p>

                  <div className="space-y-1">
                    {list.map((v) => (
                      <label
                        key={v.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(v.id)}
                          onChange={() => toggle(v.id)}
                          className="h-4 w-4 shrink-0 rounded border border-input accent-primary cursor-pointer"
                        />
                        <span className="font-medium">{v.vehicleNumber}</span>
                        <span className="text-muted-foreground">{v.vehicleName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" isLoading={loading} className="h-11 w-full">
        {buttonText}
      </Button>
    </form>
  );
}
