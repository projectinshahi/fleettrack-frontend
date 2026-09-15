"use client";

import { Fragment, useState } from "react";
import { Wallet, Paperclip, ChevronDown, ChevronRight } from "lucide-react";

import { useTripCost } from "@/hooks/use-trip-cost";
import { useUploads } from "@/hooks/use-uploads";
import { COST_COMPONENT_META, costAmount } from "@/types/trip-cost";
import FileThumb from "@/components/upload/file-thumb";
import FileUpload from "@/components/upload/file-upload";
import TripCostModal from "./trip-cost-modal";

interface Props {
  tripId: string;
  /** CLIENT owns cost entry (ADMIN is read-only), mirroring trip management. */
  canEdit: boolean;
}

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString();
}

/** Signed variance label (+ over budget / − under budget). */
function formatVariance(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString()}`;
}

/** Over budget (actual > estimated) reads red; under budget reads green. */
function varianceClass(value: number): string {
  if (value > 0) return "text-status-fault-ink";
  if (value < 0) return "text-status-ok-ink";
  return "text-muted-foreground";
}

/**
 * Trip cost breakdown (TCM-01.4 / TCM-02.3 / TCM-04.3). Self-contained (loads via
 * useTripCost); shows estimated, actual and the server-derived variance per component
 * + totals, with a CLIENT-only edit opening the cost form.
 *
 * TCM-03 receipts: all RECEIPT files are loaded once and grouped in memory — each cost
 * row expands to its own receipts (TCM-03.2, per component), and a "General receipts"
 * section below holds receipts not tied to a component (TCM-03.1).
 */
export default function TripCostCard({ tripId, canEdit }: Props) {
  const { cost, variance, loading, error, saveCost } = useTripCost(tripId);
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const {
    files: receipts,
    error: receiptsError,
    reload: reloadReceipts,
    remove: removeReceipt,
  } = useUploads(tripId, "RECEIPT");

  const receiptsFor = (upperKey: string) =>
    receipts.filter((f) => f.costComponent === upperKey);
  const generalReceipts = receipts.filter((f) => !f.costComponent);
  const toggle = (key: string) =>
    setExpanded((cur) => (cur === key ? null : key));

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Costs</h3>
        </div>
        {/* No editing while the load failed: the form would open on zeros, and saving would
            overwrite the stored costs with them. */}
        {canEdit && !error && (
          <button
            onClick={() => setEditOpen(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {cost ? "Edit" : "Add costs"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading costs...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">
          Couldn&apos;t load costs. Reload the page to try again.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Component</th>
                <th className="pb-2 text-right font-medium">Estimated</th>
                <th className="pb-2 text-right font-medium">Actual</th>
                <th className="pb-2 text-right font-medium">Variance</th>
                <th className="pb-2 text-right font-medium">Receipts</th>
              </tr>
            </thead>

            <tbody>
              {COST_COMPONENT_META.map((c) => {
                const upper = c.key.toUpperCase();
                const rows = receiptsFor(upper);
                const isOpen = expanded === c.key;
                return (
                  <Fragment key={c.key}>
                    <tr className="border-t border-border">
                      <td className="py-2 text-muted-foreground">{c.label}</td>
                      <td className="py-2 text-right">
                        {formatMoney(costAmount(cost, c.estimatedField))}
                      </td>
                      <td className="py-2 text-right">
                        {formatMoney(costAmount(cost, c.actualField))}
                      </td>
                      <td
                        className={`py-2 text-right font-medium ${varianceClass(
                          variance[c.key],
                        )}`}
                      >
                        {formatVariance(variance[c.key])}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggle(c.key)}
                          aria-expanded={isOpen}
                          className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title={`${c.label} receipts`}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {rows.length}
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={5} className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {c.label} receipts
                            </span>
                            {canEdit && (
                              <FileUpload
                                tripId={tripId}
                                category="RECEIPT"
                                costComponent={upper}
                                onUploaded={reloadReceipts}
                              />
                            )}
                          </div>
                          {rows.length === 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              No receipts for {c.label.toLowerCase()}.
                            </p>
                          ) : (
                            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                              {rows.map((f) => (
                                <FileThumb
                                  key={f.id}
                                  file={f}
                                  canDelete={canEdit}
                                  onDelete={canEdit ? removeReceipt : undefined}
                                />
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">
                  {formatMoney(variance.estimatedTotal)}
                </td>
                <td className="pt-2 text-right">
                  {formatMoney(variance.actualTotal)}
                </td>
                <td className={`pt-2 text-right ${varianceClass(variance.total)}`}>
                  {formatVariance(variance.total)}
                </td>
                <td className="pt-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* General receipts (TCM-03.1) — receipts not tied to a specific cost component. */}
      <div className="mt-6 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">General receipts</h4>
          {canEdit && (
            <FileUpload
              tripId={tripId}
              category="RECEIPT"
              onUploaded={reloadReceipts}
            />
          )}
        </div>
        {receiptsError ? (
          <p className="mt-3 text-sm text-destructive">
            Couldn&apos;t load receipts.
          </p>
        ) : generalReceipts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No general receipts uploaded
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {generalReceipts.map((f) => (
              <FileThumb
                key={f.id}
                file={f}
                canDelete={canEdit}
                onDelete={canEdit ? removeReceipt : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {editOpen && (
        <TripCostModal
          open
          onClose={() => setEditOpen(false)}
          cost={cost}
          onSave={saveCost}
        />
      )}
    </div>
  );
}
