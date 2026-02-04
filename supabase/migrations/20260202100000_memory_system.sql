-- Memory & Personalization System
-- Phase 1: Make the AI truly "know" each user

-- ============================================
-- 1) User Goals - Track personal goals
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('career', 'health', 'relationships', 'personal', 'financial', 'spiritual', 'other')),
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_goals_select_own" ON public.user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_goals_insert_own" ON public.user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_goals_update_own" ON public.user_goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_goals_delete_own" ON public.user_goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_status ON public.user_goals(user_id, status);

-- ============================================
-- 2) Session Summaries - AI-generated summaries
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  key_topics TEXT[] DEFAULT '{}',
  emotional_tone TEXT, -- e.g., 'anxious', 'hopeful', 'frustrated', 'calm'
  breakthroughs TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  mood_start INTEGER CHECK (mood_start >= 1 AND mood_start <= 10),
  mood_end INTEGER CHECK (mood_end >= 1 AND mood_end <= 10),
  session_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_summaries_select_own" ON public.session_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "session_summaries_insert_own" ON public.session_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_summaries_update_own" ON public.session_summaries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_session_summaries_user_id ON public.session_summaries(user_id);
CREATE INDEX idx_session_summaries_created_at ON public.session_summaries(user_id, created_at DESC);

-- ============================================
-- 3) Commitments - Things users commit to
-- ============================================
CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE SET NULL,
  commitment TEXT NOT NULL,
  context TEXT, -- Why this commitment matters
  due_date DATE,
  reminder_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'rescheduled')),
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commitments_select_own" ON public.commitments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "commitments_insert_own" ON public.commitments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "commitments_update_own" ON public.commitments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "commitments_delete_own" ON public.commitments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_commitments_user_id ON public.commitments(user_id);
CREATE INDEX idx_commitments_status ON public.commitments(user_id, status);
CREATE INDEX idx_commitments_due_date ON public.commitments(user_id, due_date);

-- ============================================
-- 4) Mood Entries - Simple mood tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  mood_label TEXT, -- 'great', 'good', 'okay', 'low', 'struggling'
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  note TEXT,
  factors TEXT[] DEFAULT '{}', -- e.g., ['work', 'sleep', 'exercise', 'relationships']
  entry_type TEXT DEFAULT 'manual' CHECK (entry_type IN ('manual', 'session_start', 'session_end', 'check_in')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mood_entries_select_own" ON public.mood_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mood_entries_insert_own" ON public.mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON public.mood_entries(user_id, created_at DESC);

-- ============================================
-- 5) User Patterns - Detected patterns
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('emotional', 'behavioral', 'topic', 'temporal')),
  title TEXT NOT NULL, -- e.g., "Work stress on Mondays"
  description TEXT NOT NULL,
  evidence TEXT[] DEFAULT '{}', -- References to sessions/conversations
  frequency TEXT, -- 'daily', 'weekly', 'occasional'
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  first_detected TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_observed INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  user_acknowledged BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_patterns_select_own" ON public.user_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_patterns_insert_own" ON public.user_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_patterns_update_own" ON public.user_patterns
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_patterns_user_id ON public.user_patterns(user_id);
CREATE INDEX idx_user_patterns_type ON public.user_patterns(user_id, pattern_type);

-- ============================================
-- 6) Enhance Profiles with personalization
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coaching_style_preference TEXT DEFAULT 'balanced' CHECK (coaching_style_preference IN ('gentle', 'balanced', 'direct'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS communication_preference TEXT DEFAULT 'text' CHECK (communication_preference IN ('text', 'voice', 'both'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_goals TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS values TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_context TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS morning_checkin_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS evening_checkin_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;

-- ============================================
-- 7) User Memory - Long-term memory storage
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'story', 'relationship', 'challenge', 'win', 'value')),
  content TEXT NOT NULL,
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high', 'critical')),
  source_session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_referenced TIMESTAMPTZ
);

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_memory_select_own" ON public.user_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_memory_insert_own" ON public.user_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_memory_update_own" ON public.user_memory
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_memory_delete_own" ON public.user_memory
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_memory_user_id ON public.user_memory(user_id);
CREATE INDEX idx_user_memory_type ON public.user_memory(user_id, memory_type);
CREATE INDEX idx_user_memory_importance ON public.user_memory(user_id, importance);

-- ============================================
-- 8) Helper function to get user context for AI
-- ============================================
CREATE OR REPLACE FUNCTION get_user_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'display_name', display_name,
        'coaching_style_preference', coaching_style_preference,
        'primary_goals', primary_goals,
        'values', values,
        'life_context', life_context,
        'streak_count', streak_count,
        'total_sessions', total_sessions
      )
      FROM public.profiles
      WHERE id = p_user_id
    ),
    'active_goals', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', title,
        'category', category,
        'status', status
      )), '[]'::jsonb)
      FROM public.user_goals
      WHERE user_id = p_user_id AND status = 'active'
      LIMIT 5
    ),
    'pending_commitments', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'commitment', commitment,
        'due_date', due_date,
        'created_at', created_at
      )), '[]'::jsonb)
      FROM public.commitments
      WHERE user_id = p_user_id AND status = 'pending'
      ORDER BY due_date ASC NULLS LAST
      LIMIT 5
    ),
    'recent_patterns', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', title,
        'description', description,
        'pattern_type', pattern_type
      )), '[]'::jsonb)
      FROM public.user_patterns
      WHERE user_id = p_user_id AND is_active = true
      ORDER BY last_observed DESC
      LIMIT 3
    ),
    'recent_summaries', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'summary', summary,
        'key_topics', key_topics,
        'created_at', created_at
      )), '[]'::jsonb)
      FROM public.session_summaries
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT 3
    ),
    'important_memories', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'content', content,
        'memory_type', memory_type
      )), '[]'::jsonb)
      FROM public.user_memory
      WHERE user_id = p_user_id AND is_active = true AND importance IN ('high', 'critical')
      ORDER BY created_at DESC
      LIMIT 10
    ),
    'recent_mood', (
      SELECT jsonb_build_object(
        'mood_score', mood_score,
        'mood_label', mood_label,
        'created_at', created_at
      )
      FROM public.mood_entries
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
