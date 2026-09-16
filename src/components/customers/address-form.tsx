"use client";

import { useState } from "react";
import { toast } from "sonner";

import { apiErrorMessage, apiFetch } from "@/lib/fetcher";
import { ADDRESS_KINDS, AddressKind, CustomerAddress } from "@/types/customer";
import { Button } from "@/components/ui/button";

interface Props {
  customerId: string;
  editAddress?: CustomerAddress | null;
  defaultKind?: AddressKind;
  onSaved: () => void;
  onCancel: () => void;
}

const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Add/edit a customer address (CUS-05 / CUS-06). Posts to the nested addresses
 * API and calls onSaved so the parent modal refetches (no page reload).
 */
export default function AddressForm({
  customerId,
  editAddress,
  defaultKind = "PICKUP",
  onSaved,
  onCancel,
}: Props) {
  const [kind, setKind] = useState<AddressKind>(
    editAddress?.kind || defaultKind,
  );
  const [label, setLabel] = useState(editAddress?.label || "");
  const [address, setAddress] = useState(editAddress?.address || "");
  const [latitude, setLatitude] = useState(
    editAddress?.latitude?.toString() || "",
  );
  const [longitude, setLongitude] = useState(
    editAddress?.longitude?.toString() || "",
  );
  const [isDefault, setIsDefault] = useState(editAddress?.isDefault || false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!editAddress;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim() || !address.trim()) {
      toast.error("Label and address are required");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `/customers/${customerId}/addresses/${editAddress.id}`
        : `/customers/${customerId}/addresses`;

      const res = await apiFetch(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({
          kind,
          label: label.trim(),
          address: address.trim(),
          latitude: latitude.trim() ? Number(latitude) : null,
          longitude: longitude.trim() ? Number(longitude) : null,
          isDefault,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "Address updated" : "Address added");
        onSaved();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      // apiFetch rejects on non-2xx — surface the API's message rather than a generic one.
      toast.error(apiErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
    >
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as AddressKind)}
        aria-label="Address type"
        className={inputClass}
      >
        {ADDRESS_KINDS.map((k) => (
          <option key={k} value={k}>
            {k.charAt(0) + k.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (e.g. Warehouse, Head Office)"
        aria-label="Label"
        className={inputClass}
      />

      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address"
        aria-label="Address"
        className={inputClass}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitude (optional)"
          aria-label="Latitude"
          inputMode="decimal"
          className={inputClass}
        />
        <input
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitude (optional)"
          aria-label="Longitude"
          inputMode="decimal"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
        />
        Set as default {kind.toLowerCase()} address
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <Button
          type="submit"
          isLoading={loading}
        >
          {isEdit ? "Update" : "Add"}
        </Button>
      </div>
    </form>
  );
}
