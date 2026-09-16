// "use client";

// import { Bell, ChevronDown, CircleCheck, LogOut, Menu, Search } from "lucide-react";
// import { useAuthStore } from "@/store/auth-store";
// import ThemeToggle from "./theme-toggle";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// interface NavbarProps {
//   expanded: boolean;
//   setSidebarOpen: (value: boolean) => void;
// }

// export default function Navbar({ expanded, setSidebarOpen }: NavbarProps) {
//   const { user, logout } = useAuthStore();

//   const handleLogout = () => {
//     logout();
//   };

//   const getInitials = () => {
//     if (!user?.name) return "U";

//     return user.name
//       .split(" ")
//       .map((word) => word[0])
//       .join("")
//       .slice(0, 2)
//       .toUpperCase();
//   };

//   const formatRole = (role?: string) => {
//     if (!role) return "User";

//     return role
//       .replaceAll("_", " ")
//       .toLowerCase()
//       .replace(/\b\w/g, (char) => char.toUpperCase());
//   };

//   return (
//     <header
//       className={`
//         fixed top-0 right-0 z-25
//         flex h-16 items-center justify-between
//         border-b border-border
//         bg-background/80 backdrop-blur-md
//         px-4 sm:px-6 lg:px-8
//         transition-all duration-300
//         left-0
//         ${expanded ? "lg:left-[250px]" : "lg:left-[88px]"}
//       `}
//     >
//       {/* Left */}
//       <div className="flex items-center gap-3">
//         {/* Mobile Menu */}
//         <button
//           onClick={() => setSidebarOpen(true)}
//           className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors lg:hidden"
//         >
//           <Menu className="h-4.5 w-4.5 text-muted-foreground" />
//         </button>

//         {/* Search */}
//         <div className="hidden md:block w-[240px] lg:w-[320px]">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <input
//               type="text"
//               placeholder="Search dashboard..."
//               className="
//                 h-9 w-full rounded-lg border border-border
//                 bg-muted/40 pl-9 pr-4 text-xs outline-none transition-all
//                 placeholder:text-muted-foreground
//                 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20
//               "
//             />
//           </div>
//         </div>
//       </div>

//       {/* Right */}
//       <div className="flex items-center gap-2 sm:gap-3">
//         {/* System Status */}
//         <div className="hidden sm:flex items-center gap-2 rounded-full bg-success/10 px-3.5 py-1.5 text-xs font-semibold text-success border border-success/10">
//           <span className="relative flex h-2 w-2">
//             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
//             <span className="relative inline-flex h-full w-full rounded-full bg-success" />
//           </span>
//           <span>All Systems Online</span>
//         </div>

//         {/* Theme */}
//         <ThemeToggle />

//         {/* Notifications */}
//         <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
//           <Bell className="h-4 w-4" />
//           <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
//         </button>

//         {/* Profile */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <button className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-1.5 hover:bg-muted/80 transition-all cursor-pointer">
//               <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
//                 {getInitials()}
//               </div>

//               <div className="hidden lg:block text-left">
//                 <h4 className="text-xs font-semibold leading-tight text-foreground">
//                   {user?.name || "Unknown"}
//                 </h4>

//                 <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-none">
//                   {formatRole(user?.role)}
//                 </p>
//               </div>

//               <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
//             </button>
//           </DropdownMenuTrigger>

//           <DropdownMenuContent align="end" className="w-44">
//             <DropdownMenuItem
//               onClick={handleLogout}
//               className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
//             >
//               <LogOut className="mr-2 h-4 w-4" />
//               Logout
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//     </header>
//   );
// }



"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/store/auth-store";
import { useClientStore } from "@/store/client-store";
import ThemeToggle from "./theme-toggle";
import NotificationBell from "@/components/notifications/notification-bell";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { apiFetch } from "@/lib/fetcher";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  expanded: boolean;
  setSidebarOpen: (value: boolean) => void;
}

interface Client {
  id: string;
  name: string;
}

export default function Navbar({
  expanded,
  setSidebarOpen,
}: NavbarProps) {
  const { user, logout } = useAuthStore();

  const { selectedClient, setSelectedClient } =
    useClientStore();

  // F8 — chime once on a genuinely new notification (single mount point for the app).
  useNotificationSound();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsError, setClientsError] = useState(false);

  // First statement is `await`, so calling this in the effect performs no
  // synchronous setState (keeps react-hooks/set-state-in-effect happy).
  const loadClients = useCallback(async () => {
    try {
      const response = await apiFetch("/clients");
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setClients(data.clients || []);
      setClientsError(false);
    } catch (error) {
      console.log(error);
      setClientsError(true);
    }
  }, []);

  // Inlined (not a call to `loadClients`) to satisfy the no-setState-in-effect
  // lint rule; `loadClients` stays for the dropdown Retry action.
  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    async function load() {
      try {
        const response = await apiFetch("/clients");
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        setClients(data.clients || []);
        setClientsError(false);
      } catch (error) {
        console.log(error);
        setClientsError(true);
      }
    }

    load();
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const getInitials = () => {
    if (!user?.name) return "U";

    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatRole = (role?: string) => {
    if (!role) return "User";

    return role
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <header
      className={`
        fixed top-0 right-0 z-25
        flex h-16 items-center justify-between
        border-b border-border
        bg-card
        px-4 sm:px-6 lg:px-8
        transition-all duration-300
        left-0
        ${expanded ? "lg:left-[250px]" : "lg:left-[88px]"}
      `}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden md:block w-[240px] lg:w-[320px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dashboard..."
              aria-label="Search dashboard"
              className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user?.role === "ADMIN" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {selectedClient?.name || "All Clients"}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSelectedClient(null)}
              >
                All Clients
              </DropdownMenuItem>

              {clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() =>
                    setSelectedClient(client)
                  }
                >
                  {client.name}
                </DropdownMenuItem>
              ))}

              {clientsError && (
                <>
                  <div className="px-2 py-1.5 text-xs text-destructive">
                    Couldn&apos;t load clients.
                  </div>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      // Keep the menu open so the retry stays in place.
                      e.preventDefault();
                      loadClients();
                    }}
                    className="cursor-pointer text-xs font-medium text-primary-ink"
                  >
                    Retry
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <ThemeToggle />

        {(user?.role === "ADMIN" || user?.role === "CLIENT") && (
          <NotificationBell />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 items-center gap-2.5 rounded-lg border border-border px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {getInitials()}
              </div>

              <div className="hidden lg:block text-left">
                <h4 className="text-sm font-semibold">
                  {user?.name || "Unknown"}
                </h4>

                <p className="text-xs text-muted-foreground">
                  {formatRole(user?.role)}
                </p>
              </div>

              <ChevronDown className="hidden sm:block h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}