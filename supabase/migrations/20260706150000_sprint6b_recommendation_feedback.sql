-- Sprint 6b — Owner feedback loop (recommendation_feedback)

CREATE TYPE public.feedback_helpfulness AS ENUM ('good', 'neutral', 'bad');

CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  feedback_date date NOT NULL,
  executed boolean NOT NULL,
  helpfulness public.feedback_helpfulness,
  optional_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_business_date
  ON public.recommendation_feedback (business_id, feedback_date DESC);

ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read own recommendation feedback"
  ON public.recommendation_feedback;
CREATE POLICY "Owners can read own recommendation feedback"
  ON public.recommendation_feedback FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can insert own recommendation feedback"
  ON public.recommendation_feedback;
CREATE POLICY "Owners can insert own recommendation feedback"
  ON public.recommendation_feedback FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );
