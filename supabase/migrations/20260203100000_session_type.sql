-- Phase 3: Smart Session Types - add session_type to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS session_type TEXT
  DEFAULT 'deep_dive'
  CHECK (session_type IN (
    'quick_checkin',
    'deep_dive',
    'reflection',
    'goal_review',
    'celebration',
    'grounding'
  ));

COMMENT ON COLUMN public.conversations.session_type IS 'Phase 3: Type of coaching session (quick_checkin, deep_dive, reflection, goal_review, celebration, grounding).';
