/**
 * Phase 4: Proactive Engagement - Send scheduled push notifications
 * 
 * This function should be called periodically (e.g., every 15 minutes via cron)
 * to send morning check-ins, evening reflections, commitment reminders, and streak nudges.
 * 
 * Usage: Call via HTTP POST or set up as a cron job
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

type NotificationPayload = {
  to: string;
  title: string;
  body: string;
  data?: {
    type: "morning_intention" | "evening_reflection" | "commitment_reminder" | "streak_nudge" | "checkin_nudge";
    commitmentId?: string;
  };
  sound?: "default" | null;
  priority?: "default" | "high";
  channelId?: string;
};

async function sendExpoPushNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Expo push failed: ${response.status} ${text}`);
      return false;
    }

    const result = await response.json();
    if (result.data?.status === "error") {
      console.error(`Expo push error:`, result.data);
      return false;
    }

    return true;
  } catch (e) {
    console.error("sendExpoPushNotification exception:", e);
    return false;
  }
}

/**
 * Get current hour and minute in user's timezone
 */
function getLocalTimeParts(utcTime: Date, timezone: string): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(utcTime);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
    return { hour, minute };
  } catch {
    // Fallback to UTC
    return { hour: utcTime.getUTCHours(), minute: utcTime.getUTCMinutes() };
  }
}

/**
 * Check if current time matches the scheduled time (within a 15-minute window)
 */
function isTimeToSend(scheduledTime: string | null, userTimezone: string | null, currentUtc: Date): boolean {
  if (!scheduledTime) return false;
  const [scheduledHour, scheduledMinute] = scheduledTime.split(":").map(Number);
  if (isNaN(scheduledHour) || isNaN(scheduledMinute)) return false;

  const { hour: currentHour, minute: currentMinute } = getLocalTimeParts(currentUtc, userTimezone || "UTC");
  
  // Calculate difference in minutes
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
  
  let diffMinutes = Math.abs(currentTotalMinutes - scheduledTotalMinutes);
  // Handle wrap-around (e.g., 23:50 vs 00:10)
  if (diffMinutes > 12 * 60) {
    diffMinutes = 24 * 60 - diffMinutes;
  }
  
  return diffMinutes <= 15; // Within 15-minute window
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // 1) Load users with notifications enabled and push tokens
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, push_token, notifications_enabled, morning_checkin_enabled, morning_checkin_time, evening_checkin_enabled, evening_checkin_time, timezone, streak_count, last_session_at")
      .eq("notifications_enabled", true)
      .not("push_token", "is", null);

    if (profilesError) {
      console.error("Failed to load profiles:", profilesError);
      return new Response(JSON.stringify({ error: "Failed to load profiles", details: profilesError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No users to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    // 2) Send morning check-ins
    for (const profile of profiles) {
      if (!profile.morning_checkin_enabled || !profile.push_token) continue;
      try {
        if (isTimeToSend(profile.morning_checkin_time, profile.timezone || null, now)) {
          // Check if already completed today
          const { data: checkin } = await supabase
            .from("daily_checkins")
            .select("morning_completed_at")
            .eq("user_id", profile.id)
            .eq("date", today)
            .maybeSingle();

          if (!checkin?.morning_completed_at) {
            const sent = await sendExpoPushNotification({
              to: profile.push_token,
              title: "Good morning! 🌅",
              body: "What's one thing you want to focus on today?",
              data: { type: "morning_intention" },
              sound: "default",
              priority: "default",
            });
            if (sent) sentCount++;
          }
        }
      } catch (e) {
        console.error(`Failed to process morning check-in for user ${profile.id}:`, e);
        // Continue with next user
      }
    }

    // 3) Send evening reflections
    for (const profile of profiles) {
      if (!profile.evening_checkin_enabled || !profile.push_token) continue;
      try {
        if (isTimeToSend(profile.evening_checkin_time, profile.timezone || null, now)) {
          const { data: checkin } = await supabase
            .from("daily_checkins")
            .select("evening_completed_at")
            .eq("user_id", profile.id)
            .eq("date", today)
            .maybeSingle();

          if (!checkin?.evening_completed_at) {
            const sent = await sendExpoPushNotification({
              to: profile.push_token,
              title: "Evening reflection 🌙",
              body: "How did your day go? Take a moment to reflect.",
              data: { type: "evening_reflection" },
              sound: "default",
              priority: "default",
            });
            if (sent) sentCount++;
          }
        }
      } catch (e) {
        console.error(`Failed to process evening reflection for user ${profile.id}:`, e);
        // Continue with next user
      }
    }

    // 4) Send commitment reminders (due today or overdue, status pending)
    const { data: commitments } = await supabase
      .from("commitments")
      .select("id, user_id, commitment, due_date, profiles!inner(push_token, notifications_enabled)")
      .eq("status", "pending")
      .lte("due_date", today)
      .not("profiles.push_token", "is", null)
      .eq("profiles.notifications_enabled", true);

    if (commitments && commitments.length > 0) {
      for (const commitment of commitments) {
        const profile = (commitment as any).profiles;
        if (!profile?.push_token) continue;

        const sent = await sendExpoPushNotification({
          to: profile.push_token,
          title: "Commitment reminder 📋",
          body: `You committed to: "${commitment.commitment}". How's it going?`,
          data: { type: "commitment_reminder", commitmentId: commitment.id },
          sound: "default",
          priority: "default",
        });
        if (sent) sentCount++;
      }
    }

    // 5) Send streak nudges
    for (const profile of profiles) {
      if (!profile.push_token || !profile.streak_count || profile.streak_count < 3) continue;

      const lastSession = profile.last_session_at ? new Date(profile.last_session_at) : null;
      if (!lastSession) continue;

      const daysSinceLastSession = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastSession === 1) {
        // Streak active, gentle nudge
        const sent = await sendExpoPushNotification({
          to: profile.push_token,
          title: `You're on a ${profile.streak_count}-day streak! 🔥`,
          body: "Keep it going with a quick check-in today.",
          data: { type: "streak_nudge" },
          sound: "default",
          priority: "default",
        });
        if (sent) sentCount++;
      } else if (daysSinceLastSession >= 2) {
        // About to lose streak
        const sent = await sendExpoPushNotification({
          to: profile.push_token,
          title: "Haven't seen you in a while 👋",
          body: "Everything okay? Your streak is waiting for you.",
          data: { type: "checkin_nudge" },
          sound: "default",
          priority: "default",
        });
        if (sent) sentCount++;
      }
    }

    return new Response(
      JSON.stringify({
        sent: sentCount,
        message: `Sent ${sentCount} notifications`,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("send-scheduled-notifications error:", e);
    return new Response(JSON.stringify({ error: "Internal error", details: String(e?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
