/**
 * Performance metrics tracking for Opik.
 * Calculates and tracks metrics like response time, token usage, quality scores.
 */

export type PerformanceMetrics = {
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Input token count (approximate) */
  inputTokens?: number;
  /** Output token count (approximate) */
  outputTokens?: number;
  /** Total token count */
  totalTokens?: number;
  /** Quality scores from evaluation */
  qualityScores?: {
    relevance: number;
    tone: number;
    safety: number;
    helpfulness: number;
    overall: number;
  };
  /** Whether the response was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
};

/**
 * Calculate approximate token count (rough estimate: 1 token ≈ 4 characters).
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate performance metrics from trace data.
 */
export function calculateMetrics(params: {
  startTime: string;
  endTime: string;
  userMessage: string;
  coachResponse?: string;
  error?: string;
  qualityScores?: {
    relevance: number;
    tone: number;
    safety: number;
    helpfulness: number;
    overall: number;
  };
}): PerformanceMetrics {
  const start = new Date(params.startTime).getTime();
  const end = new Date(params.endTime).getTime();
  const responseTimeMs = end - start;

  const inputTokens = estimateTokenCount(params.userMessage);
  const outputTokens = params.coachResponse ? estimateTokenCount(params.coachResponse) : 0;
  const totalTokens = inputTokens + outputTokens;

  return {
    responseTimeMs,
    inputTokens,
    outputTokens,
    totalTokens,
    qualityScores: params.qualityScores,
    success: !params.error,
    error: params.error,
  };
}

/**
 * Aggregate metrics for dashboard visualization.
 */
export type AggregatedMetrics = {
  /** Average response time in ms */
  avgResponseTimeMs: number;
  /** Average quality score */
  avgQualityScore: number;
  /** Total traces */
  totalTraces: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average tokens per trace */
  avgTokens: number;
};

/**
 * Calculate aggregated metrics from a list of performance metrics.
 */
export function aggregateMetrics(metrics: PerformanceMetrics[]): AggregatedMetrics {
  if (metrics.length === 0) {
    return {
      avgResponseTimeMs: 0,
      avgQualityScore: 0,
      totalTraces: 0,
      successRate: 0,
      avgTokens: 0,
    };
  }

  const successful = metrics.filter((m) => m.success);
  const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTimeMs, 0);
  const totalQualityScores = metrics
    .filter((m) => m.qualityScores)
    .reduce((sum, m) => sum + (m.qualityScores?.overall || 0), 0);
  const qualityScoreCount = metrics.filter((m) => m.qualityScores).length;
  const totalTokens = metrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0);

  return {
    avgResponseTimeMs: totalResponseTime / metrics.length,
    avgQualityScore: qualityScoreCount > 0 ? totalQualityScores / qualityScoreCount : 0,
    totalTraces: metrics.length,
    successRate: successful.length / metrics.length,
    avgTokens: totalTokens / metrics.length,
  };
}
