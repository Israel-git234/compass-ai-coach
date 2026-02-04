/**
 * Phase 4: Push notification registration and token storage.
 * Registers with Expo Push and saves token to Supabase profiles.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Show notifications when app is in foreground (optional: set to false to only show when backgrounded)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
  }),
});

export type NotificationData = {
  type?: "morning_intention" | "evening_reflection" | "commitment_reminder" | "streak_nudge" | "checkin_nudge";
  commitmentId?: string;
};

/**
 * Request permissions and get Expo Push Token. Returns null if not physical device or permission denied.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return null;

  try {
    // For EAS Build, set extra.eas.projectId in app.config.js. For Expo Go, token may still work.
    let projectId: string | undefined;
    try {
      const appConfig = require("../../app.json") as { expo?: { extra?: { eas?: { projectId?: string } } } };
      projectId = appConfig.expo?.extra?.eas?.projectId;
    } catch (_) {}
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenData?.data ?? null;
  } catch (e) {
    console.warn("getExpoPushToken error:", e);
    return null;
  }
}

/**
 * Save push token to the user's profile. Call when logged in.
 */
export async function registerPushToken(userId: string, token: string | null): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      push_token: token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) console.warn("Failed to save push_token:", error.message);
}

/**
 * Register for push notifications and save token to profile. Call after login.
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  const token = await getExpoPushToken();
  if (token) await registerPushToken(userId, token);
  return token;
}

/**
 * Add listener for when user taps a notification (e.g. to open morning/evening modal).
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}

/**
 * Get the last notification response (e.g. app opened from tap). Call on app focus.
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}
