/**
 * Opik trace logging for Commit to Change hackathon (Comet Resolution v2).
 * Sends LLM/coach turn traces to Opik via REST API for observability and evaluation.
 * Works in Deno (Supabase Edge Functions) and Node.
 */

import type { EvaluationResult } from "./evaluations.ts";
import type { PerformanceMetrics } from "./metrics.ts";

const OPIK_TRACES_PATH = "/api/v1/private/traces";

export type LogCoachTurnTraceParams = {
  /** User message (input) */
  userMessage: string;
  /** Coach response (output) */
  coachResponse: string;
  /** Session type: quick_checkin | deep_dive | reflection | etc. */
  sessionType?: string;
  /** Coach identifier */
  coachId?: string;
  /** Conversation ID for thread grouping */
  conversationId?: string;
  /** Model name used (e.g. gemini-2.5-flash) */
  model?: string;
  /** Trace start time (ISO string) */
  startTime?: string;
  /** Trace end time (ISO string) */
  endTime?: string;
  /** Optional error if turn failed */
  error?: string;
  /** Evaluation results from LLM-as-judge */
  evaluation?: EvaluationResult;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
  /** Experiment ID for tracking model/prompt variations */
  experimentId?: string;
  /** Temperature setting used */
  temperature?: number;
};

function getEnv(key: string): string | undefined {
  if (typeof Deno !== "undefined" && Deno.env) {
    return Deno.env.get(key);
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Send a coach-turn trace to Opik.
 * No-op if OPIK_API_KEY is not set (safe for local/dev without Opik).
 */
export async function logCoachTurnTrace(params: LogCoachTurnTraceParams): Promise<void> {
  const apiKey = getEnv("OPIK_API_KEY");
  const workspace = getEnv("OPIK_WORKSPACE");
  const baseUrl = getEnv("OPIK_URL_OVERRIDE") || "https://www.comet.com/opik/api";

  if (!apiKey) {
    console.warn("Opik: OPIK_API_KEY not set in environment. Traces will not be sent to Opik.");
    return; // Opik not configured
  }

  const startTime = params.startTime || new Date().toISOString();
  const endTime = params.endTime || new Date().toISOString();

  // Build comprehensive metadata including evaluations and metrics
  const metadata: Record<string, any> = {
    model: params.model,
    session_type: params.sessionType,
    coach_id: params.coachId,
  };

  // Add evaluation scores to metadata
  if (params.evaluation) {
    metadata.evaluation_relevance = params.evaluation.relevance;
    metadata.evaluation_tone = params.evaluation.tone;
    metadata.evaluation_safety = params.evaluation.safety;
    metadata.evaluation_helpfulness = params.evaluation.helpfulness;
    metadata.evaluation_overall = params.evaluation.overall;
    if (params.evaluation.safetyFlags && params.evaluation.safetyFlags.length > 0) {
      metadata.safety_flags = params.evaluation.safetyFlags;
    }
  }

  // Add performance metrics to metadata
  if (params.metrics) {
    metadata.response_time_ms = params.metrics.responseTimeMs;
    metadata.input_tokens = params.metrics.inputTokens;
    metadata.output_tokens = params.metrics.outputTokens;
    metadata.total_tokens = params.metrics.totalTokens;
    metadata.success = params.metrics.success;
  }

  // Add experiment and configuration metadata
  if (params.experimentId) {
    metadata.experiment_id = params.experimentId;
  }
  if (params.temperature !== undefined) {
    metadata.temperature = params.temperature;
  }

  const body: Record<string, any> = {
    start_time: startTime,
    end_time: endTime,
    name: "compass-coach-turn",
    project_name: "compass-ai-coach",
    thread_id: params.conversationId || undefined,
    input: {
      user_message: params.userMessage?.slice(0, 2000),
      session_type: params.sessionType,
      coach_id: params.coachId,
    },
    output: params.error
      ? undefined
      : { coach_response: params.coachResponse?.slice(0, 4000) },
    metadata,
    tags: ["coach-turn", "compass", params.sessionType].filter(Boolean),
    error_info: params.error ? { message: params.error } : undefined,
  };

  // Add experiment ID if provided (Opik Experiments API)
  if (params.experimentId) {
    body.experiment_id = params.experimentId;
  }

  const url = `${baseUrl.replace(/\/$/, "")}${OPIK_TRACES_PATH}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (workspace) {
    headers["Comet-Workspace"] = workspace;
  }

  try {
    console.log("Opik: Sending trace to:", url);
    console.log("Opik: Trace name:", body.name);
    console.log("Opik: Project:", body.project_name);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`Opik trace failed: HTTP ${res.status} - ${errorText}`);
      console.error("Opik: Full response:", { status: res.status, statusText: res.statusText, error: errorText });
    } else {
      const responseText = await res.text().catch(() => "");
      console.log("Opik trace sent successfully! Response:", responseText);
      console.log("Opik: Conversation ID:", params.conversationId || "no-conversation-id");
    }
  } catch (e) {
    console.error("Opik trace error:", e);
    console.error("Opik: Error details:", String(e));
  }
}
