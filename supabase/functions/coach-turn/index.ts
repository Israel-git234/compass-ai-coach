import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { COACHES_BY_KEY } from "../../../ai/prompts/coaches.ts";
import { MEMORY_SUMMARY_INSTRUCTION } from "../../../ai/prompts/memory.ts";
import { INSIGHT_EXTRACTION_INSTRUCTION } from "../../../ai/prompts/insight.ts";
import { COMBINED_EXTRACTION_INSTRUCTION } from "../../../ai/prompts/memory_extraction.ts";
import { SESSION_TYPE_INSTRUCTIONS } from "../../../ai/prompts/session_types.ts";
import { 
  SENTIMENT_ANALYSIS_INSTRUCTION, 
  CRISIS_DETECTION_INSTRUCTION,
  RESPONSE_TYPE_GUIDANCE,
  QUESTION_LIBRARY,
  type SentimentType,
} from "../../../ai/prompts/coaching_techniques.ts";
import { runCoachTurn, type ConversationMessage } from "../../../ai/orchestrator.ts";

type CoachTurnRequestBody = {
  conversationId?: string;
  coachId?: string;
  message: string;
  voiceMessageUrl?: string; // Storage path for voice messages
  sessionType?: string; // Phase 3: quick_checkin | deep_dive | reflection | goal_review | celebration | grounding
  skipSentimentAnalysis?: boolean; // Phase 5: Skip sentiment/crisis analysis to save API calls (for testing)
};

type UpdateMemoryAndInsightsParams = {
  supabaseClient: any;
  conversationId: string;
  sessionId?: string;
  userId: string;
  geminiApiKey: string;
};

type UserContext = {
  goals: any[];
  pendingCommitments: any[];
  recentPatterns: any[];
  importantMemories: any[];
  recentMood: any | null;
  recentSummaries: any[];
};

// Manual base64 decode function (works in Deno Edge Functions)
function base64UrlDecode(base64Url: string): string {
  // Convert base64url to base64
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  base64 += "=".repeat((4 - (base64.length % 4)) % 4);
  
  // Manual base64 decode
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  
  while (i < base64.length) {
    const encoded1 = chars.indexOf(base64.charAt(i++));
    const encoded2 = chars.indexOf(base64.charAt(i++));
    const encoded3 = chars.indexOf(base64.charAt(i++));
    const encoded4 = chars.indexOf(base64.charAt(i++));
    
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
}

async function callGeminiInstruction(params: {
  apiKey: string;
  model?: string;
  temperature?: number;
  topP?: number;
  systemInstruction: string;
  transcript: string;
}): Promise<string> {
  // Default to a Gemini 3 family model for hackathon demos.
  // Fallback to gemini-2.5-flash if unavailable.
  const model = params.model ?? Deno.env.get("GEMINI_INSTRUCTION_MODEL") ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-3-flash-preview";
  const temperature = params.temperature ?? 0.3;
  const topP = params.topP ?? 0.95;

  // Use v1beta API (has more models available, including gemini-2.5-flash)
  const mkUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(
      params.apiKey,
    )}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: params.transcript }],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [{ text: params.systemInstruction }],
    },
    generationConfig: {
      temperature,
      topP,
    },
  };

  async function post(m: string): Promise<Response> {
    return await fetch(mkUrl(m), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  let resp = await post(model);
  if (!resp.ok && resp.status === 404 && model !== "gemini-2.5-flash") {
    // Automatic fallback if Gemini 3 preview model isn't enabled for this key/project.
    resp = await post("gemini-2.5-flash");
  }

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "");
    throw new Error(
      `Gemini (instruction) failed with status ${resp.status}: ${resp.statusText}${
        errorText ? ` – ${errorText}` : ""
      }`,
    );
  }

  const data: any = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim() ?? "";

  if (!text) {
    throw new Error("Gemini (instruction) response did not contain text content");
  }

  return text;
}

