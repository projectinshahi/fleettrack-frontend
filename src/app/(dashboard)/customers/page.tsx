"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";

import CustomerTable from "@/components/customers/customer-table";
import AddCustomerModal from "@/components/customers/add-customer-modal";
import { useAuthStore } from "@/store/auth-store";

export default function CustomersPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Customer Management
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage shippers, receivers and corporate customers
          </p>
        </div>

        {user?.role === "CLIENT" && (
          <AddCustomerModal onSuccess={() => setRefreshKey((k) => k + 1)}>
            <button className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </AddCustomerModal>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search customers by name, email, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:bg-background"
          />
        </div>
      </div>

      <CustomerTable searchQuery={searchQuery} refreshKey={refreshKey} />
    </div>
  );
}
