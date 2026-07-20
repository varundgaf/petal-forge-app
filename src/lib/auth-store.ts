import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "publisher" | "advertiser";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  avatar_url: string | null;
  kyc_status: "unverified" | "pending" | "verified" | "rejected";
  two_factor_enabled: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  init: () => Promise<() => void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

async function loadProfile(userId: string): Promise<{ profile: Profile | null; role: UserRole | null }> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).limit(1),
  ]);
  return {
    profile: (profile as Profile) ?? null,
    role: (roles?.[0]?.role as UserRole) ?? null,
  };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  status: "idle",

  init: async () => {
    set({ status: "loading" });
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const { profile, role } = await loadProfile(data.session.user.id);
      set({ user: data.session.user, profile, role, status: "authenticated" });
    } else {
      set({ user: null, profile: null, role: null, status: "unauthenticated" });
    }
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        set({ user: null, profile: null, role: null, status: "unauthenticated" });
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        const { profile, role } = await loadProfile(session.user.id);
        set({ user: session.user, profile, role, status: "authenticated" });
      }
    });
    return () => sub.subscription.unsubscribe();
  },

  refresh: async () => {
    const u = get().user;
    if (!u) return;
    const { profile, role } = await loadProfile(u.id);
    set({ profile, role });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, role: null, status: "unauthenticated" });
  },
}));