// Load comprehensive user context from memory tables
async function loadUserContext(supabaseClient: any, userId: string): Promise<UserContext> {
  const context: UserContext = {
    goals: [],
    pendingCommitments: [],
    recentPatterns: [],
    importantMemories: [],
    recentMood: null,
    recentSummaries: [],
  };

  try {
    // Load active goals
    const { data: goals } = await supabaseClient
      .from("user_goals")
      .select("title, category, status, target_date")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(5);
    context.goals = goals || [];

    // Load pending commitments
    const { data: commitments } = await supabaseClient
      .from("commitments")
      .select("commitment, due_date, context, created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5);
    context.pendingCommitments = commitments || [];

    // Load recent patterns
    const { data: patterns } = await supabaseClient
      .from("user_patterns")
      .select("title, description, pattern_type")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("last_observed", { ascending: false })
      .limit(3);
    context.recentPatterns = patterns || [];

    // Load important memories
    const { data: memories } = await supabaseClient
      .from("user_memory")
      .select("content, memory_type, importance")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("importance", ["high", "critical"])
      .order("created_at", { ascending: false })
      .limit(10);
    context.importantMemories = memories || [];

    // Load recent mood
    const { data: moodData } = await supabaseClient
      .from("mood_entries")
      .select("mood_score, mood_label, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    context.recentMood = moodData;

    // Load recent session summaries
    const { data: summaries } = await supabaseClient
      .from("session_summaries")
      .select("summary, key_topics, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    context.recentSummaries = summaries || [];

  } catch (e) {
    console.warn("loadUserContext: error loading context", e);
  }

  return context;
}

// Build user context block for AI prompt
function buildUserContextBlock(profile: any, userContext: UserContext, user: any): string {
  const lines: string[] = [];
  lines.push("USER CONTEXT:");
  lines.push(`- User id: ${user.id}`);
  lines.push(`- Email: ${profile?.email ?? user.email ?? "unknown"}`);

  if (profile?.display_name) {
    lines.push(`- Display name: ${profile.display_name}`);
  }

  if (profile?.coaching_style_preference) {
    lines.push(`- Preferred coaching style: ${profile.coaching_style_preference}`);
  }

  if (profile?.life_context) {
    lines.push(`- Life context: ${profile.life_context}`);
  }

  if (profile?.values && profile.values.length > 0) {
    lines.push(`- Core values: ${profile.values.join(", ")}`);
  }

  if (profile?.intake_data) {
    const goal = (profile.intake_data as any).goal;
    const challenge = (profile.intake_data as any).challenge;
    if (goal) lines.push(`- Intake goal: ${goal}`);
    if (challenge) lines.push(`- Intake challenge: ${challenge}`);
  }

  // Add goals
  if (userContext.goals.length > 0) {
    lines.push("\nACTIVE GOALS:");
    userContext.goals.forEach((g) => {
      lines.push(`- ${g.title}${g.category ? ` (${g.category})` : ""}${g.target_date ? ` - target: ${g.target_date}` : ""}`);
    });
  }

  // Add pending commitments
  if (userContext.pendingCommitments.length > 0) {
    lines.push("\nPENDING COMMITMENTS (follow up on these!):");
    userContext.pendingCommitments.forEach((c) => {
      lines.push(`- "${c.commitment}"${c.due_date ? ` (due: ${c.due_date})` : ""}`);
    });
  }

  // Add patterns
  if (userContext.recentPatterns.length > 0) {
    lines.push("\nOBSERVED PATTERNS:");
    userContext.recentPatterns.forEach((p) => {
      lines.push(`- ${p.title}: ${p.description}`);
    });
  }

  // Add important memories
  if (userContext.importantMemories.length > 0) {
    lines.push("\nIMPORTANT THINGS TO REMEMBER:");
    userContext.importantMemories.forEach((m) => {
      lines.push(`- [${m.memory_type}] ${m.content}`);
    });
  }

  // Add recent mood
  if (userContext.recentMood) {
    const moodAge = Date.now() - new Date(userContext.recentMood.created_at).getTime();
    const hoursAgo = Math.floor(moodAge / (1000 * 60 * 60));
    if (hoursAgo < 24) {
      lines.push(`\nRECENT MOOD (${hoursAgo}h ago): ${userContext.recentMood.mood_score}/10 - ${userContext.recentMood.mood_label || ""}${userContext.recentMood.note ? ` (${userContext.recentMood.note})` : ""}`);
    }
  }

  // Add recent session summaries for continuity
  if (userContext.recentSummaries.length > 0) {
    lines.push("\nRECENT SESSIONS:");
    userContext.recentSummaries.forEach((s, i) => {
      const date = new Date(s.created_at).toLocaleDateString();
      lines.push(`- ${date}: ${s.summary}`);
    });
  }

  return lines.join("\n") + "\n";
}

async function updateMemoryAndInsights(params: UpdateMemoryAndInsightsParams): Promise<void> {
  const { supabaseClient, conversationId, sessionId, userId, geminiApiKey } = params;

  // Load messages to analyze
  const { data: messages, error } = await supabaseClient
    .from("messages")
    .select("sender, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.warn("coach-turn: failed to load messages for memory", error.message);
    return;
  }

  // Feature gating:
  // - COMPASS_FEATURE_MODE=full  -> extraction enabled (hackathon demo / production)
  // - COMPASS_FEATURE_MODE=mvp   -> extraction disabled (free-tier cost optimization)
  const featureMode = (Deno.env.get("COMPASS_FEATURE_MODE") ?? "full").toLowerCase();
  if (featureMode === "mvp") {
    console.log("coach-turn: Skipping memory extraction (COMPASS_FEATURE_MODE=mvp)");
    return;
  }
  
  // OPTIMIZATION 1: Only extract if we have enough material (6+ messages = 3+ exchanges)
  if (!messages || messages.length < 6) {
    console.log("coach-turn: skipping extraction - not enough messages yet");
    return;
  }

  // OPTIMIZATION 2: Only run extraction every 8 messages (MVP: reduce API calls by 87.5%)
  // For MVP: Extract less frequently to save costs. Can reduce to every 4 messages later.
  if (messages.length % 8 !== 0 && messages.length < 12) {
    console.log("coach-turn: skipping extraction - waiting for more messages (MVP optimization)");
    return;
  }

  const transcript = (messages as any[])
    .map((m) => {
      const speaker = m.sender === "coach" ? "Coach" : "User";
      return `${speaker}: ${m.content}`;
    })
    .join("\n");

  // OPTIMIZATION 3: Single combined API call for ALL extractions
  // Instead of 4-5 separate calls, we make just 1 call
  let extractedData: any = null;
  try {
    const response = await callGeminiInstruction({
      apiKey: geminiApiKey,
      systemInstruction: COMBINED_EXTRACTION_INSTRUCTION,
      transcript,
      temperature: 0.2,
    });
    
    // Parse the combined JSON response
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.slice(7);
      }
      if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith("```")) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      extractedData = JSON.parse(cleanResponse.trim());
    } catch (parseError) {
      console.warn("coach-turn: failed to parse extraction response as JSON", parseError);
      // Try to extract summary as plain text fallback
      extractedData = { summary: { text: response.slice(0, 500) } };
    }
  } catch (e) {
    console.warn("coach-turn: combined extraction failed", e);
    return; // Exit early if extraction fails
  }

  // Process the extracted data
  
  // 1) Store session summary
  if (extractedData?.summary?.text) {
    const summary = extractedData.summary;
    const { error: summaryError } = await supabaseClient.from("session_summaries").insert({
      user_id: userId,
      session_id: sessionId || null,
      conversation_id: conversationId,
      summary: summary.text,
      key_topics: summary.key_topics || [],
      emotional_tone: summary.emotional_tone || null,
      breakthroughs: summary.breakthroughs || [],
      action_items: [],
    });
    if (summaryError) {
      console.warn("coach-turn: failed to insert session_summary", summaryError.message);
    }

    // Update legacy conversation_memory
    const { data: existingMemory } = await supabaseClient
      .from("conversation_memory")
      .select("id")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (existingMemory) {
      await supabaseClient
        .from("conversation_memory")
        .update({
          summary: summary.text,
          themes: summary.key_topics,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", existingMemory.id);
    } else {
      await supabaseClient.from("conversation_memory").insert({
        conversation_id: conversationId,
        summary: summary.text,
        themes: summary.key_topics,
      });
    }
  }

  // 2) Store commitments
  if (extractedData?.commitments && Array.isArray(extractedData.commitments)) {
    for (const c of extractedData.commitments) {
      if (c.commitment) {
        const { error: commitmentError } = await supabaseClient.from("commitments").insert({
          user_id: userId,
          session_id: sessionId || null,
          commitment: c.commitment,
          context: c.context || null,
          due_date: c.timeframe ? parseDueDate(c.timeframe) : null,
          status: "pending",
        });
        if (commitmentError) {
          console.warn("coach-turn: failed to insert commitment", commitmentError.message);
        }
      }
    }
  }

  // 3) Store memories
  if (extractedData?.memories && Array.isArray(extractedData.memories)) {
    for (const m of extractedData.memories) {
      if (m.content && m.type) {
        const { error: memoryError } = await supabaseClient.from("user_memory").insert({
          user_id: userId,
          memory_type: m.type,
          content: m.content,
          importance: m.importance || "normal",
          source_session_id: sessionId || null,
          tags: [],
        });
        if (memoryError) {
          console.warn("coach-turn: failed to insert memory", memoryError.message);
        }
      }
    }
  }

  // 4) Store insight
  if (extractedData?.insight) {
    const { error: insightError } = await supabaseClient.from("insights").insert({
      user_id: userId,
      conversation_id: conversationId,
      summary: extractedData.insight,
      user_approved: false,
    });
    if (insightError) {
      console.warn("coach-turn: failed to insert insight", insightError.message);
    }
  }

  console.log("coach-turn: extraction complete - saved summary, commitments, memories, insight");
}

// Helper to parse relative timeframes into dates
function parseDueDate(timeframe: string): string | null {
  const now = new Date();
  const lower = timeframe.toLowerCase();
  
  if (lower.includes("today")) {
    return now.toISOString().split("T")[0];
  } else if (lower.includes("tomorrow")) {
    now.setDate(now.getDate() + 1);
    return now.toISOString().split("T")[0];
  } else if (lower.includes("this week") || lower.includes("week")) {
    now.setDate(now.getDate() + 7);
    return now.toISOString().split("T")[0];
  } else if (lower.includes("month")) {
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().split("T")[0];
  }
  
  return null;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(
      { error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars" },
      { status: 500 },
    );
  }

  if (!geminiApiKey) {
    return jsonResponse({ error: "Missing GEMINI_API_KEY env var" }, { status: 500 });
  }

  // Collect all headers for debugging
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });

  // Try to get Authorization header (case-insensitive in HTTP, but check variants)
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader) {
    return jsonResponse(
      {
        error: "Missing Authorization header",
        received_headers: Object.keys(allHeaders),
      },
      { status: 401 },
    );
  }

  // Extract the JWT token
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return jsonResponse(
      { error: "Empty token in Authorization header" },
      { status: 401 },
    );
  }

  // Decode JWT payload manually (Supabase auth already validated the signature when user signed in)
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return jsonResponse(
        { error: "Invalid JWT format", details: "Token must have 3 parts separated by dots" },
        { status: 401 },
      );
    }

    const payloadBase64 = parts[1];
    // Decode base64url (JWT uses base64url encoding)
    const payloadJson = base64UrlDecode(payloadBase64);
    const payload = JSON.parse(payloadJson);

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return jsonResponse(
        { error: "Invalid JWT", details: "Token has expired" },
        { status: 401 },
      );
    }

    userId = payload.sub ?? null;
    userEmail = payload.email ?? null;

    if (!userId) {
      return jsonResponse(
        { error: "Invalid JWT", details: "Token missing 'sub' (user ID)" },
        { status: 401 },
      );
    }
  } catch (e: any) {
    console.error("coach-turn: failed to decode JWT payload", e);
    return jsonResponse(
      { error: "Invalid JWT", details: e?.message ?? "Failed to decode token" },
      { status: 401 },
    );
  }

  // Create Supabase client with the user's auth context for RLS
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  // Build a minimal user object
  const user = { id: userId, email: userEmail };

  let body: CoachTurnRequestBody;
  try {
    body = (await req.json()) as CoachTurnRequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawMessage = body.message;
  if (typeof rawMessage !== "string" || !rawMessage.trim()) {
    return jsonResponse({ error: "Field 'message' must be a non-empty string" }, { status: 400 });
  }
  const message = rawMessage.trim();
  const voiceMessageUrl = body.voiceMessageUrl ?? null;

  // 1) Load user profile first (needed for coach selection)
  let profile: any = null;
  let userContext: UserContext = {
    goals: [],
    pendingCommitments: [],
    recentPatterns: [],
    importantMemories: [],
    recentMood: null,
    recentSummaries: [],
  };
  
  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select(
        "email, display_name, onboarding_completed, onboarding_data, intake_completed, intake_data, selected_coach_id, coaching_style_preference, life_context, values, streak_count, total_sessions, last_session_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (!error) {
      profile = data;
    } else {
      console.warn("coach-turn: failed to load profile", error.message);
    }
  } catch (e) {
    console.warn("coach-turn: unexpected error loading profile", e);
  }

  // Load comprehensive user context from memory tables
  try {
    userContext = await loadUserContext(supabaseClient, user.id);
  } catch (e) {
    console.warn("coach-turn: failed to load user context", e);
  }

  // 2) Resolve coach (by coachId param, user's selected coach, or default)
  let coachRow: any = null;
  
  // Priority: 1) explicit coachId param, 2) user's selected_coach_id, 3) default coach
  const coachIdToUse = body.coachId || profile?.selected_coach_id || null;
  
  if (coachIdToUse) {
    const { data, error } = await supabaseClient
      .from("coaches")
      .select("*")
      .eq("id", coachIdToUse)
      .maybeSingle();
    if (error) {
      return jsonResponse({ error: "Failed to load coach", details: error.message }, { status: 500 });
    }
    coachRow = data;
  }
  
  // Fallback to default coach if no specific coach found
  if (!coachRow) {
    const { data, error } = await supabaseClient
      .from("coaches")
      .select("*")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();
    if (error) {
      return jsonResponse({ error: "Failed to load default coach", details: error.message }, { status: 500 });
    }
    coachRow = data;
  }

  if (!coachRow) {
    return jsonResponse(
      { error: "No coach configured. Create at least one coach row in the 'coaches' table." },
      { status: 400 },
    );
  }

  // Build coach persona prompt - use custom if available, otherwise use persona_key
  let coachPersonaPrompt: string;
  let coachPersona: any = null; // Will be set for system coaches
  
  if (coachRow.coach_type === "private" || coachRow.coach_type === "creator") {
    // Custom coach: build prompt from stored fields
    const styleConfig = coachRow.style_config || {};
    const coachingRules = coachRow.coaching_rules || {};
    const tone = styleConfig.tone || coachRow.style || "balanced";
    const pacing = styleConfig.pacing || "medium";
    const challengeLevel = styleConfig.challenge_level || "medium";
    
    const toneDesc = tone === "gentle" ? "calm, patient, supportive" : tone === "direct" ? "straightforward, action-oriented, challenging" : "balanced, warm but honest";
    const pacingDesc = pacing === "slow" ? "take time to reflect" : pacing === "fast" ? "move quickly to action" : "balance reflection and action";
    const challengeDesc = challengeLevel === "low" ? "gentle guidance" : challengeLevel === "high" ? "push back respectfully" : "balanced support and challenge";
    
    const advicePolicy = coachingRules.advice_policy || "optional";
    const questionDepth = coachingRules.question_depth || "moderate";
    const emotionalWarmth = coachingRules.emotional_warmth || "medium";
    
    coachPersonaPrompt = `
You are ${coachRow.name}.

${coachRow.description || ""}

COACHING APPROACH:
• Tone: ${toneDesc}
• Pacing: ${pacingDesc}
• Challenge level: ${challengeDesc}

ADVICE POLICY:
${advicePolicy === "never" ? "• Never offer direct advice. Only ask questions." : advicePolicy === "optional" ? "• Offer suggestions only when helpful, framed as experiments." : "• Provide actionable suggestions when appropriate."}

QUESTION DEPTH:
${questionDepth === "surface" ? "• Ask clarifying questions about the immediate situation." : questionDepth === "moderate" ? "• Explore underlying patterns and values." : "• Dive deep into root causes and beliefs."}

EMOTIONAL WARMTH:
${emotionalWarmth === "low" ? "• Keep responses analytical and objective." : emotionalWarmth === "medium" ? "• Balance logic with empathy." : "• Show high emotional intelligence and warmth."}

PHILOSOPHY:
${coachRow.philosophy || ""}

SAFETY BOUNDARIES (non-negotiable):
• Never provide medical, mental health, or crisis advice
• Encourage professional help when appropriate
• Maintain coaching boundaries
`.trim();
  } else {
    // System coach: use persona_key lookup
    const personaKey: string = coachRow.persona_key ?? "clarity";
    coachPersona = COACHES_BY_KEY[personaKey] ?? COACHES_BY_KEY["clarity"];
    coachPersonaPrompt = coachPersona.prompt;
  }

  // Profile and userContext already loaded above (step 1)

  // 3) Load or create conversation
  let conversation: any = null;

  if (body.conversationId) {
    const { data, error } = await supabaseClient
      .from("conversations")
      .select("*")
      .eq("id", body.conversationId)
      .maybeSingle();

    if (error) {
      return jsonResponse(
        { error: "Failed to load conversation", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return jsonResponse({ error: "Conversation not found" }, { status: 404 });
    }

    conversation = data;
  } else {
    const sessionType = (body.sessionType && SESSION_TYPE_INSTRUCTIONS[body.sessionType as keyof typeof SESSION_TYPE_INSTRUCTIONS])
      ? body.sessionType
      : "deep_dive";
    const { data, error } = await supabaseClient
      .from("conversations")
      .insert({
        user_id: user.id,
        coach_id: coachRow.id,
        mode: "text",
        session_type: sessionType,
      })
      .select("*")
      .single();

    if (error) {
      return jsonResponse(
        { error: "Failed to create conversation", details: error.message },
        { status: 500 },
      );
    }

    conversation = data;
  }

  // 4) Load recent messages (window)
  const { data: recentMessagesRows, error: recentMessagesError } = await supabaseClient
    .from("messages")
    .select("sender, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentMessagesError) {
    return jsonResponse(
      { error: "Failed to load recent messages", details: recentMessagesError.message },
      { status: 500 },
    );
  }

  const recentMessages: ConversationMessage[] = (recentMessagesRows ?? [])
    .slice()
    .reverse()
    .map((row: any) => ({
      role: row.sender === "coach" ? "coach" : "user",
      content: String(row.content ?? ""),
    }));

  // 5) Load latest memory summary (if any) for this conversation
  let memorySummaryBlock = "";
  try {
    const { data: memoryRow, error: memoryError } = await supabaseClient
      .from("conversation_memory")
      .select("summary, themes, last_updated_at")
      .eq("conversation_id", conversation.id)
      .order("last_updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!memoryError && memoryRow) {
      const lines: string[] = [];
      lines.push("COACHING MEMORY SUMMARY:");
      if (memoryRow.last_updated_at) {
        lines.push(`- Last updated at: ${memoryRow.last_updated_at}`);
      }
      if (memoryRow.summary) {
        lines.push(`- Summary: ${memoryRow.summary}`);
      }
      if (memoryRow.themes) {
        lines.push(`- Themes: ${JSON.stringify(memoryRow.themes)}`);
      }
      memorySummaryBlock = `${lines.join("\n")}\n`;
    }
  } catch (e) {
    console.warn("coach-turn: failed to load conversation_memory", e);
  }

  // 6) Build comprehensive USER CONTEXT block
  const userContextBlock = buildUserContextBlock(profile, userContext, user);

  const effectiveSessionType = (conversation.session_type && SESSION_TYPE_INSTRUCTIONS[conversation.session_type as keyof typeof SESSION_TYPE_INSTRUCTIONS])
    ? conversation.session_type
    : (body.sessionType && SESSION_TYPE_INSTRUCTIONS[body.sessionType as keyof typeof SESSION_TYPE_INSTRUCTIONS])
      ? body.sessionType
      : "deep_dive";
  const sessionTypeBlock = SESSION_TYPE_INSTRUCTIONS[effectiveSessionType as keyof typeof SESSION_TYPE_INSTRUCTIONS] ?? SESSION_TYPE_INSTRUCTIONS.deep_dive;

  const sessionContextBlock = `CURRENT SESSION:
- Coach: ${coachRow.name}
- Mode: ${conversation.mode ?? "text"}
- Session type: ${effectiveSessionType}

${sessionTypeBlock}
`;

  // 7) Insert user message before calling the model (for chronological integrity)
  const userMessageData: {
    conversation_id: string;
    sender: string;
    type: string;
    content: string;
    metadata?: { media_url?: string; sentiment?: any; crisis_detected?: boolean };
  } = {
    conversation_id: conversation.id,
    sender: "user",
    type: voiceMessageUrl ? "voice" : "text",
    content: message,
    metadata: voiceMessageUrl ? { media_url: voiceMessageUrl } : {},
  };

  const { data: userMessageRow, error: userMessageError } = await supabaseClient
    .from("messages")
    .insert(userMessageData)
    .select("*")
    .single();

  if (userMessageError) {
    return jsonResponse(
      { error: "Failed to insert user message", details: userMessageError.message },
      { status: 500 },
    );
  }

  const fullRecentMessages: ConversationMessage[] = [
    ...recentMessages,
    { role: "user", content: message },
  ];

  // Phase 5: Sentiment analysis and crisis detection
  // MVP OPTIMIZATION: Disabled by default to save API calls (free tier friendly)
  // To enable: Set skipSentimentAnalysis=false in request body
  let sentimentAnalysis: any = null;
  let crisisDetection: any = null;
  let sentimentBlock = "";
  let responseTypeGuidance = "";

  // Default: skip sentiment analysis (MVP mode). Only enable if explicitly set to false.
  const featureMode = (Deno.env.get("COMPASS_FEATURE_MODE") ?? "full").toLowerCase();
  // If caller explicitly sets skipSentimentAnalysis, respect it. Otherwise default based on feature mode.
  const shouldSkipSentiment = body.skipSentimentAnalysis ?? (featureMode === "mvp");
  
  if (!shouldSkipSentiment) {
    try {
      // 1) Crisis detection (critical - check first)
      // Only use AI if keyword detection didn't find anything (to save API calls)
      if (!crisisDetection?.is_crisis) {
        const crisisResponse = await callGeminiInstruction({
          apiKey: geminiApiKey,
          systemInstruction: CRISIS_DETECTION_INSTRUCTION,
          transcript: `User message: ${message}`,
          temperature: 0.2,
        });
        try {
          const cleanCrisis = crisisResponse.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          crisisDetection = JSON.parse(cleanCrisis);
        } catch {
          console.warn("coach-turn: failed to parse crisis detection", crisisResponse);
        }
      }

      // 2) Sentiment analysis (if not crisis)
      if (!crisisDetection?.is_crisis) {
        const sentimentResponse = await callGeminiInstruction({
          apiKey: geminiApiKey,
          systemInstruction: SENTIMENT_ANALYSIS_INSTRUCTION,
          transcript: `User message: ${message}`,
          temperature: 0.2,
        });
        try {
          const cleanSentiment = sentimentResponse.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          sentimentAnalysis = JSON.parse(cleanSentiment);
        } catch {
          console.warn("coach-turn: failed to parse sentiment analysis", sentimentResponse);
        }
      }
    } catch (e) {
      console.warn("coach-turn: sentiment/crisis analysis failed", e);
      // Continue without sentiment analysis if it fails
    }
  } else {
    console.log("coach-turn: Skipping sentiment analysis (MVP mode: saving API calls)");
    // Still provide response type guidance - coach can still choose appropriate response type
    responseTypeGuidance = RESPONSE_TYPE_GUIDANCE;
  }

  // Build sentiment and response type guidance blocks
  if (crisisDetection?.is_crisis) {
    sentimentBlock = `⚠️ CRISIS DETECTED (${crisisDetection.severity}):
- Indicators: ${crisisDetection.indicators?.join(", ") || "detected"}
- Response: ${crisisDetection.recommended_response || "validate_and_refer"}

CRITICAL: Respond with care, validation, and appropriate crisis resources. Set clear boundaries about being a coach, not a therapist.`;
  } else if (sentimentAnalysis) {
    sentimentBlock = `USER'S CURRENT STATE:
- Emotional state: ${sentimentAnalysis.sentiment || "neutral"} (intensity: ${sentimentAnalysis.intensity || 5}/10)
- Context: ${sentimentAnalysis.context || "other"}
- Needs: ${sentimentAnalysis.needs?.join(", ") || "support"}

ADJUST YOUR TONE:
${sentimentAnalysis.sentiment === "anxious" ? "- Be gentle, validating, and calming. Slow down the pace." : ""}
${sentimentAnalysis.sentiment === "frustrated" ? "- Acknowledge the frustration first. Then explore what's underneath." : ""}
${sentimentAnalysis.sentiment === "overwhelmed" ? "- Simplify. Focus on one thing. Reduce options." : ""}
${sentimentAnalysis.sentiment === "sad" ? "- Be compassionate and supportive. Validate feelings before problem-solving." : ""}
${sentimentAnalysis.sentiment === "excited" ? "- Match their energy appropriately. Channel it into clarity and action." : ""}
${sentimentAnalysis.sentiment === "confused" ? "- Slow down. Ask clarifying questions. Help them name what's unclear." : ""}`;

    // Add contextual questions if available
    if (sentimentAnalysis.context && QUESTION_LIBRARY[sentimentAnalysis.context as keyof typeof QUESTION_LIBRARY]) {
      const questions = QUESTION_LIBRARY[sentimentAnalysis.context as keyof typeof QUESTION_LIBRARY];
      sentimentBlock += `\n\nCONTEXTUAL QUESTIONS (use when appropriate):\n${questions.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
    }
  }

  responseTypeGuidance = RESPONSE_TYPE_GUIDANCE;

  // 6) Call Gemini via orchestrator
  let coachText: string;
  try {
    // Create coach persona object (use custom prompt if available, otherwise use system persona)
    const coachPersonaObj = coachRow.coach_type === "private" || coachRow.coach_type === "creator"
      ? { key: coachRow.persona_key || "custom", name: coachRow.name, style: coachRow.style || "balanced", prompt: coachPersonaPrompt }
      : (coachPersona || { key: "clarity", name: "Clarity Coach", style: "gentle", prompt: coachPersonaPrompt });
    
    // If crisis detected (keyword-based or AI-based), inject crisis response template
    let enhancedSessionContext = sessionContextBlock;
    if (crisisDetection?.is_crisis) {
      enhancedSessionContext = `${sessionContextBlock}\n\n${sentimentBlock || "⚠️ CRISIS DETECTED"}\n\nCRISIS RESPONSE TEMPLATE:
1. Start with validation and care: "I hear you, and I want you to know that your feelings are valid."
2. Provide resources:
   - National Suicide Prevention Lifeline: 988 (US) or your local crisis hotline
   - Crisis Text Line: Text HOME to 741741
   - If immediate danger, call emergency services
3. Set boundary: "I'm a coach, not a therapist. For immediate support with what you're experiencing, please reach out to a mental health professional or crisis service."
4. Encourage professional help: "What you're going through deserves professional support. Would you like help finding resources?"
5. End with care: "You don't have to go through this alone. There are people who can help."`;
    } else {
      enhancedSessionContext = `${sessionContextBlock}\n\n${sentimentBlock}\n\n${responseTypeGuidance}`;
    }

    const result = await runCoachTurn({
      coach: coachPersonaObj,
      userContextBlock,
      memorySummaryBlock,
      sessionContextBlock: enhancedSessionContext,
      recentMessages: fullRecentMessages,
      userMessage: message,
      gemini: {
        apiKey: geminiApiKey,
        model: Deno.env.get("GEMINI_MODEL") ?? "gemini-3-flash-preview",
      },
    });
    coachText = result.text;
  } catch (e: any) {
    return jsonResponse(
      { error: "Failed to generate coach response", details: String(e?.message ?? e) },
      { status: 500 },
    );
  }

  // Update user message metadata with sentiment analysis (if available)
  if ((sentimentAnalysis || crisisDetection) && userMessageRow) {
    try {
      await supabaseClient
        .from("messages")
        .update({
          metadata: {
            ...(userMessageRow.metadata || {}),
            sentiment: sentimentAnalysis,
            crisis_detected: crisisDetection?.is_crisis || false,
          },
        })
        .eq("id", userMessageRow.id);
    } catch (e) {
      console.warn("coach-turn: failed to update message metadata", e);
      // Non-critical, continue
    }
  }

  // 7) Persist coach message
  const { data: coachMessageRow, error: coachMessageError } = await supabaseClient
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      sender: "coach",
      type: "text",
      content: coachText,
      metadata: {
        sentiment_analysis: sentimentAnalysis,
        crisis_detected: crisisDetection?.is_crisis || false,
      },
    })
    .select("*")
    .single();

  if (coachMessageError) {
    return jsonResponse(
      { error: "Failed to insert coach message", details: coachMessageError.message },
      { status: 500 },
    );
  }

  // 8) Update conversation last_active_at
  await supabaseClient
    .from("conversations")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", conversation.id);

  // 9) Update memory summary, insights, commitments & memories in the background (best-effort)
  try {
    await updateMemoryAndInsights({
      supabaseClient,
      conversationId: conversation.id,
      sessionId: undefined, // Will be set if we have an active coaching session
      userId: user.id,
      geminiApiKey,
    });
  } catch (e) {
    console.warn("coach-turn: failed to update memory/insights", e);
  }

  // 10) Update user profile stats (streak, session count, last session)
  try {
    const lastSession = profile?.last_session_at ? new Date(profile.last_session_at) : null;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    let newStreak = profile?.streak_count || 0;
    
    // If last session was yesterday (within 24-48 hours), increment streak
    if (lastSession && lastSession > twoDaysAgo && lastSession < oneDayAgo) {
      newStreak += 1;
    } 
    // If last session was more than 2 days ago, reset streak
    else if (!lastSession || lastSession < twoDaysAgo) {
      newStreak = 1;
    }
    // If last session was today, keep streak the same
    
    const longestStreak = Math.max(profile?.longest_streak || 0, newStreak);
    
    await supabaseClient
      .from("profiles")
      .update({
        last_session_at: now.toISOString(),
        total_sessions: (profile?.total_sessions || 0) + 1,
        streak_count: newStreak,
        longest_streak: longestStreak,
      })
      .eq("id", user.id);
  } catch (e) {
    console.warn("coach-turn: failed to update profile stats", e);
  }

  // 10) Return minimal payload to the client
  return jsonResponse(
    {
      conversationId: conversation.id,
      messages: [
        {
          id: userMessageRow.id,
          sender: userMessageRow.sender,
          type: userMessageRow.type,
          content: userMessageRow.content,
          metadata: userMessageRow.metadata ?? null,
          created_at: userMessageRow.created_at,
        },
        {
          id: coachMessageRow.id,
          sender: coachMessageRow.sender,
          type: coachMessageRow.type,
          content: coachMessageRow.content,
          metadata: coachMessageRow.metadata ?? null,
          created_at: coachMessageRow.created_at,
        },
      ],
    },
    { status: 200 },
  );
});

