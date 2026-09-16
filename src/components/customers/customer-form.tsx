"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage, apiFetch } from "@/lib/fetcher";
import { Customer, CUSTOMER_TYPES, CustomerType } from "@/types/customer";
import { Button } from "@/components/ui/button";

interface Props {
  buttonText?: string;
  editCustomer?: Customer | null;
  onSuccess?: () => void;
}

const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
const sectionLabel =
  "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

/**
 * Create/edit a customer (CUS-01/02 + CUS-03.1 contact, CUS-04.1 tax, CUS-08.2
 * notes). Manual form that POST/PATCHes to the customers API — mirrors client-form
 * (reload on success). New fields are optional; only name + type are required.
 */
export default function CustomerForm({
  buttonText = "Add Customer",
  editCustomer,
  onSuccess,
}: Props) {
  const [name, setName] = useState(editCustomer?.name || "");
  const [type, setType] = useState<CustomerType>(
    editCustomer?.type || "SHIPPER",
  );
  const [company, setCompany] = useState(editCustomer?.company || "");
  const [contactPerson, setContactPerson] = useState(
    editCustomer?.contactPerson || "",
  );
  const [email, setEmail] = useState(editCustomer?.email || "");
  const [phone, setPhone] = useState(editCustomer?.phone || "");
  const [address, setAddress] = useState(editCustomer?.address || "");
  const [taxId, setTaxId] = useState(editCustomer?.taxId || "");
  const [registrationNumber, setRegistrationNumber] = useState(
    editCustomer?.registrationNumber || "",
  );
  const [notes, setNotes] = useState(editCustomer?.notes || "");
  const [loading, setLoading] = useState(false);

  const isEdit = !!editCustomer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setLoading(true);

    try {
      // Use the shared apiFetch (like the rest of the customer module) so auth headers
      // and 401 handling (redirect to login on an expired token) are centralised —
      // instead of a raw fetch that dead-ends on an expired session.
      const endpoint = isEdit
        ? `/customers/${editCustomer.id}`
        : `/customers`;

      const response = await apiFetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          type,
          company: company.trim() || null,
          contactPerson: contactPerson.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          taxId: taxId.trim() || null,
          registrationNumber: registrationNumber.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEdit ? "Customer updated" : "Customer created");
        onSuccess?.();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      // apiFetch rejects on non-2xx, so a validation/permission failure lands here with
      // the API's own message instead of being read off the error body as a "response".
      console.error(error);
      toast.error(
        apiErrorMessage(error, "Something went wrong. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Customer Name"
        aria-label="Customer name"
        className={inputClass}
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value as CustomerType)}
        aria-label="Customer type"
        className={inputClass}
      >
        {CUSTOMER_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      {/* Contact (CUS-03.1) */}
      <p className={sectionLabel}>Contact</p>

      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company (optional)"
        aria-label="Company"
        className={inputClass}
      />

      <input
        value={contactPerson}
        onChange={(e) => setContactPerson(e.target.value)}
        placeholder="Contact person (optional)"
        aria-label="Contact person"
        className={inputClass}
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        aria-label="Email"
        className={inputClass}
      />

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        aria-label="Phone"
        className={inputClass}
      />

      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address (optional)"
        aria-label="Address"
        className={inputClass}
      />

      {/* Tax / registration (CUS-04.1) */}
      <p className={sectionLabel}>Tax / Registration</p>

      <input
        value={taxId}
        onChange={(e) => setTaxId(e.target.value)}
        placeholder="Tax ID (optional)"
        aria-label="Tax ID"
        className={inputClass}
      />

      <input
        value={registrationNumber}
        onChange={(e) => setRegistrationNumber(e.target.value)}
        placeholder="Registration number (optional)"
        aria-label="Registration number"
        className={inputClass}
      />

      {/* Notes (CUS-08.2) */}
      <p className={sectionLabel}>Notes</p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Notes (optional)"
        aria-label="Notes"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />

      <Button
        type="submit"
        isLoading={loading}
        className="w-full"
      >
        {buttonText}
      </Button>
    </form>
  );
}
