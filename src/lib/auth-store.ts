import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, tokens, apiError } from "./api";

export type UserRole = "admin" | "publisher" | "advertiser";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string, code?: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<{ requiresVerification: boolean }>;
  logout: () => Promise<void>;
  forgot: (email: string) => Promise<void>;
  reset: (token: string, password: string) => Promise<void>;
  clearError: () => void;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  company?: string;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "idle",
      error: null,
      clearError: () => set({ error: null }),

      hydrate: async () => {
        if (!tokens.access) {
          set({ status: "unauthenticated" });
          return;
        }
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.user ?? data, status: "authenticated" });
        } catch {
          tokens.clear();
          set({ user: null, status: "unauthenticated" });
        }
      },

      login: async (email, password, code) => {
        set({ status: "loading", error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password, code });
          const access = data.accessToken ?? data.access_token;
          const refresh = data.refreshToken ?? data.refresh_token;
          if (!access) throw new Error("No access token in response");
          tokens.set(access, refresh);
          const user: AuthUser = data.user ?? (await api.get("/auth/me")).data;
          set({ user, status: "authenticated" });
          return user;
        } catch (e) {
          const msg = apiError(e);
          set({ status: "unauthenticated", error: msg });
          throw new Error(msg);
        }
      },

      register: async (input) => {
        set({ status: "loading", error: null });
        try {
          const { data } = await api.post("/auth/register", input);
          set({ status: "unauthenticated" });
          return { requiresVerification: !!data?.requiresVerification };
        } catch (e) {
          const msg = apiError(e);
          set({ status: "unauthenticated", error: msg });
          throw new Error(msg);
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          /* ignore */
        }
        tokens.clear();
        set({ user: null, status: "unauthenticated" });
      },

      forgot: async (email) => {
        try {
          await api.post("/auth/forgot-password", { email });
        } catch (e) {
          throw new Error(apiError(e));
        }
      },

      reset: async (token, password) => {
        try {
          await api.post("/auth/reset-password", { token, password });
        } catch (e) {
          throw new Error(apiError(e));
        }
      },
    }),
    {
      name: "adp-auth",
      partialize: (s) => ({ user: s.user }),
    }
  )
);

export function isAuthed() {
  return useAuth.getState().status === "authenticated";
}
