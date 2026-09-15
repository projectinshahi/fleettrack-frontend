"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadFile } from "@/services/upload.service";
import { FileCategory } from "@/types/upload";

/** Mirrors the backend UPLOAD_MAX_BYTES + UPLOAD_ALLOWED_MIME defaults. */
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

interface Props {
  tripId: string;
  category: FileCategory;
  /** TCM-03.2 — optional cost component for a per-line receipt (UPPERCASE enum value). */
  costComponent?: string;
  /** Called after a successful upload so the gallery can refresh. */
  onUploaded: () => void;
}

/**
 * Generic upload button (domain-agnostic). Picks a file, validates type + size on the
 * client (the server re-validates), posts it via the shared upload service.
 */
export default function FileUpload({
  tripId,
  category,
  costComponent,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("Unsupported file type (images or PDF only)");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large (max 10MB)");
      return;
    }

    try {
      setBusy(true);
      const res = await uploadFile({ tripId, category, costComponent, file });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Uploaded");
      onUploaded();
    } catch (err) {
      console.log(err);
      toast.error("Failed to upload file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {busy ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}
