"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, Trash2, ExternalLink } from "lucide-react";

import { fetchFileObjectUrl } from "@/services/upload.service";
import { FileAsset } from "@/types/upload";

interface Props {
  file: FileAsset;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

/**
 * Preview tile for one uploaded file. Because files are served behind JWT, the bytes are
 * fetched as an authenticated blob and shown via an object URL (revoked on unmount).
 * Images render a thumbnail; other types (PDF) show an icon + open link.
 */
export default function FileThumb({ file, canDelete, onDelete }: Props) {
  const isImage = file.mimeType.startsWith("image/");
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isImage) return;

    let active = true;
    let objectUrl: string | null = null;

    async function load() {
      try {
        const u = await fetchFileObjectUrl(file);
        if (!active) {
          URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      } catch (err) {
        console.log(err);
        if (active) setFailed(true);
      }
    }

    load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, isImage]);

  const openFile = async () => {
    try {
      const u = await fetchFileObjectUrl(file);
      window.open(u, "_blank", "noopener");
      // Revoke after the tab has had time to load the blob.
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="flex h-28 w-full items-center justify-center">
        {isImage ? (
          failed ? (
            <FileText className="h-8 w-8 text-muted-foreground" />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file.originalName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )
        ) : (
          <button
            type="button"
            onClick={openFile}
            className="flex flex-col items-center gap-1 text-muted-foreground transition hover:text-foreground"
          >
            <FileText className="h-8 w-8" />
            <span className="flex items-center gap-1 text-xs font-medium">
              <ExternalLink className="h-3 w-3" /> Open
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-border bg-card px-2 py-1.5">
        <span
          className="truncate text-xs text-muted-foreground"
          title={file.originalName}
        >
          {file.originalName}
        </span>
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            className="shrink-0 text-muted-foreground transition hover:text-destructive"
            aria-label="Delete file"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
