import { COMPASS_CORE_SYSTEM } from "./prompts/system.ts";
import type { CoachPersona } from "./prompts/coaches.ts";

export type ConversationMessageRole = "user" | "coach";

export type ConversationMessage = {
  role: ConversationMessageRole;
  content: string;
};

export type CoachTurnInput = {
  coach: CoachPersona;
  userContextBlock: string;
  memorySummaryBlock?: string;
  sessionContextBlock?: string;
  recentMessages: ConversationMessage[];
  userMessage: string;
  gemini: {
    apiKey: string;
    model?: string;
    temperature?: number;
    topP?: number;
  };
};

export type CoachTurnOutput = {
  text: string;
};

/**
 * Build the full context block (everything except the system prompt) in the
 * required Compass order:
 *
 * 1) Coach persona prompt
 * 2) User context
 * 3) Memory summary
 * 4) Session context
 * 5) Recent messages (windowed)
 * 6) Latest user message
 */
export function buildContextBlock(input: CoachTurnInput): string {
  const sections: string[] = [];

  sections.push(`# Coach Persona\n${input.coach.prompt}`);

  if (input.userContextBlock.trim().length > 0) {
    sections.push(`# User Context\n${input.userContextBlock.trim()}`);
  }

  if (input.memorySummaryBlock && input.memorySummaryBlock.trim().length > 0) {
    sections.push(`# Memory Summary\n${input.memorySummaryBlock.trim()}`);
  }

  if (input.sessionContextBlock && input.sessionContextBlock.trim().length > 0) {
    sections.push(`# Session Context\n${input.sessionContextBlock.trim()}`);
  }

  if (input.recentMessages.length > 0) {
    const historyText = input.recentMessages
      .map((m) => {
        const speaker = m.role === "user" ? "User" : "Coach";
        return `${speaker}: ${m.content}`;
      })
      .join("\n");
    sections.push(`# Recent Conversation (windowed)\n${historyText}`);
  }

  sections.push(`# Current Turn\nUser: ${input.userMessage}`);

  return sections.join("\n\n");
}

/**
 * Call Gemini with the Compass prompt pipeline.
 *
 * This function is environment-agnostic: it assumes `fetch` is available
 * (Deno, modern Node, or browser) and leaves API key/model configuration to the caller.
 */
export async function runCoachTurn(input: CoachTurnInput): Promise<CoachTurnOutput> {
  // Default to Gemini 3 family models for hackathon demos.
  // Fallback to gemini-2.5-flash automatically if unavailable.
  const model = input.gemini.model ?? "gemini-3-flash-preview";
  const temperature = input.gemini.temperature ?? 0.7;
  const topP = input.gemini.topP ?? 0.95;

  // Use v1beta API (has more models available, including gemini-2.5-flash)
  const apiVersion = "v1beta";
  const mkUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${m}:generateContent?key=${encodeURIComponent(
      input.gemini.apiKey,
    )}`;

  const contextBlock = buildContextBlock(input);

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: contextBlock }],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [{ text: COMPASS_CORE_SYSTEM }],
    },
    generationConfig: {
      temperature,
      topP,
    },
  };

  async function post(m: string): Promise<Response> {
    return await fetch(mkUrl(m), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  let resp = await post(model);
  if (!resp.ok && resp.status === 404 && model !== "gemini-2.5-flash") {
    resp = await post("gemini-2.5-flash");
  }

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "");
    throw new Error(
      `Gemini request failed with status ${resp.status}: ${resp.statusText}${
        errorText ? ` – ${errorText}` : ""
      }`,
    );
  }

  const data: any = await resp.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim() ??
    "";

  if (!text) {
    throw new Error("Gemini response did not contain text content");
  }

  return { text };
}

