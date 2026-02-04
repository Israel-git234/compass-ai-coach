import { supabase } from "./supabase";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  onboarding_completed: boolean;
  onboarding_data: unknown | null;
  intake_data: unknown | null;
  intake_completed: boolean;
  intake_completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Phase 4: Proactive engagement
  push_token?: string | null;
  notifications_enabled?: boolean;
  morning_checkin_enabled?: boolean;
  evening_checkin_enabled?: boolean;
  morning_checkin_time?: string | null; // "HH:mm"
  evening_checkin_time?: string | null; // "HH:mm"
  timezone?: string | null;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "email"
    | "display_name"
    | "onboarding_completed"
    | "onboarding_data"
    | "intake_data"
    | "intake_completed"
    | "intake_completed_at"
    | "push_token"
    | "notifications_enabled"
    | "morning_checkin_enabled"
    | "evening_checkin_enabled"
    | "morning_checkin_time"
    | "evening_checkin_time"
    | "timezone"
  >
>;

/**
 * Fetch the signed-in user's profile. If it doesn't exist yet, create it.
 *
 * This is intentionally defensive: even if you create profiles via a DB trigger,
 * this will still succeed.
 */
export async function ensureProfile(params: { userId: string; email?: string | null }) {
  const { userId, email } = params;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  // PGRST116 = "The result contains 0 rows" (no profile yet)
  if (error?.code === "PGRST116") {
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email: email ?? null }, { onConflict: "id" });

    if (upsertError) throw upsertError;

    const { data: next, error: nextError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (nextError) throw nextError;
    return next as Profile;
  }

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(params: { userId: string; patch: ProfileUpdate }) {
  const { userId, patch } = params;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}

