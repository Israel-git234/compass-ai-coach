# How Judges Will Test Your App

## 🎯 Quick Summary

Judges will test your app in **3 ways**:

1. **Use the app** (mobile or web) - Test functionality
2. **View Opik dashboard** - Verify integration works
3. **Review code** - Check implementation quality

---

## 📱 Option 1: Mobile App Testing

### What Judges Need:
- **Expo Go app** installed on their phone
- **Your Expo link** or QR code

### What They'll Do:
1. Open app via Expo Go
2. Sign up / log in
3. Send messages to coach
4. Test features (commitments, journey, etc.)

### What They'll Verify:
- ✅ App works smoothly
- ✅ Coach provides helpful responses
- ✅ Features function correctly

---

## 🔍 Option 2: Opik Dashboard Verification

### What Judges Need:
- **Access to Opik dashboard** (shared link or screenshots)
- **Or watch demo video** showing dashboard

### What They'll Check:

**1. Traces Tab:**
- ✅ Traces appear when messages are sent
- ✅ Traces include user message + coach response
- ✅ Metadata shows model, session type, etc.

**2. Trace Details:**
- ✅ **Evaluation scores** in metadata:
  - `evaluation_relevance` (1-5)
  - `evaluation_tone` (1-5)
  - `evaluation_safety` (1-5)
  - `evaluation_helpfulness` (1-5)
  - `evaluation_overall` (average)

**3. Experiments Tab:**
- ✅ Experiments automatically created
- ✅ Traces grouped by model/configuration
- ✅ Comparison capabilities

**4. Performance Metrics:**
- ✅ `response_time_ms`
- ✅ `input_tokens`, `output_tokens`, `total_tokens`

**5. Multiple Trace Types:**
- ✅ `compass-coach-turn` (main interactions)
- ✅ `memory-extraction` (if applicable)
- ✅ `sentiment-analysis` (if applicable)
- ✅ `crisis-detection` (safety checks)

---

## 💻 Option 3: Code Review

### What Judges Will Check:

**GitHub Repository:**
- ✅ `opik/evaluations.ts` - LLM-as-judge implementation
- ✅ `opik/experiments.ts` - Experiment tracking
- ✅ `opik/metrics.ts` - Performance metrics
- ✅ `opik/trace.ts` - Core tracing
- ✅ `supabase/functions/coach-turn/index.ts` - Integration

**Documentation:**
- ✅ `OPIK_IMPLEMENTATION_SUMMARY.md` - Implementation details
- ✅ `JUDGE_TESTING_GUIDE.md` - Testing instructions
- ✅ `opik/README.md` - Setup guide

---

## 🎥 Option 4: Demo Video

### What Judges Will Watch:
- ✅ App walkthrough
- ✅ Opik dashboard demonstration
- ✅ Traces appearing in real-time
- ✅ Evaluation scores highlighted
- ✅ Experiments and dashboards shown

---

## ✅ What You Need to Provide

### In Your Submission:

1. **App Access:**
   - Expo link: `exp://exp.host/@your-username/compass-ai-coach`
   - OR TestFlight/Play Store link
   - OR Web URL

2. **Opik Dashboard:**
   - Shared dashboard link (if possible)
   - OR Screenshots of traces/evaluations/experiments
   - OR Demo video showing dashboard

3. **GitHub Repository:**
   - Public repo link
   - Branch: `encode-opik`

4. **Demo Video:**
   - YouTube/Vimeo link
   - Shows app + Opik integration

5. **Documentation:**
   - `JUDGE_TESTING_GUIDE.md` (this file)
   - `OPIK_IMPLEMENTATION_SUMMARY.md`
   - Clear instructions for judges

---

## 🎯 Key Points for Judges

### What Makes Your Submission Stand Out:

1. **Comprehensive Coverage**
   - Every LLM call is traced (not just coach responses)
   - Multiple trace types visible

2. **LLM-as-Judge Evaluations**
   - Automatic evaluation on 4 dimensions
   - Scores appear in trace metadata
   - Non-blocking (doesn't slow down app)

3. **Automatic Experiment Tracking**
   - Experiments created automatically
   - Easy model/configuration comparison

4. **Production-Ready**
   - Error handling
   - Non-blocking operations
   - Comprehensive logging

5. **Safety Focus**
   - Crisis detection
   - Safety score tracking
   - Boundary monitoring

---

## 📋 Judge Checklist

Judges will verify:

- [ ] App works and is functional
- [ ] Traces appear in Opik dashboard
- [ ] Evaluation scores are present
- [ ] Experiments are tracked
- [ ] Performance metrics are logged
- [ ] Multiple trace types exist
- [ ] Code is well-documented
- [ ] Implementation is production-ready

---

## 🚀 Next Steps for You

1. **Make sure app is accessible:**
   - Publish Expo update
   - OR deploy web version
   - OR provide TestFlight/Play Store link

2. **Prepare Opik dashboard:**
   - Create shared dashboard link (if possible)
   - OR take screenshots
   - OR ensure demo video shows dashboard

3. **Update submission:**
   - Include all access links
   - Add `JUDGE_TESTING_GUIDE.md` to repo
   - Make sure demo video is accessible

4. **Test everything yourself:**
   - Use the app as a judge would
   - Check Opik dashboard
   - Verify all links work

---

## 💡 Pro Tips

1. **Make it easy for judges:**
   - Provide clear instructions
   - Include all necessary links
   - Test everything before submitting

2. **Show Opik integration prominently:**
   - Highlight in demo video
   - Include screenshots
   - Explain in description

3. **Document well:**
   - Clear code comments
   - Comprehensive README
   - Testing guide for judges

---

**You're ready! Judges have everything they need to test your app and verify the Opik integration! 🎉**
