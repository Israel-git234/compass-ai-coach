# Opik Integration - Best Use of Opik Implementation

This folder contains the **comprehensive Opik integration** for the [Commit to Change: Comet Resolution v2](https://www.encodeclub.com/programmes/comet-resolution-v2-hackathon) hackathon, designed to showcase exceptional implementation of evaluation and observability.

## 🎯 What is Opik?

Opik is Comet's open-source LLM observability and evaluation platform. This implementation demonstrates:

- ✅ **Systematic tracking** of experiments and model versions
- ✅ **LLM-as-judge evaluations** for agent performance measurement
- ✅ **Data-driven insights** through metrics and dashboards
- ✅ **Continuous improvement** via experiment comparison

## 📦 Implementation Overview

### Core Components

1. **`trace.ts`** – Enhanced trace logging with evaluations, metrics, and experiments
2. **`trace-wrapper.ts`** – SDK-like wrapper functions for easy tracing of any LLM call
3. **`evaluations.ts`** – LLM-as-judge evaluation system (relevance, tone, safety, helpfulness)
4. **`experiments.ts`** – Opik Experiments API integration for tracking model/prompt variations
5. **`metrics.ts`** – Performance metrics calculation (response time, token usage, quality scores)

### How It Works

For every coach turn:

1. **Trace Creation**: Logs user message → coach response with full context
2. **Experiment Tracking**: Automatically creates/uses experiments for model configurations
3. **LLM-as-Judge Evaluation**: Evaluates response quality on 4 dimensions (async, non-blocking)
4. **Metrics Calculation**: Computes performance metrics (response time, tokens, quality scores)
5. **Comprehensive Logging**: Sends all data to Opik with metadata, tags, and experiment IDs

**Comprehensive Coverage**: All LLM calls are automatically traced:
- ✅ Coach turn responses (with evaluations)
- ✅ Memory extraction calls
- ✅ Sentiment analysis calls
- ✅ Crisis detection calls

## 🔍 Evaluation System

### LLM-as-Judge Evaluations

Each coach response is automatically evaluated on four dimensions:

- **Relevance** (1-5): How well does the response address the user's message?
- **Tone** (1-5): Is the tone appropriate for the coaching context?
- **Safety** (1-5): Does the response maintain safety boundaries?
- **Helpfulness** (1-5): How helpful is the response for the user's goals?

**Overall Score**: Average of all four dimensions

### Evaluation Features

- ✅ Automatic evaluation after each coach response
- ✅ Safety flag detection for boundary violations
- ✅ Detailed explanations for each dimension
- ✅ Non-blocking (async) to avoid impacting user experience
- ✅ Configurable via `OPIK_ENABLE_EVALUATION` env var

## 📊 Experiments & Model Tracking

### Automatic Experiment Management

The system automatically creates Opik experiments for different model configurations:

- **Experiment naming**: `compass-{model}-temp{temperature}-prompt{version}`
- **Example**: `compass-gemini-3-flash-preview-temp0.7-promptv1`
- **Metadata tracking**: Model, temperature, prompt version, and custom metadata

### Use Cases

- Compare different model versions (e.g., `gemini-3-flash-preview` vs `gemini-2.5-flash`)
- Track prompt improvements across versions
- A/B test temperature settings
- Monitor performance across different configurations

## 📈 Metrics & Performance Tracking

### Tracked Metrics

- **Response Time**: Latency in milliseconds
- **Token Usage**: Input/output/total tokens (estimated)
- **Quality Scores**: From LLM-as-judge evaluations
- **Success Rate**: Percentage of successful responses
- **Error Tracking**: Failed requests with error details

### Metrics in Opik Dashboard

All metrics are automatically logged to Opik metadata and can be:
- Visualized in Opik dashboards
- Compared across experiments
- Used for regression testing
- Tracked over time for trends

## 🚀 Configuration

### Required Environment Variables

Set these in **Supabase Edge Function secrets**:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPIK_API_KEY` | Your Opik Cloud API key | ✅ Yes |
| `OPIK_WORKSPACE` | Workspace name | ❌ Optional |
| `OPIK_URL_OVERRIDE` | Custom Opik API URL | ❌ Optional (default: `https://www.comet.com/opik/api`) |
| `OPIK_ENABLE_EVALUATION` | Enable LLM-as-judge evaluations (`true`/`false`) | ❌ Optional (default: `true`) |
| `GEMINI_API_KEY` | Gemini API key for evaluations | ✅ Yes (if evaluations enabled) |
| `GEMINI_EVAL_MODEL` | Model for evaluations | ❌ Optional (default: `gemini-2.5-flash`) |

### Opik Cloud Setup

1. Sign up at [comet.com/opik](https://www.comet.com/signup?from=llm)
2. Create a project (e.g. `compass-ai-coach`)
3. Copy your API key from workspace settings
4. Add `OPIK_API_KEY` to Supabase Edge Function secrets
5. (Optional) Add `OPIK_WORKSPACE` if using a specific workspace
6. Redeploy the `coach-turn` Edge Function

## 📋 Trace Data Structure

Each trace sent to Opik includes:

### Input
- User message (truncated to 2000 chars)
- Session type
- Coach ID

### Output
- Coach response (truncated to 4000 chars)

### Metadata
- Model name
- Session type
- Coach ID
- **Evaluation scores** (relevance, tone, safety, helpfulness, overall)
- **Performance metrics** (response time, token counts)
- **Experiment ID**
- Temperature setting
- Safety flags (if any)

### Tags
- `coach-turn`
- `compass`
- Session type (e.g., `deep_dive`, `quick_checkin`)

### Thread ID
- Conversation ID (for grouping related traces)

## 🎨 Opik Dashboard Features

### Traces View
- See every coach turn with full context
- Filter by session type, coach, or experiment
- View evaluation scores and metrics inline

### Experiments View
- Compare model versions side-by-side
- Track quality improvements over time
- Identify best-performing configurations

### Metrics Dashboard
- Average response time trends
- Quality score distributions
- Success rate monitoring
- Token usage analytics

### Evaluation Insights
- Safety flag frequency
- Tone appropriateness by session type
- Relevance scores by coach
- Helpfulness trends over time

## 🔧 Advanced Usage

### Custom Experiments

Create custom experiments for specific tests:

```typescript
import { getOrCreateExperiment } from "./opik/experiments.ts";

const experimentId = await getOrCreateExperiment({
  experimentName: "custom-prompt-test-v2",
  metadata: {
    promptVersion: "v2",
    customFeature: "enhanced-memory",
  },
});
```

### Manual Evaluation

Run evaluations manually for specific responses:

```typescript
import { evaluateCoachResponse } from "./opik/evaluations.ts";

const evaluation = await evaluateCoachResponse({
  userMessage: "I'm feeling overwhelmed",
  coachResponse: "I hear you...",
  sessionType: "deep_dive",
  coachId: "clarity",
  geminiApiKey: "...",
});
```

### Metrics Aggregation

Calculate aggregated metrics for analysis:

```typescript
import { aggregateMetrics } from "./opik/metrics.ts";

const aggregated = aggregateMetrics(metricsArray);
// Returns: avgResponseTimeMs, avgQualityScore, successRate, etc.
```

## 🏆 Hackathon Submission: Best Use of Opik

This implementation demonstrates:

### ✅ Functionality
- Fully functional evaluation and observability system
- Stable, production-ready integration
- Non-blocking async operations

### ✅ Real-world Relevance
- Practical for monitoring AI coaching quality
- Helps identify safety issues and quality problems
- Enables data-driven improvements

### ✅ Use of LLMs/Agents
- LLM-as-judge for systematic evaluation
- Multi-dimensional quality assessment
- Automated safety monitoring

### ✅ Evaluation and Observability
- **Comprehensive tracing**: Every coach turn logged with full context
- **LLM-as-judge evaluations**: 4-dimensional quality assessment
- **Opik Experiments**: Systematic tracking of model/prompt variations
- **Performance metrics**: Response time, token usage, quality scores
- **Safety monitoring**: Automatic flag detection

### ✅ Goal Alignment
- **Systematic tracking**: Experiments automatically created for configurations
- **Model version comparison**: Easy A/B testing of different models
- **Evaluation runs**: Every response evaluated automatically
- **Meaningful insights**: Quality scores, safety flags, performance trends
- **Dashboards**: All data visible in Opik for judging

## 📚 Documentation Links

- [Opik Documentation](https://www.comet.com/docs/opik)
- [Opik Evaluation Guide](https://www.comet.com/docs/opik/evaluation/overview)
- [Opik Tracing Guide](https://www.comet.com/docs/opik/tracing/log_traces)
- [Opik Experiments](https://www.comet.com/docs/opik/experiments)
- [Opik REST API](https://www.comet.com/docs/opik/reference/rest-api/overview)

## 🎯 Next Steps

1. **Set up Opik Cloud account** and get API key
2. **Configure environment variables** in Supabase
3. **Deploy the Edge Function** with Opik integration
4. **View traces in Opik dashboard** after first coach turn
5. **Create custom dashboards** for hackathon demo
6. **Compare experiments** to show systematic improvement

---

**Ready to showcase exceptional Opik implementation! 🚀**
