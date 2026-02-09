# Judge Testing Guide - Compass AI Coach

## 🎯 Overview

This guide helps judges test Compass AI Coach and verify the comprehensive Opik integration for the **Commit to Change: Comet Resolution v2** hackathon.

---

## 📱 How to Access the App

### Option 1: Mobile App (Recommended)
1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Open the app** using one of these methods:
   - **Expo Link**: `exp://exp.host/@your-username/compass-ai-coach`
   - **QR Code**: Scan QR code from Expo dashboard
   - **Direct Link**: Open link in Expo Go app

### Option 2: Web Version (If Available)
- **Web URL**: [To be provided in submission]
- Open in any modern browser (Chrome, Firefox, Safari, Edge)

### Option 3: Demo Video
- **Video URL**: [To be provided in submission]
- Shows complete walkthrough of app + Opik integration

---

## ✅ Testing Checklist

### 1. Basic App Functionality (5 minutes)

**Test Steps:**
1. **Sign Up / Log In**
   - Create account or use test credentials
   - Complete onboarding flow

2. **Start a Coaching Session**
   - Tap "Start Coaching Session"
   - Select a session type (e.g., "Reflection" or "Deep Dive")
   - Send a message: *"I'm feeling overwhelmed with work lately"*

3. **Verify Coach Response**
   - ✅ Coach responds with relevant, coaching-focused message
   - ✅ Response is appropriate for selected session type
   - ✅ Tone is supportive and non-therapeutic

4. **Test Additional Features**
   - ✅ View commitments/goals
   - ✅ Check Journey/Progress screen
   - ✅ Explore Memory Vault (privacy controls)

**Expected Result:** App works smoothly, coach provides helpful responses.

---

## 🔍 Verifying Opik Integration (10 minutes)

### Step 1: Access Opik Dashboard

**For Judges:**
1. **Opik Dashboard Access** (one of these):
   - **Shared Dashboard Link**: [To be provided in submission]
   - **Screenshots**: Included in submission materials
   - **Demo Video**: Shows Opik dashboard in action

