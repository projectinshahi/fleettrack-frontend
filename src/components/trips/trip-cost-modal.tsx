"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  COST_COMPONENT_META,
  costAmount,
  TripCost,
  TripCostInput,
} from "@/types/trip-cost";

interface Props {
  open: boolean;
  onClose: () => void;
  cost: TripCost | null;
  onSave: (input: TripCostInput) => Promise<unknown>;
}

const inputClass =
  "h-9 w-28 rounded-lg border border-input bg-background px-2.5 text-right text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Cost entry form (TCM-01.3 estimated + TCM-02.2 actual). Seeds every component
 * from the trip's existing cost (fresh on mount) and saves both groups through the
 * one PUT. Generic over COST_COMPONENT_META so components live in one place.
 */
export default function TripCostModal({ open, onClose, cost, onSave }: Props) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      COST_COMPONENT_META.flatMap((c) => [
        [c.estimatedField, costAmount(cost, c.estimatedField)] as [
          string,
          number,
        ],
        [c.actualField, costAmount(cost, c.actualField)] as [string, number],
      ]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);

  const estimatedTotal = COST_COMPONENT_META.reduce(
    (sum, c) => sum + (values[c.estimatedField] || 0),
    0,
  );
  const actualTotal = COST_COMPONENT_META.reduce(
    (sum, c) => sum + (values[c.actualField] || 0),
    0,
  );

  const set = (field: string, raw: string) =>
    setValues((prev) => ({ ...prev, [field]: Number(raw) || 0 }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: TripCostInput = {
      estimatedFuel: values.estimatedFuel || 0,
      estimatedTolls: values.estimatedTolls || 0,
      estimatedAllowance: values.estimatedAllowance || 0,
      estimatedParking: values.estimatedParking || 0,
      estimatedMaintenance: values.estimatedMaintenance || 0,
      estimatedMisc: values.estimatedMisc || 0,
      actualFuel: values.actualFuel || 0,
      actualTolls: values.actualTolls || 0,
      actualAllowance: values.actualAllowance || 0,
      actualParking: values.actualParking || 0,
      actualMaintenance: values.actualMaintenance || 0,
      actualMisc: values.actualMisc || 0,
    };

    try {
      setSubmitting(true);
      await onSave(input);
      toast.success("Costs saved");
      onClose();
    } catch (err) {
      console.log(err);
      toast.error("Failed to save costs");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Trip costs</DialogTitle>
          <DialogDescription>
            Enter the estimated and actual cost for each component.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="flex-1" />
            <span className="w-28 text-right">Estimated</span>
            <span className="w-28 text-right">Actual</span>
          </div>

          {COST_COMPONENT_META.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <label className="flex-1 text-sm font-medium">{c.label}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={values[c.estimatedField]}
                onChange={(e) => set(c.estimatedField, e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={values[c.actualField]}
                onChange={(e) => set(c.actualField, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}

          <div className="flex items-center gap-3 border-t border-border pt-3 text-sm font-semibold">
            <span className="flex-1">Total</span>
            <span className="w-28 text-right">
              {estimatedTotal.toLocaleString()}
            </span>
            <span className="w-28 text-right">
              {actualTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={submitting}
            >
              Save Costs
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
