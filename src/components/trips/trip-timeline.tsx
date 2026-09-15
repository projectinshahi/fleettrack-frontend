"use client";

import { TripActor, TripEvent, TripEventAction } from "@/types/trip";
import TripStatusBadge from "./trip-status-badge";

interface Props {
  events: TripEvent[];
}

const ACTION_LABEL: Record<TripEventAction, string> = {
  CREATED: "Created",
  UPDATED: "Updated",
  STATUS_CHANGED: "Status changed",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

function actorLabel(actor: TripActor) {
  // ADMIN -> Admin, CLIENT -> Client, SYSTEM -> System
  const role = actor.role.charAt(0) + actor.role.slice(1).toLowerCase();
  return actor.name ? `${actor.name} · ${role}` : role;
}

export default function TripTimeline({ events }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Audit log</h3>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity yet</p>
      ) : (
        <ol className="mt-4">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* connector line */}
              {index < events.length - 1 && (
                <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
              )}

              {/* node */}
              <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {event.status && <TripStatusBadge status={event.status} />}
                  <span className="text-sm font-medium">
                    {ACTION_LABEL[event.action]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>

                {event.note && <p className="mt-1 text-sm">{event.note}</p>}

                <p className="mt-0.5 text-xs text-muted-foreground">
                  by {actorLabel(event.actor)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
