// "use client";

// import { useState } from "react";
// import { Plus, Search } from "lucide-react";

// import ClientStats from "@/components/clients/client-stats";
// import ClientTable from "@/components/clients/client-table";
// import AddClientModal from "@/components/clients/add-client-modal";
// import { useAuthStore } from "@/store/auth-store";

// export default function ClientsPage() {
//   const { user } = useAuthStore();
//   const [searchQuery, setSearchQuery] = useState("");

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <h1 className="page-title">
//             Client Management
//           </h1>

//           <p className="mt-2 text-muted-foreground">
//             Manage system clients and access permissions
//           </p>
//         </div>

//         {user?.role === "ADMIN" && (
//           <AddClientModal>
//             <button className="flex h-10 items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 text-xs font-semibold text-primary-foreground shadow-xs cursor-pointer transition-colors">
//               <Plus className="h-4 w-4" />
//               Add User
//             </button>
//           </AddClientModal>
//         )}
//       </div>

//       {/* Stats */}
//       <ClientStats />

//       {/* Search */}
//       <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
//         <div className="relative w-full max-w-sm">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//           <input
//             type="text"
//             placeholder="Search clients by name, email, role..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="h-10 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       <ClientTable searchQuery={searchQuery} />
//     </div>
//   );
// }





"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import ClientStats from "@/components/clients/client-stats";
import ClientTable from "@/components/clients/client-table";
import AddClientModal from "@/components/clients/add-client-modal";
import { useAuthStore } from "@/store/auth-store";

export default function ClientsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Client Management
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage clients and their tracking API
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <AddClientModal onSuccess={() => setRefreshKey((k) => k + 1)}>
            <button className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </AddClientModal>
        )}
      </div>

      <ClientStats />

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-muted/40 pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      <ClientTable searchQuery={searchQuery} refreshKey={refreshKey} />
    </div>
  );
}