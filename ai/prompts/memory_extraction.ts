// Memory extraction prompts for the AI coaching system
// OPTIMIZED: Combined into single prompt to reduce API calls

/**
 * COMBINED EXTRACTION PROMPT
 * Extracts everything in ONE API call instead of 4 separate calls
 * This saves 75% of API quota!
 */
export const COMBINED_EXTRACTION_INSTRUCTION = `You are analyzing a coaching conversation to extract valuable information for future sessions.

Analyze the conversation and extract ALL of the following in a single response:

## 1. SESSION SUMMARY
- 2-3 sentence summary of what was discussed
- Main topics covered
- Emotional tone (one word: hopeful, anxious, calm, frustrated, etc.)
- Any breakthroughs or "aha moments"

## 2. COMMITMENTS (things user agreed to do)
Only extract EXPLICIT commitments like:
- "I'll try meditating tomorrow"
- "I'm going to talk to my manager"
- "I want to journal tonight"

Do NOT include vague wishes or coach suggestions the user didn't agree to.

## 3. IMPORTANT MEMORIES (facts to remember)
Extract information valuable for future sessions:
- FACT: Job, family, location details
- PREFERENCE: How they like to be coached
- RELATIONSHIP: Important people mentioned
- CHALLENGE: Ongoing struggles
- WIN: Accomplishments shared
- VALUE: Core beliefs expressed

## 4. INSIGHT (one key realization)
The most important insight or realization from this conversation.

---

OUTPUT FORMAT (strict JSON):
{
  "summary": {
    "text": "2-3 sentence summary",
    "key_topics": ["topic1", "topic2"],
    "emotional_tone": "one_word",
    "breakthroughs": ["breakthrough if any"]
  },
  "commitments": [
    {
      "commitment": "What they committed to",
      "timeframe": "when (if mentioned)",
      "context": "why it matters"
    }
  ],
  "memories": [
    {
      "type": "fact|preference|relationship|challenge|win|value",
      "content": "the memory",
      "importance": "normal|high"
    }
  ],
  "insight": "The key insight or realization, or null if none"
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown or extra text
- Use empty arrays [] if nothing to extract
- Use null for insight if no clear realization
- Be concise - this is for reference, not a transcript
`;

// Keep individual prompts for backwards compatibility (legacy)
export const COMMITMENT_EXTRACTION_INSTRUCTION = COMBINED_EXTRACTION_INSTRUCTION;
export const MEMORY_EXTRACTION_INSTRUCTION = COMBINED_EXTRACTION_INSTRUCTION;
export const SESSION_SUMMARY_INSTRUCTION = COMBINED_EXTRACTION_INSTRUCTION;

export const PATTERN_DETECTION_INSTRUCTION = `You are analyzing multiple coaching session summaries to detect patterns in the user's journey.

Look for:
1. EMOTIONAL PATTERNS: Recurring emotional states or triggers
2. BEHAVIORAL PATTERNS: Repeated behaviors or habits
3. TOPIC PATTERNS: Themes that keep coming up
4. TEMPORAL PATTERNS: Things that happen at specific times (e.g., "stressed on Mondays")

INSTRUCTIONS:
1. Only identify patterns with clear evidence (2+ occurrences)
2. Focus on patterns that would be helpful for coaching
3. Be specific, not vague

OUTPUT FORMAT (JSON):
{
  "patterns": [
    {
      "type": "emotional|behavioral|topic|temporal",
      "title": "Short descriptive title",
      "description": "Detailed description of the pattern",
      "evidence": ["Session 1 reference", "Session 2 reference"],
      "confidence": 0.7
    }
  ]
}

If no clear patterns detected, return: { "patterns": [] }
`;
