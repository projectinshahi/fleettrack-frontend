"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import VehicleTable from "@/components/vehicles/vehicle-table";

import { useAuthStore } from "@/store/auth-store";

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Vehicles</h1>

        <p className="mt-2 text-muted-foreground">
          Manage your fleet vehicles and assignments
        </p>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              placeholder="Search by vehicle number, name, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:bg-background"
            />
          </div>        
        </div>
      </div>

      {/* Table */}
      <VehicleTable searchQuery={searchQuery} />
    </div>
  );
}
