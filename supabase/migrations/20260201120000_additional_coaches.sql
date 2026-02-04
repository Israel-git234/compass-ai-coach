-- Add description column if it doesn't exist
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS description text;

-- Add selected_coach_id to profiles for coach selection
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_coach_id uuid REFERENCES public.coaches(id);

-- Update Clarity coach description
UPDATE public.coaches 
SET description = 'Find clarity in confusion. Slow down noisy thinking. Discover what truly matters with patient, thoughtful guidance.'
WHERE slug = 'clarity';

-- Add Focus Coach and Growth Coach to the coaches table
INSERT INTO public.coaches (name, slug, style, persona_key, is_default, description)
VALUES 
  ('Focus Coach', 'focus', 'direct', 'focus', false, 'Cut through distraction. Take decisive action. Build momentum with accountability and direct guidance.'),
  ('Growth Coach', 'growth', 'balanced', 'growth', false, 'Develop self-awareness. Shift limiting beliefs. Connect daily actions to long-term personal growth.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  style = EXCLUDED.style,
  persona_key = EXCLUDED.persona_key,
  description = EXCLUDED.description;
