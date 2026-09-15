import { create } from "zustand";
import type { UserRole } from "@/types/user";

interface User {
  id: string;

  name: string;

  email: string;

  role: UserRole;
}

interface AuthStore {
  user: User | null;

  token: string | null;

  hydrated: boolean;

  setAuth: (
    user: User,
    token: string,
  ) => void;

  logout: () => void;

  hydrate: () => void;
}

export const useAuthStore =
  create<AuthStore>((set) => ({
    user: null,

    token: null,

    hydrated: false,

    setAuth: (user, token) => {
      localStorage.setItem(
        "token",
        token,
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user),
      );

      set({
        user,
        token,
        hydrated: true,
      });
    },

    hydrate: () => {
      const token =
        localStorage.getItem("token");

      const user =
        localStorage.getItem("user");

      if (token && user) {
        set({
          token,
          user: JSON.parse(user),
          hydrated: true,
        });
      } else {
        set({
          hydrated: true,
        });
      }
    },

    logout: () => {
      localStorage.removeItem(
        "token",
      );

      localStorage.removeItem(
        "user",
      );

      set({
        user: null,
        token: null,
        hydrated: true,
      });

      window.location.href =
        "/login";
    },
  }));