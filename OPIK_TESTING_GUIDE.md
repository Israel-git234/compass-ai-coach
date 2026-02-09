# Opik Integration - Testing & Verification Guide

## ✅ You've Done:
- ✅ Added `OPIK_API_KEY` to Supabase secrets
- ✅ Deployed `coach-turn` Edge Function

## 🧪 Next Steps: Test & Verify

### Step 1: Test with a Real Coach Turn

1. **Open your app** (mobile or web)
2. **Start a coaching session** - send a message to the coach
3. **Wait for the coach response**

This will trigger the Opik integration automatically!

### Step 2: Verify Traces in Opik Dashboard

1. **Go to Opik Dashboard**: [https://www.comet.com/opik](https://www.comet.com/opik)
2. **Navigate to your project**: `compass-ai-coach` (or your project name)
3. **Click on "Traces"** in the sidebar
4. **You should see**:
   - ✅ A new trace for your coach turn
   - ✅ User message in the input
   - ✅ Coach response in the output
   - ✅ Metadata (model, session type, coach ID)
   - ✅ Tags: `coach-turn`, `compass`, and session type

**If you don't see traces:**
- Check Supabase Edge Function logs for errors
- Verify `OPIK_API_KEY` is correctly set in secrets
- Check the trace name matches your project name

### Step 3: Check Evaluations (Optional but Recommended)

**For LLM-as-judge evaluations to work, you need:**

1. **Add `GEMINI_API_KEY` to Supabase secrets** (if not already there)
   - This is used for the evaluation LLM calls
   - Same key you use for the main coach responses

2. **Verify evaluation is enabled** (default: enabled)
   - Set `OPIK_ENABLE_EVALUATION=true` in Supabase secrets (optional, it's the default)
   - To disable: `OPIK_ENABLE_EVALUATION=false`

3. **After a coach turn, check trace metadata:**
   - Look for `evaluation_relevance`, `evaluation_tone`, `evaluation_safety`, `evaluation_helpfulness`
   - These should be scores from 1-5
   - `evaluation_overall` is the average

**If evaluations aren't working:**
- Check `GEMINI_API_KEY` is set
- Check Edge Function logs for evaluation errors
- Evaluations run async, so they won't block the response

### Step 4: Check Experiments

1. **In Opik Dashboard, go to "Experiments"**
2. **You should see an experiment** like:
   - `compass-gemini-3-flash-preview-temp0.7-promptv1`
   - Or similar based on your model configuration

3. **Click on the experiment** to see:
   - All traces grouped by this experiment
   - Metrics aggregated for this configuration
   - Comparison with other experiments

### Step 5: View Metrics

**In each trace, check the metadata for:**

- `response_time_ms` - How long the response took
- `input_tokens` - Estimated input tokens
- `output_tokens` - Estimated output tokens
- `total_tokens` - Total token usage
- `evaluation_*` - Quality scores (if evaluations enabled)

### Step 6: Create Dashboards for Demo

**For the hackathon demo, create visualizations:**

1. **In Opik Dashboard, go to "Dashboards"**
2. **Create a new dashboard** (e.g., "Compass AI Coach - Hackathon Demo")
3. **Add panels for:**
   - **Quality Scores Over Time**: Line chart of `evaluation_overall`
   - **Safety Monitoring**: Bar chart of `evaluation_safety` scores
   - **Response Time**: Histogram of `response_time_ms`
   - **Session Type Distribution**: Pie chart by session type tag
   - **Model Comparison**: Compare experiments side-by-side

4. **Save the dashboard** for your demo video

## 🔍 Troubleshooting

### No Traces Appearing?

1. **Check Supabase Edge Function logs:**
   ```bash
   # In Supabase dashboard → Edge Functions → coach-turn → Logs
   # Look for "Opik trace" messages
   ```

2. **Verify API key:**
   - Make sure `OPIK_API_KEY` is set correctly
   - No extra spaces or quotes
   - Key should start with your workspace identifier

3. **Check project name:**
   - Default project: `compass-ai-coach`
   - Make sure this matches your Opik project name

### Evaluations Not Working?

1. **Check `GEMINI_API_KEY` is set** in Supabase secrets
2. **Check logs** for evaluation errors
3. **Verify `OPIK_ENABLE_EVALUATION` is not set to `false`**
4. **Note**: Evaluations are async and may take a few seconds

### Experiments Not Creating?

1. **Check Opik API permissions** - your API key needs experiment creation permissions
2. **Check logs** for experiment creation errors
3. **Experiments are created lazily** - first trace for a model config creates the experiment

## 📊 What to Look For in Opik

### Successful Integration Shows:

✅ **Traces Tab:**
- Every coach turn appears as a trace
- Full conversation context (thread_id groups related traces)
- Rich metadata with all evaluation scores and metrics

✅ **Experiments Tab:**
- Automatic experiment creation per model/configuration
- Easy comparison of different model versions
- Aggregated metrics per experiment

✅ **Metrics:**
- Response time trends
- Quality score distributions
- Token usage analytics
- Success rate monitoring

✅ **Safety Monitoring:**
- Safety flags in trace metadata
- Safety score trends over time
- Boundary violation detection

## 🎥 For Hackathon Demo

**When recording your demo video, show:**

1. **Opik Dashboard Overview**
   - Show traces appearing in real-time
   - Demonstrate trace detail view

2. **Evaluation System**
   - Show quality scores in trace metadata
   - Explain the 4 dimensions (relevance, tone, safety, helpfulness)

3. **Experiments**
   - Show automatic experiment creation
   - Compare different model configurations

4. **Dashboards**
   - Show custom dashboards with metrics
   - Demonstrate data-driven insights

5. **Safety Monitoring**
   - Show safety flag detection
   - Explain how it helps maintain boundaries

## ✅ Verification Checklist

- [ ] Traces appear in Opik after coach turns
- [ ] Trace metadata includes model, session type, coach ID
- [ ] Experiments are created automatically
- [ ] Evaluations are running (if `GEMINI_API_KEY` is set)
- [ ] Quality scores appear in trace metadata
- [ ] Performance metrics are logged (response time, tokens)
- [ ] Dashboards created for demo
- [ ] No errors in Edge Function logs

## 🚀 You're Ready!

Once you see traces appearing in Opik, you're all set! The integration is working and you can:

1. **Continue using the app** - all coach turns will be logged
2. **Build up data** - more traces = better insights
3. **Create dashboards** - showcase the data in your demo
4. **Compare experiments** - test different models/prompts
5. **Submit to hackathon** - highlight the Opik integration!

---

**Need help?** Check the logs in Supabase Edge Functions for any error messages.
