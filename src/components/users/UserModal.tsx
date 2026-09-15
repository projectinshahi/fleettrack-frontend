"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/lib/user-api";
import { apiErrorMessage } from "@/lib/fetcher";
import { User } from "./TypeUser";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

export default function UserModal({
  open,
  onClose,
  user,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting form state based on prop change
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      });
    } else {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "ADMIN",
      });
    }
  }, [user]);

  if (!open) return null;

  const isEdit = !!user;

  async function handleSubmit() {
    try {
      setLoading(true);

      if (isEdit) {
        // An empty password means "keep the current one" (the field's own placeholder). Sent
        // as "", it failed the API's MinLength(6) check, so every edit that did not also set
        // a new password was rejected with a 400.
        const { password, ...rest } = form;
        await updateUser(user.id, password ? form : rest);
      } else {
        await createUser(form);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      // apiFetch rejects on non-2xx. Previously a failed save fell through to
      // onSuccess() and showed a "User created" toast — now it reports the real
      // reason (e.g. 400 "Email already exists") and keeps the modal open.
      toast.error(apiErrorMessage(error, "Failed to save user"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        className="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-foreground shadow-lg max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <h2 id="user-modal-title" className="mb-5 section-title">
          {isEdit ? "Edit User" : "Add User"}
        </h2>

        <div className="space-y-4">
          <input
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <input
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
            type="password"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={
              isEdit
                ? "Leave empty to keep password"
                : "Password"
            }
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
          >
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-9 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            onClick={onClose}
          >
            Cancel
          </button>

          <Button type="submit" isLoading={loading} onClick={handleSubmit} className="h-9 px-4">
            {isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </div>
    </div>
  );
}