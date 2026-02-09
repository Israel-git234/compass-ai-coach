# Commit to Change: Comet Resolution v2 Hackathon

**Encode Club + Comet** · [$30,000 in prizes](https://www.encodeclub.com/programmes/comet-resolution-v2-hackathon)

## What is it?

Build AI that turns New Year’s resolutions into real results. Compass fits **Personal Growth & Learning** and **Productivity & Work Habits**.

## What we did

- **Opik integration** for LLM observability:
  - Every coach turn is logged as a **trace** to Opik (user message → coach response).
  - Traces include session type, coach id, conversation id, model name.
  - Implemented in `opik/trace.ts` and called from the `coach-turn` Supabase Edge Function.

## Project layout (Opik-related)

```
opik/
  trace.ts    # REST API client to send traces to Opik
  README.md   # Opik setup and config

supabase/functions/coach-turn/
  index.ts    # Calls logCoachTurnTrace() after each coach response
```

No change to app structure was required; we only added the `opik/` folder and one integration point in the Edge Function.

## Configuration

In **Supabase** → **Edge Functions** → **coach-turn** → **Secrets**:

- `OPIK_API_KEY` – Opik Cloud API key (get it from [comet.com/opik](https://www.comet.com/opik))
- `OPIK_WORKSPACE` – (optional) workspace name

If `OPIK_API_KEY` is missing, tracing is skipped and the app works as before.

## Judging (relevant criteria)

- **Evaluation and observability**: Opik tracing is implemented; every coach turn is visible in Opik.
- **Goal alignment**: Traces are tagged by session type and conversation for analysis.
- **Best Use of Opik**: Optional next steps:
  - Opik Experiments to evaluate coach quality (e.g. relevance, safety).
  - LLM-as-judge evals on a sample of traces.
  - Dashboards in Opik to show metrics in the demo.

## Links

- [Hackathon page](https://www.encodeclub.com/programmes/comet-resolution-v2-hackathon)
- [Opik docs](https://www.comet.com/docs/opik)
- [Opik quickstart](https://www.comet.com/docs/opik/quickstart)
- [Opik REST API](https://www.comet.com/docs/opik/reference/rest-api/overview)

## Branch

Work for this hackathon is on the **`encode-opik`** branch.
