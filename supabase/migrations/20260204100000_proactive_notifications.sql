-- Phase 4: Proactive Engagement - push notifications and daily touchpoints

-- ============================================
-- 1) Profiles: push token and notification prefs
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS morning_checkin_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS evening_checkin_enabled BOOLEAN DEFAULT FALSE;
-- morning_checkin_time, evening_checkin_time, timezone already exist from memory migration

-- ============================================
-- 2) Daily checkins - morning intention + evening reflection
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
  morning_intention TEXT,
  morning_completed_at TIMESTAMPTZ,
  evening_mood INTEGER CHECK (evening_mood >= 1 AND evening_mood <= 10),
  evening_gratitude TEXT,
  evening_win TEXT,
  evening_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_checkins_select_own" ON public.daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_checkins_insert_own" ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_checkins_update_own" ON public.daily_checkins
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, date DESC);

COMMENT ON TABLE public.daily_checkins IS 'Phase 4: Morning intention and evening reflection per user per day.';
