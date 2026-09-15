"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";

import { useDelays } from "@/hooks/use-delays";
import DelayTable from "@/components/delays/delay-table";
import DelayCategoryBadge from "@/components/delays/delay-category-badge";
import DelayDetailModal from "@/components/delays/delay-detail-modal";
import { Delay, DelayCategory, DELAY_CATEGORIES } from "@/types/delay";

type CategoryFilter = DelayCategory | "ALL";

function titleCase(category: DelayCategory) {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

export default function DelaysPage() {
  const { delays, loading, error } = useDelays();

  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [grouped, setGrouped] = useState(false);
  const [selected, setSelected] = useState<Delay | null>(null);

  // Filter/group (DLY-02.1) is derived client-side from the already-loaded list —
  // no extra fetch or duplicated state.
  const filtered = useMemo(
    () =>
      category === "ALL"
        ? delays
        : delays.filter((d) => d.category === category),
    [delays, category],
  );

  const groups = useMemo(
    () =>
      DELAY_CATEGORIES.map((cat) => ({
        cat,
        items: filtered.filter((d) => d.category === cat),
      })).filter((g) => g.items.length > 0),
    [filtered],
  );

  const selectClass =
    "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <Clock className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h1 className="page-title">Delays</h1>
          <p className="mt-1 text-muted-foreground">
            Reported delays across trips
          </p>
        </div>
      </div>

      {/* Filter + group controls (DLY-02.1) */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          className={selectClass}
        >
          <option value="ALL">All categories</option>
          {DELAY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {titleCase(c)}
            </option>
          ))}
        </select>

        <button
          onClick={() => setGrouped((g) => !g)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            grouped
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-muted"
          }`}
        >
          {grouped ? "Ungroup" : "Group by category"}
        </button>
      </div>

      {loading || error || !grouped || groups.length === 0 ? (
        <DelayTable
          delays={filtered}
          loading={loading}
          error={error}
          onSelect={setSelected}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ cat, items }) => (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                <DelayCategoryBadge category={cat} />
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "delay" : "delays"}
                </span>
              </div>
              <DelayTable delays={items} onSelect={setSelected} />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DelayDetailModal
          open
          onClose={() => setSelected(null)}
          delay={selected}
        />
      )}
    </div>
  );
}
