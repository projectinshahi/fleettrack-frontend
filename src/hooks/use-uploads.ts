"use client";

import { useEffect, useState } from "react";

import { listFiles, deleteFile } from "@/services/upload.service";
import { FileAsset, FileCategory } from "@/types/upload";

/**
 * Loads a trip's files for one category (e.g. RECEIPT) through the shared upload
 * service, and exposes reload + optimistic delete. Reloads when trip/category change.
 */
export function useUploads(tripId: string, category: FileCategory) {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  // A failed list must not read as "no files", which is what every consumer used to render.
  const [error, setError] = useState(false);

  // Inlined async load (no-setState-in-effect lint rule); reload on trip/category change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await listFiles(tripId, category);
        if (active) {
          setFiles(data);
          setError(false);
        }
      } catch (err) {
        console.log(err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [tripId, category]);

  const reload = async () => {
    try {
      const data = await listFiles(tripId, category);
      setFiles(data);
      setError(false);
    } catch (err) {
      console.log(err);
      setError(true);
    }
  };

  const remove = async (id: string) => {
    // apiFetch rejects on non-2xx, so a failed delete now throws instead of returning
    // a non-ok response. Caught here (this is called straight from an onClick) so it
    // can't surface as an unhandled rejection; the caller still gets false.
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return { files, loading, error, reload, remove };
}
