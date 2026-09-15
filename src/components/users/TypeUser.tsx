import type { UserRole } from "@/types/user";

export type { UserRole };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}