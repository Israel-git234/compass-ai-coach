/**
 * Opik Experiments API integration.
 * Tracks experiments for systematic evaluation of model versions, prompts, and configurations.
 */

export type ExperimentMetadata = {
  /** Experiment name (e.g., "model-comparison-v1") */
  experimentName: string;
  /** Model version being tested */
  model?: string;
  /** Prompt version or identifier */
  promptVersion?: string;
  /** Temperature setting */
  temperature?: number;
  /** Any other custom metadata */
  [key: string]: any;
};

const OPIK_EXPERIMENTS_PATH = "/api/v1/private/experiments";

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
 * Create or get an Opik experiment.
 * Returns the experiment ID for use in trace logging.
 */
export async function getOrCreateExperiment(params: {
  experimentName: string;
  metadata?: ExperimentMetadata;
}): Promise<string | null> {
  const apiKey = getEnv("OPIK_API_KEY");
  const workspace = getEnv("OPIK_WORKSPACE");
  const baseUrl = getEnv("OPIK_URL_OVERRIDE") || "https://www.comet.com/opik/api";

  if (!apiKey) {
    return null; // Opik not configured
  }

  const url = `${baseUrl.replace(/\/$/, "")}${OPIK_EXPERIMENTS_PATH}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (workspace) {
    headers["Comet-Workspace"] = workspace;
  }

  try {
    // Try to get existing experiment first
    const getResponse = await fetch(`${url}?name=${encodeURIComponent(params.experimentName)}`, {
      method: "GET",
      headers,
    });

    if (getResponse.ok) {
      const data = await getResponse.json();
      if (data?.experiment_id) {
        return data.experiment_id;
      }
    }

    // Create new experiment if not found
    const createResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: params.experimentName,
        project_name: "compass-ai-coach",
        metadata: params.metadata || {},
      }),
    });

    if (!createResponse.ok) {
      console.warn("Opik experiment: Failed to create experiment", createResponse.status, await createResponse.text().catch(() => ""));
      return null;
    }

    const data = await createResponse.json();
    return data?.experiment_id || null;
  } catch (e) {
    console.warn("Opik experiment: Error creating/getting experiment", e);
    return null;
  }
}

/**
 * Get the current experiment ID based on model and configuration.
 * Creates experiments for different model versions automatically.
 */
export async function getCurrentExperimentId(params: {
  model?: string;
  temperature?: number;
  promptVersion?: string;
}): Promise<string | null> {
  const model = params.model || "gemini-3-flash-preview";
  const temperature = params.temperature ?? 0.7;
  const promptVersion = params.promptVersion || "v1";

  // Create experiment name based on configuration
  const experimentName = `compass-${model}-temp${temperature}-prompt${promptVersion}`;

  return await getOrCreateExperiment({
    experimentName,
    metadata: {
      experimentName,
      model,
      temperature,
      promptVersion,
    },
  });
}