2. **If you have access**, go to:
   - [https://www.comet.com/opik](https://www.comet.com/opik)
   - Navigate to project: `compass-ai-coach`
   - Or use shared dashboard link

### Step 2: Verify Traces Are Being Created

**In Opik Dashboard → Traces Tab:**

1. **Send a test message** in the app:
   - "I want to improve my work-life balance"

2. **Wait 10-30 seconds** for trace to appear

3. **Check Traces Tab** - You should see:
   - ✅ Trace name: `compass-coach-turn`
   - ✅ Input: Your user message
   - ✅ Output: Coach response
   - ✅ Metadata includes:
     - `model`: e.g., "gemini-3-flash-preview"
     - `session_type`: e.g., "reflection"
     - `coach_id`: Coach identifier
     - `conversation_id`: Thread ID

**Expected Result:** New traces appear within 30 seconds of sending messages.

---

### Step 3: Verify LLM-as-Judge Evaluations

**In Trace Detail View:**

1. **Click on any trace** to open details

2. **Check Metadata Section** - Look for:
   - ✅ `evaluation_relevance`: Score 1-5
   - ✅ `evaluation_tone`: Score 1-5
   - ✅ `evaluation_safety`: Score 1-5
   - ✅ `evaluation_helpfulness`: Score 1-5
   - ✅ `evaluation_overall`: Average score
   - ✅ `evaluation_explanation`: Brief explanation

**Expected Result:** Every coach response has evaluation scores in metadata.

**Example:**
```json
{
  "evaluation_relevance": 4,
  "evaluation_tone": 5,
  "evaluation_safety": 5,
  "evaluation_helpfulness": 4,
  "evaluation_overall": 4.5,
  "evaluation_explanation": "Response is highly relevant, maintains appropriate coaching tone..."
}
```

---

### Step 4: Verify Experiment Tracking

**In Opik Dashboard → Experiments Tab:**

1. **Check Experiments List** - You should see:
   - ✅ Experiment name like: `compass-gemini-3-flash-preview-temp0.7-promptv1`
   - ✅ Multiple experiments if different models/configs were tested

2. **Click on an Experiment** - You should see:
   - ✅ All traces grouped under this experiment
   - ✅ Aggregated metrics
   - ✅ Comparison capabilities

**Expected Result:** Experiments automatically created and traces grouped by model/configuration.

---

### Step 5: Verify Performance Metrics

**In Trace Detail View → Metadata:**

Look for performance metrics:
- ✅ `response_time_ms`: Response time in milliseconds
- ✅ `input_tokens`: Estimated input tokens
- ✅ `output_tokens`: Estimated output tokens
- ✅ `total_tokens`: Total token usage

**Expected Result:** Every trace includes performance metrics.

---

### Step 6: Verify Comprehensive Tracing

**Check for Multiple Trace Types:**

In Traces Tab, filter or search for:
- ✅ `compass-coach-turn` - Main coaching interactions
- ✅ `memory-extraction` - Memory extraction calls
- ✅ `sentiment-analysis` - Sentiment analysis calls
- ✅ `crisis-detection` - Safety monitoring calls

**Expected Result:** All LLM calls are traced, not just coach responses.

---

### Step 7: View Dashboards (If Created)

**In Opik Dashboard → Dashboards:**

1. **Open "Compass AI Coach - Overview"** dashboard (if available)

2. **Check Panels:**
   - ✅ Quality Scores Over Time (line chart)
   - ✅ Safety Monitoring (bar chart)
   - ✅ Response Time Distribution (histogram)
   - ✅ Session Type Distribution (pie chart)

**Expected Result:** Visual dashboards showing metrics and trends.

---

## 🎯 Key Features to Verify

### ✅ Comprehensive Tracing
- **Every LLM call is traced** (coach, memory, sentiment, crisis)
- Traces include rich metadata
- Thread grouping works correctly

### ✅ LLM-as-Judge Evaluations
- **Every coach response is evaluated** on 4 dimensions
- Scores appear in trace metadata
- Evaluations are non-blocking (don't slow down responses)

### ✅ Experiment Tracking
- **Automatic experiment creation** for model/config combinations
- Traces grouped by experiment
- Easy comparison between experiments

### ✅ Performance Metrics
- Response time tracking
- Token usage monitoring
- Success rate analysis

### ✅ Safety Monitoring
- Crisis detection traces
- Safety score tracking
- Boundary violation detection

---

## 📊 What Judges Should See

### In the App:
- ✅ Smooth coaching interactions
- ✅ Relevant, helpful responses
- ✅ Appropriate coaching tone
- ✅ No errors or crashes

### In Opik Dashboard:
- ✅ Traces appearing in real-time
- ✅ Evaluation scores in metadata
- ✅ Experiments automatically created
- ✅ Performance metrics tracked
- ✅ Multiple trace types visible
- ✅ Dashboards showing trends (if created)

---

## 🔗 Resources for Judges

### Code Repository
- **GitHub**: https://github.com/Israel-git234/compass-ai-coach
- **Branch**: `encode-opik`
- **Key Files**:
  - `opik/evaluations.ts` - LLM-as-judge implementation
  - `opik/experiments.ts` - Experiment tracking
  - `opik/metrics.ts` - Performance metrics
  - `opik/trace.ts` - Core tracing
  - `supabase/functions/coach-turn/index.ts` - Integration point

### Documentation
- `OPIK_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `OPIK_TESTING_GUIDE.md` - Testing instructions
- `opik/README.md` - Opik setup guide

### Demo Video
- Shows app functionality
- Demonstrates Opik integration
- Highlights key features

---

## ⚠️ Troubleshooting for Judges

### If Traces Don't Appear:
1. **Wait 30-60 seconds** - Traces may take time to appear
2. **Check project name** - Ensure viewing correct Opik project
3. **Refresh dashboard** - Click refresh button
4. **Check demo video** - Shows traces working

### If Evaluation Scores Missing:
- Evaluations run asynchronously
- May take 10-30 seconds after trace appears
- Check trace metadata after waiting

### If Can't Access Opik Dashboard:
- **Use screenshots** provided in submission
- **Watch demo video** - Shows dashboard in action
- **Check GitHub code** - Verify implementation

---

## ✅ Submission Verification

Judges can verify the submission by:

1. **✅ Testing the app** - Verify it works
2. **✅ Reviewing Opik dashboard** - See traces, evaluations, experiments
3. **✅ Checking GitHub code** - Review implementation
4. **✅ Watching demo video** - See complete walkthrough
5. **✅ Reading documentation** - Understand architecture

---

## 🎯 Judging Criteria Alignment

### Evaluation and Observability ✅
- **Comprehensive tracing** - Every LLM call traced
- **LLM-as-judge evaluations** - Automatic quality assessment
- **Performance metrics** - Response time, token usage
- **Safety monitoring** - Crisis detection

### Goal Alignment ✅
- **Opik integrated into workflow** - Automatic tracing
- **Systematic improvement** - Experiment tracking
- **Meaningful insights** - Dashboards and metrics
- **Production-ready** - Non-blocking, error-handled

### Best Use of Opik ✅
- **Comprehensive coverage** - All LLM calls traced
- **Multiple evaluation dimensions** - Relevance, tone, safety, helpfulness
- **Automatic experiment tracking** - Model/configuration comparison
- **Rich metrics** - Performance and quality tracking
- **Safety focus** - Crisis detection and boundary monitoring

---

## 📞 Contact

If judges have questions or need assistance:
- **GitHub Issues**: [Repository Issues](https://github.com/Israel-git234/compass-ai-coach/issues)
- **Documentation**: See `OPIK_IMPLEMENTATION_SUMMARY.md` in repository

---

**Thank you for reviewing our submission! 🚀**
