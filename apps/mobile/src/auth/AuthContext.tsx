import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, ProfileUpdate } from "../lib/profiles";
import { ensureProfile, updateProfile as updateProfileRow } from "../lib/profiles";
import { registerForPushNotificationsAsync } from "../lib/pushNotifications";

type AuthState = {
  isLoading: boolean;
  session: Session | null;
  isProfileLoading: boolean;
  profile: Profile | null;
};

type AuthActions = {
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signUp: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<void>;
  getAccessToken: () => string | null; // Helper for testing
};

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (nextSession: Session) => {
      try {
        setIsProfileLoading(true);
        const nextProfile = await ensureProfile({
          userId: nextSession.user.id,
          email: nextSession.user.email,
        });
        if (mounted) setProfile(nextProfile);
        if (mounted) void registerForPushNotificationsAsync(nextSession.user.id);
      } catch (e) {
        // Don't block auth if profile fetch fails; just warn for now.
        console.warn("Failed to load profile", e);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        // For now we just treat this as unauthenticated.
        setSession(null);
        setProfile(null);
      } else {
        const nextSession = data.session ?? null;
        setSession(nextSession);
        if (nextSession) void loadProfile(nextSession);
      }
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      if (!nextSession) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }
      void loadProfile(nextSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      isProfileLoading,
      profile,
      signIn: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async ({ email, password }) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      refreshProfile: async () => {
        if (!session) return;
        const next = await ensureProfile({ userId: session.user.id, email: session.user.email });
        setProfile(next);
      },
      // Helper to get access token for testing
      getAccessToken: () => {
        if (!session?.access_token) {
          console.warn("No active session. Please log in first.");
          return null;
        }
        console.log("\n🔑 USER ACCESS TOKEN (for testing):");
        console.log(session.access_token);
        console.log("\nCopy this token to test-ai-coach.js\n");
        return session.access_token;
      },
      updateProfile: async (patch) => {
        if (!session) return;
        const next = await updateProfileRow({ userId: session.user.id, patch });
        setProfile(next);
      },
      getAccessToken: () => {
        if (!session?.access_token) {
          console.warn("No active session. Please log in first.");
          return null;
        }
        console.log("\n🔑 USER ACCESS TOKEN (for testing):");
        console.log(session.access_token);
        console.log("\nCopy this token to test-ai-coach.js\n");
        return session.access_token;
      },
    }),
    [isLoading, session, isProfileLoading, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

