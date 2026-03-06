/**
 * SDK-like wrapper for Opik tracing - makes it easy to trace any LLM call.
 * Provides automatic tracing with minimal code changes.
 */

import { logCoachTurnTrace } from "./trace.ts";
import { calculateMetrics } from "./metrics.ts";
import type { PerformanceMetrics } from "./metrics.ts";

export type TraceLLMCallParams = {
  /** Trace name (e.g., "memory-extraction", "sentiment-analysis") */
  traceName: string;
  /** Input to the LLM call */
  input: string | Record<string, any>;
  /** Output from the LLM call */
  output?: string | Record<string, any>;
  /** Model name used */
  model?: string;
  /** Start time (ISO string) - auto-generated if not provided */
  startTime?: string;
  /** End time (ISO string) - auto-generated if not provided */
  endTime?: string;
  /** Error if call failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Tags for filtering in Opik */
  tags?: string[];
  /** Thread ID for grouping related traces */
  threadId?: string;
  /** Temperature setting */
  temperature?: number;
};

/**
 * Generic function to trace any LLM call to Opik.
 * SDK-like wrapper that automatically handles metrics and formatting.
 */
export async function traceLLMCall(params: TraceLLMCallParams): Promise<void> {
  const startTime = params.startTime || new Date().toISOString();
  const endTime = params.endTime || new Date().toISOString();

  // Format input/output as strings
  const inputStr = typeof params.input === "string" 
    ? params.input 
    : JSON.stringify(params.input);
  const outputStr = params.output 
    ? (typeof params.output === "string" ? params.output : JSON.stringify(params.output))
    : undefined;

  // Calculate metrics
  const metrics: PerformanceMetrics = calculateMetrics({
    startTime,
    endTime,
    userMessage: inputStr.slice(0, 1000),
    coachResponse: outputStr?.slice(0, 2000),
    error: params.error,
  });

  // Build metadata
  const metadata: Record<string, any> = {
    model: params.model,
    ...params.metadata,
    response_time_ms: metrics.responseTimeMs,
    input_tokens: metrics.inputTokens,
    output_tokens: metrics.outputTokens,
    total_tokens: metrics.totalTokens,
    success: metrics.success,
  };

  if (params.temperature !== undefined) {
    metadata.temperature = params.temperature;
  }

  // Build trace body
  const body: Record<string, any> = {
    start_time: startTime,
    end_time: endTime,
    name: params.traceName,
    project_name: "compass-ai-coach",
    thread_id: params.threadId || undefined,
    input: {
      prompt: inputStr.slice(0, 2000),
      ...(typeof params.input === "object" ? params.input : {}),
    },
    output: params.error
      ? undefined
      : {
          response: outputStr?.slice(0, 4000),
          ...(params.output && typeof params.output === "object" ? params.output : {}),
        },
    metadata,
    tags: ["compass", ...(params.tags || [])],
    error_info: params.error ? { message: params.error } : undefined,
  };

  // Use existing trace logging infrastructure
  const apiKey = getEnv("OPIK_API_KEY");
  const workspace = getEnv("OPIK_WORKSPACE");
  const baseUrl = getEnv("OPIK_URL_OVERRIDE") || "https://www.comet.com/opik/api";

  if (!apiKey) {
    return; // Opik not configured
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/private/traces`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (workspace) {
    headers["Comet-Workspace"] = workspace;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`Opik trace (${params.traceName}) failed:`, res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn(`Opik trace (${params.traceName}) error:`, e);
  }
}

/**
 * Helper to trace an async LLM function call automatically.
 * Wraps any async function and traces its execution.
 */
export async function withTrace<T>(
  traceName: string,
  fn: () => Promise<T>,
  options?: {
    input?: string | Record<string, any>;
    metadata?: Record<string, any>;
    tags?: string[];
    threadId?: string;
    model?: string;
    temperature?: number;
  }
): Promise<T> {
  const startTime = new Date().toISOString();
  let output: T;
  let error: string | undefined;

  try {
    output = await fn();
    const endTime = new Date().toISOString();

    // Trace successful call
    void traceLLMCall({
      traceName,
      input: options?.input || "async-function-call",
      output: typeof output === "string" ? output : JSON.stringify(output),
      startTime,
      endTime,
      metadata: options?.metadata,
      tags: options?.tags,
      threadId: options?.threadId,
      model: options?.model,
      temperature: options?.temperature,
    });

    return output;
  } catch (e: any) {
    error = String(e?.message || e);
    const endTime = new Date().toISOString();

    // Trace failed call
    void traceLLMCall({
      traceName,
      input: options?.input || "async-function-call",
      startTime,
      endTime,
      error,
      metadata: options?.metadata,
      tags: options?.tags,
      threadId: options?.threadId,
      model: options?.model,
      temperature: options?.temperature,
    });

    throw e;
  }
}

function getEnv(key: string): string | undefined {
  if (typeof Deno !== "undefined" && Deno.env) {
    return Deno.env.get(key);
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}
