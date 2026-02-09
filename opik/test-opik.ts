/**
 * Test script to verify Opik integration is working.
 * This can be run directly or called from the Edge Function.
 */

import { logCoachTurnTrace } from "./trace.ts";

/**
 * Test function to send a simple trace to Opik.
 * Returns true if successful, false otherwise.
 */
export async function testOpikConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  console.log("Testing Opik connection...");

  // Check if API key is set
  const apiKey = typeof Deno !== "undefined" && Deno.env
    ? Deno.env.get("OPIK_API_KEY")
    : process?.env?.OPIK_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      message: "OPIK_API_KEY is not set in environment variables",
    };
  }

  console.log("API key found (length:", apiKey.length, ")");

  // Try to send a test trace
  try {
    const testStartTime = new Date().toISOString();
    const testEndTime = new Date().toISOString();

    await logCoachTurnTrace({
      userMessage: "Test message for Opik connection",
      coachResponse: "This is a test response to verify Opik is working",
      sessionType: "test",
      coachId: "test-coach",
      conversationId: "test-conversation-" + Date.now(),
      model: "test-model",
      startTime: testStartTime,
      endTime: testEndTime,
    });

    // Wait a moment for async operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Test trace sent to Opik. Check Opik dashboard for trace named 'compass-coach-turn'",
      details: {
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + "...",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Error sending test trace: " + (error?.message || String(error)),
      details: error,
    };
  }
}
