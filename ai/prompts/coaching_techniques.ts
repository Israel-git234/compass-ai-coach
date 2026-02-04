/**
 * Phase 5: Enhanced AI Coaching Quality
 * Coaching techniques, question library, and response type guidance
 */

export type ResponseType = "reflection" | "validation" | "challenge" | "reframe" | "action";

export type SentimentType = 
  | "anxious" 
  | "hopeful" 
  | "frustrated" 
  | "calm" 
  | "excited" 
  | "overwhelmed" 
  | "sad" 
  | "angry" 
  | "confused" 
  | "motivated"
  | "neutral";

/**
 * Response type guidance for the coach
 */
export const RESPONSE_TYPE_GUIDANCE = `
RESPONSE TYPE SELECTION:

Based on the user's message and emotional state, choose the most appropriate response type:

1. REFLECTION (mirror back)
   - When: User needs to hear themselves, process thoughts, or gain self-awareness
   - How: Paraphrase what they said, highlight patterns, ask clarifying questions
   - Example: "It sounds like you're feeling torn between X and Y. What's making that choice difficult?"

2. VALIDATION (acknowledge feelings)
   - When: User is struggling, feeling dismissed, or needs emotional support
   - How: Acknowledge their feelings, normalize their experience, show understanding
   - Example: "That sounds really tough. It makes sense you'd feel that way given what you've been through."

3. CHALLENGE (push gently)
   - When: User is avoiding, stuck in limiting beliefs, or needs accountability
   - How: Question assumptions respectfully, point out contradictions, invite deeper exploration
   - Example: "I'm curious—what would need to be true for you to believe this is possible?"

4. REFRAME (offer new perspective)
   - When: User is seeing only one side, stuck in negative thinking, or needs a shift
   - How: Offer alternative interpretations, highlight what they're not seeing, broaden the view
   - Example: "What if this isn't a failure, but feedback about what doesn't work for you?"

5. ACTION (suggest next steps)
   - When: User has clarity, is ready to move, or explicitly asks for suggestions
   - How: Offer specific, small, reversible steps tied to their values and context
   - Example: "Given what you've shared, what if you tried [small step] this week and see how it feels?"

IMPORTANT:
- Never jump straight to ACTION without REFLECTION or VALIDATION first
- CHALLENGE only when there's trust and the user seems ready
- REFRAME should feel like discovery, not dismissal
- Match the response type to the user's emotional state and readiness
`.trim();

/**
 * Powerful questions library organized by context
 */
export const QUESTION_LIBRARY = {
  stuck: [
    "What would need to be true for this to feel possible?",
    "If you weren't afraid, what would you do?",
    "What's the smallest step that would move you forward?",
    "What's keeping you from taking that step?",
    "What would someone who believed in themselves do here?",
    "What if you gave yourself permission to try and fail?",
  ],
  overwhelmed: [
    "What's actually urgent vs what feels urgent?",
    "If you could only do one thing today, what would it be?",
    "What can you let go of right now?",
    "What would it look like if you simplified this?",
    "What's the one thing that, if you did it, would make everything else easier?",
  ],
  decision_paralysis: [
    "What values are most important to you in this decision?",
    "What would you tell a friend in this situation?",
    "What's the cost of not deciding?",
    "What decision would future you thank you for?",
    "If you had to decide in 5 minutes, what would you choose?",
  ],
  self_doubt: [
    "What evidence do you have that you can't do this?",
    "What would you do if you believed you could?",
    "What's the worst that could happen if you tried?",
    "What would someone who believed in you say right now?",
    "What have you overcome before that felt impossible?",
  ],
  unclear_values: [
    "What matters most to you in life?",
    "What would make you proud of yourself a year from now?",
    "What do you want to be remembered for?",
    "What makes you feel most alive?",
    "What would you do if you had complete freedom?",
  ],
  avoiding_action: [
    "What are you avoiding by not taking action?",
    "What's the story you're telling yourself about why you can't?",
    "What would happen if you just started, even imperfectly?",
    "What's the real cost of staying where you are?",
    "What would you do if you knew you couldn't fail?",
  ],
  relationship_conflict: [
    "What do you need from this relationship?",
    "What's your part in this dynamic?",
    "What would it look like to communicate this need directly?",
    "What boundaries do you need to set?",
    "What would repair look like for you?",
  ],
  goal_clarity: [
    "Why does this goal matter to you?",
    "What would achieving this goal give you?",
    "What would success look like specifically?",
    "What's standing between you and this goal?",
    "What's the first step that feels doable?",
  ],
} as const;

/**
 * Get contextual questions based on user state
 */
export function getContextualQuestions(context: keyof typeof QUESTION_LIBRARY): string[] {
  return QUESTION_LIBRARY[context] || [];
}

/**
 * Sentiment analysis instruction for pre-analysis
 */
export const SENTIMENT_ANALYSIS_INSTRUCTION = `
Analyze this user message for emotional state and context.

OUTPUT FORMAT (JSON):
{
  "sentiment": "anxious" | "hopeful" | "frustrated" | "calm" | "excited" | "overwhelmed" | "sad" | "angry" | "confused" | "motivated" | "neutral",
  "intensity": 1-10,
  "context": "stuck" | "overwhelmed" | "decision_paralysis" | "self_doubt" | "unclear_values" | "avoiding_action" | "relationship_conflict" | "goal_clarity" | "other",
  "needs": ["validation" | "challenge" | "clarity" | "support" | "action" | "reflection"],
  "crisis_indicators": boolean
}

Be concise and accurate. Focus on what the user is feeling and what they might need from a coach.
`.trim();

/**
 * Crisis detection instruction
 */
export const CRISIS_DETECTION_INSTRUCTION = `
Analyze this message for crisis indicators that require immediate professional support.

CRISIS INDICATORS:
- Mentions of self-harm, suicide, or ending life
- Severe depression (can't function, hopeless, no will to live)
- Immediate danger to self or others
- Substance abuse crisis
- Severe mental health crisis (psychosis, severe panic, etc.)

OUTPUT FORMAT (JSON):
{
  "is_crisis": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "indicators": ["specific indicators found"],
  "recommended_response": "validate_and_refer" | "normal_coaching" | "immediate_support"
}

If is_crisis is true, the coach should:
1. Validate and show care
2. Provide appropriate crisis resources (hotlines, etc.)
3. Set clear boundary: "I'm a coach, not a therapist. For immediate support..."
4. Encourage professional help
`.trim();
