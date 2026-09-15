"use client";

import { useUploads } from "@/hooks/use-uploads";
import { FileCategory } from "@/types/upload";
import FileUpload from "./file-upload";
import FileThumb from "./file-thumb";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  tripId: string;
  category: FileCategory;
  /** CLIENT may upload/delete; ADMIN is read-only (mirrors trip ownership). */
  canEdit: boolean;
  title: string;
  emptyLabel?: string;
}

/**
 * Generic file gallery — the reusable UI for any file category. Trip-cost receipts and
 * (later) POD media both render this with a different `category`; it holds no
 * domain-specific logic, only upload + preview + delete.
 */
export default function FileGallery({
  tripId,
  category,
  canEdit,
  title,
  emptyLabel = "No files uploaded",
}: Props) {
  const { files, loading, error, reload, remove } = useUploads(tripId, category);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {canEdit && (
          <FileUpload
            tripId={tripId}
            category={category}
            onUploaded={reload}
          />
        )}
      </div>

      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : error ? (
        <p className="mt-3 text-sm text-destructive">Couldn&apos;t load files.</p>
      ) : files.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <FileThumb
              key={file.id}
              file={file}
              canDelete={canEdit}
              onDelete={canEdit ? remove : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
