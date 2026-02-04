import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type TranscribeRequestBody = {
  audioUrl: string; // Supabase storage path or signed URL
};

// Manual base64 encode for Deno
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = bytes.length;
  let i = 0;

  while (i < len) {
    const a = bytes[i++];
    const b = i < len ? bytes[i++] : 0;
    const c = i < len ? bytes[i++] : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars[(bitmap >> 18) & 63];
    result += chars[(bitmap >> 12) & 63];
    result += i - 2 < len ? chars[(bitmap >> 6) & 63] : "=";
    result += i - 1 < len ? chars[bitmap & 63] : "=";
  }

  return result;
}

// Manual base64url decode (for JWT)
function base64UrlDecode(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  base64 += "=".repeat((4 - (base64.length % 4)) % 4);

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

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  // Get auth header
  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  // Decode JWT to get user info
  let userId: string | null = null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return jsonResponse({ error: "Token expired" }, { status: 401 });
    }
    userId = payload.sub ?? null;
    if (!userId) {
      return jsonResponse({ error: "Missing user ID in token" }, { status: 401 });
    }
  } catch (e: any) {
    return jsonResponse({ error: "Invalid JWT", details: e?.message }, { status: 401 });
  }

  // Parse request body
  let body: TranscribeRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { audioUrl } = body;
  if (!audioUrl || typeof audioUrl !== "string") {
    return jsonResponse({ error: "Missing audioUrl" }, { status: 400 });
  }

  // Get environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  if (!geminiApiKey) {
    return jsonResponse({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Download audio file
  let audioBytes: Uint8Array;
  let mimeType = "audio/mp4"; // default

  try {
    // Check if it's a storage path or full URL
    if (audioUrl.startsWith("http")) {
      // Direct URL - fetch it
      const resp = await fetch(audioUrl);
      if (!resp.ok) {
        throw new Error(`Failed to fetch audio: ${resp.status}`);
      }
      mimeType = resp.headers.get("content-type") ?? "audio/mp4";
      audioBytes = new Uint8Array(await resp.arrayBuffer());
    } else {
      // Storage path - download from Supabase Storage
      const { data, error } = await supabaseClient.storage
        .from("voice-messages")
        .download(audioUrl);

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to download audio from storage");
      }

      audioBytes = new Uint8Array(await data.arrayBuffer());
      // Guess mime type from extension
      if (audioUrl.endsWith(".m4a") || audioUrl.endsWith(".mp4")) {
        mimeType = "audio/mp4";
      } else if (audioUrl.endsWith(".mp3")) {
        mimeType = "audio/mpeg";
      } else if (audioUrl.endsWith(".webm")) {
        mimeType = "audio/webm";
      }
    }
  } catch (e: any) {
    return jsonResponse(
      { error: "Failed to download audio", details: e?.message },
      { status: 500 }
    );
  }

  // Convert audio to base64
  const audioBase64 = uint8ArrayToBase64(audioBytes);

  // Call Gemini to transcribe
  // Using gemini-2.5-flash (available model for this API key)
  const model = "gemini-2.5-flash";
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

  const geminiBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Transcribe this audio to text. Return ONLY the transcription, nothing else. If the audio is silent or unintelligible, return an empty string.",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
    },
  };

  let transcript: string;
  try {
    const resp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      
      // Parse error to detect quota issues
      let errorMessage = "Failed to transcribe audio";
      let userFriendlyMessage = "We're experiencing high demand. Please try again in a moment.";
      let statusCode = 500;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          // Check for quota/rate limit errors
          if (resp.status === 429 || 
              errorJson.error.status === "RESOURCE_EXHAUSTED" ||
              errorJson.error.message?.includes("quota") ||
              errorJson.error.message?.includes("rate limit")) {
            statusCode = 429;
            userFriendlyMessage = "Voice transcription is temporarily unavailable due to high usage. Please try typing your message instead, or wait a few minutes and try again.";
            errorMessage = "API quota exceeded";
          } else if (resp.status === 404 || errorJson.error.message?.includes("not found")) {
            statusCode = 500;
            userFriendlyMessage = "Transcription service is temporarily unavailable. Please try typing your message instead.";
            errorMessage = "Model not found";
          } else {
            errorMessage = errorJson.error.message || errorMessage;
          }
        }
      } catch {
        // If error text isn't JSON, use generic message
        if (resp.status === 429) {
          statusCode = 429;
          userFriendlyMessage = "Voice transcription is temporarily unavailable due to high usage. Please try typing your message instead.";
        }
      }
      
      return jsonResponse(
        { 
          error: errorMessage,
          userMessage: userFriendlyMessage,
          code: resp.status === 429 ? "QUOTA_EXCEEDED" : "TRANSCRIPTION_FAILED"
        },
        { status: statusCode }
      );
    }

    const data: any = await resp.json();
    transcript =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("")?.trim() ?? "";
      
    if (!transcript || transcript.length === 0) {
      return jsonResponse(
        { 
          error: "No transcription available",
          userMessage: "Could not transcribe your audio. The recording might be too quiet or unclear. Please try again or type your message.",
          code: "EMPTY_TRANSCRIPT"
        },
        { status: 400 }
      );
    }
  } catch (e: any) {
    // Network or other errors
    const isQuotaError = e?.message?.includes("429") || e?.message?.includes("quota") || e?.message?.includes("RESOURCE_EXHAUSTED");
    
    return jsonResponse(
      { 
        error: "Failed to transcribe audio",
        userMessage: isQuotaError 
          ? "Voice transcription is temporarily unavailable due to high usage. Please try typing your message instead."
          : "Something went wrong while transcribing. Please try again or type your message.",
        details: e?.message,
        code: isQuotaError ? "QUOTA_EXCEEDED" : "TRANSCRIPTION_ERROR"
      },
      { status: isQuotaError ? 429 : 500 }
    );
  }

  return jsonResponse(
    { transcript },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});
