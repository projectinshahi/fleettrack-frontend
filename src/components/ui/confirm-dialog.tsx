"use client";

import { useRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  loadingLabel?: string;
  /** Confirm-button colour: "destructive" (default, deletes) or "primary" (approvals). */
  confirmVariant?: "primary" | "destructive";
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Shared confirmation dialog — the single implementation behind the former
 * DeleteClientDialog / DeleteCustomerDialog / users DeleteConfirmModal. Open/close, the
 * loading state and confirm/cancel are unchanged. It sits on the Radix Dialog primitive for
 * keyboard handling only: focus moves in and is kept inside, Escape cancels (not while the
 * action is running, when Cancel is disabled too), and focus returns to the opener. A click
 * on the backdrop still does nothing, as before.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  confirmVariant = "destructive",
  loading,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  // Radix only returns focus to its own Dialog.Trigger, and this dialog is opened from
  // outside, so the opener is remembered on open and refocused on close.
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
          <DialogPrimitive.Content
            aria-modal="true"
            // With no description, say so (Radix warns otherwise); with one, Radix links it.
            {...(description ? {} : { "aria-describedby": undefined })}
            onPointerDownOutside={(e) => e.preventDefault()}
            onOpenAutoFocus={() => {
              openerRef.current = document.activeElement as HTMLElement | null;
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              openerRef.current?.focus();
            }}
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg max-h-[calc(100dvh-2rem)] overflow-y-auto outline-none"
          >
            <DialogPrimitive.Title className="section-title">
              {title}
            </DialogPrimitive.Title>

            {description && (
              <DialogPrimitive.Description asChild>
                <div className="mt-3 text-sm text-muted-foreground">{description}</div>
              </DialogPrimitive.Description>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-70 ${
                  confirmVariant === "primary"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                }`}
              >
                {loading ? loadingLabel : confirmLabel}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
