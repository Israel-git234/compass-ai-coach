-- Marketplace & User-Created Coach System
-- Extends coaches table and adds ownership tracking

-- 1) Extend coaches table with marketplace fields
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS coach_type text NOT NULL DEFAULT 'system' CHECK (coach_type IN ('system', 'private', 'creator'));
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS price_type text CHECK (price_type IN ('free', 'one_time', 'subscription'));
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS price_amount numeric(10,2);
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS preview_message text;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS coaching_rules jsonb;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS philosophy text;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS style_config jsonb; -- {tone, pacing, challenge_level}
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS focus_areas text[];
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS rating_average numeric(3,2);
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS intended_use text; -- life, work, faith, study, etc.

-- Update existing coaches to be system type
UPDATE public.coaches SET coach_type = 'system' WHERE coach_type IS NULL;

-- 2) Coach Ownership table (tracks which users own which coaches)
CREATE TABLE IF NOT EXISTS public.coach_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  purchase_price numeric(10,2),
  purchase_type text CHECK (purchase_type IN ('free', 'one_time', 'subscription')),
  UNIQUE(user_id, coach_id)
);

ALTER TABLE public.coach_ownership ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_ownership_select_own" ON public.coach_ownership;
CREATE POLICY "coach_ownership_select_own"
  ON public.coach_ownership
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "coach_ownership_insert_own" ON public.coach_ownership;
CREATE POLICY "coach_ownership_insert_own"
  ON public.coach_ownership
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_ownership_user_id ON public.coach_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_ownership_coach_id ON public.coach_ownership(coach_id);

-- 3) Coach Ratings table (for reviews)
CREATE TABLE IF NOT EXISTS public.coach_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, coach_id)
);

ALTER TABLE public.coach_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_ratings_select_all" ON public.coach_ratings;
CREATE POLICY "coach_ratings_select_all"
  ON public.coach_ratings
  FOR SELECT
  USING (true); -- Ratings are public

DROP POLICY IF EXISTS "coach_ratings_insert_own" ON public.coach_ratings;
CREATE POLICY "coach_ratings_insert_own"
  ON public.coach_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coach_ratings_update_own" ON public.coach_ratings;
CREATE POLICY "coach_ratings_update_own"
  ON public.coach_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_ratings_coach_id ON public.coach_ratings(coach_id);

-- 4) Update RLS policies for coaches table
-- System coaches: everyone can read
-- Private coaches: only creator can read
-- Creator marketplace coaches: everyone can read if public

DROP POLICY IF EXISTS "coaches_read_all" ON public.coaches;
CREATE POLICY "coaches_read_all"
  ON public.coaches
  FOR SELECT
  USING (
    coach_type = 'system' OR
    (coach_type = 'private' AND creator_id = auth.uid()) OR
    (coach_type = 'creator' AND is_public = true)
  );

DROP POLICY IF EXISTS "coaches_insert_own" ON public.coaches;
CREATE POLICY "coaches_insert_own"
  ON public.coaches
  FOR INSERT
  WITH CHECK (
    coach_type IN ('private', 'creator') AND
    creator_id = auth.uid()
  );

DROP POLICY IF EXISTS "coaches_update_own" ON public.coaches;
CREATE POLICY "coaches_update_own"
  ON public.coaches
  FOR UPDATE
  USING (
    (coach_type = 'private' AND creator_id = auth.uid()) OR
    (coach_type = 'creator' AND creator_id = auth.uid())
  )
  WITH CHECK (
    (coach_type = 'private' AND creator_id = auth.uid()) OR
    (coach_type = 'creator' AND creator_id = auth.uid())
  );

-- 5) Function to update coach rating averages
CREATE OR REPLACE FUNCTION update_coach_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coaches
  SET
    rating_average = (
      SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
      FROM public.coach_ratings
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.coach_ratings
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
    )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coach_rating_stats ON public.coach_ratings;
CREATE TRIGGER trigger_update_coach_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.coach_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_rating_stats();

-- 6) Function to increment download count
CREATE OR REPLACE FUNCTION increment_coach_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coaches
  SET download_count = download_count + 1
  WHERE id = NEW.coach_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_coach_download_count ON public.coach_ownership;
CREATE TRIGGER trigger_increment_coach_download_count
  AFTER INSERT ON public.coach_ownership
  FOR EACH ROW
  EXECUTE FUNCTION increment_coach_download_count();
