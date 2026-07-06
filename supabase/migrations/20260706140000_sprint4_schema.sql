-- Sprint 4: Full schema (enums, tables, indexes, RLS, recommendation RPC)

-- =============================================================================
-- Enums
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.business_type AS ENUM (
    'coffee_shop', 'bubble_tea', 'restaurant', 'print_shop',
    'nail_salon', 'hair_salon', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.business_goal AS ENUM (
    'increase_revenue', 'improve_repeat_rate', 'improve_cash_flow', 'improve_satisfaction'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.campus_event_type AS ENUM (
    'academic', 'career', 'sports', 'cultural', 'holiday', 'weather', 'season'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.traffic_impact AS ENUM ('high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_source AS ENUM ('seed', 'manual', 'api');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.confidence_level AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.action_type AS ENUM (
    'extend_hours', 'adjust_staffing', 'run_promotion', 'prepare_inventory',
    'improve_service', 'reduce_costs', 'capture_traffic', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.recommendation_source AS ENUM ('ai', 'rule_based');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- profiles (ensure exists — may already be created by initial migration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- businesses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type public.business_type NOT NULL DEFAULT 'other',
  campus_name text NOT NULL,
  business_goal public.business_goal NOT NULL DEFAULT 'increase_revenue',
  business_timezone text NOT NULL DEFAULT 'Asia/Shanghai',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses (owner_id);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- daily_checkins
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  revenue numeric(12, 2) NOT NULL CHECK (revenue >= 0),
  customer_count integer NOT NULL CHECK (customer_count >= 0),
  note text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (business_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_checkins_business_date
  ON public.daily_checkins (business_id, checkin_date DESC);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- campus_events
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campus_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_name text NOT NULL,
  title text NOT NULL,
  event_type public.campus_event_type NOT NULL,
  starts_on date NOT NULL,
  ends_on date,
  traffic_impact public.traffic_impact NOT NULL DEFAULT 'normal',
  description text,
  source public.event_source NOT NULL DEFAULT 'seed',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_campus_dates
  ON public.campus_events (campus_name, starts_on, ends_on);

ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ai_recommendations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recommendation_date date NOT NULL,
  recommendation_title text NOT NULL,
  reason text NOT NULL,
  expected_impact text,
  confidence_level public.confidence_level NOT NULL DEFAULT 'medium',
  action_type public.action_type NOT NULL DEFAULT 'other',
  fallback_message text,
  source public.recommendation_source NOT NULL DEFAULT 'rule_based',
  acknowledged_at timestamptz,
  input_snapshot jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (business_id, recommendation_date)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_business_date
  ON public.ai_recommendations (business_id, recommendation_date DESC);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- weekly_briefs (schema only — generation deferred to future sprint)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.weekly_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  week_summary text NOT NULL,
  campus_recap jsonb NOT NULL DEFAULT '{}',
  business_health_summary jsonb NOT NULL DEFAULT '{}',
  next_week_priority text NOT NULL,
  risk_notes jsonb DEFAULT '[]',
  suggested_goal_adjustment text,
  confirmed_at timestamptz,
  source public.recommendation_source NOT NULL DEFAULT 'rule_based',
  input_snapshot jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (business_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_briefs_business_week
  ON public.weekly_briefs (business_id, week_start DESC);

ALTER TABLE public.weekly_briefs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS: profiles
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================================================
-- RLS: businesses
-- =============================================================================

DROP POLICY IF EXISTS "Owners can view own businesses" ON public.businesses;
CREATE POLICY "Owners can view own businesses"
  ON public.businesses FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can insert own businesses" ON public.businesses;
CREATE POLICY "Owners can insert own businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update own businesses" ON public.businesses;
CREATE POLICY "Owners can update own businesses"
  ON public.businesses FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete own businesses" ON public.businesses;
CREATE POLICY "Owners can delete own businesses"
  ON public.businesses FOR DELETE
  USING (owner_id = auth.uid());

-- =============================================================================
-- RLS: daily_checkins
-- =============================================================================

DROP POLICY IF EXISTS "Owners can manage own checkins" ON public.daily_checkins;
CREATE POLICY "Owners can manage own checkins"
  ON public.daily_checkins FOR ALL
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- =============================================================================
-- RLS: campus_events (read-only for owners)
-- =============================================================================

DROP POLICY IF EXISTS "Owners can read campus events for their campus" ON public.campus_events;
CREATE POLICY "Owners can read campus events for their campus"
  ON public.campus_events FOR SELECT
  TO authenticated
  USING (
    campus_name IN (
      SELECT campus_name FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS: ai_recommendations
-- =============================================================================

DROP POLICY IF EXISTS "Owners can read own recommendations" ON public.ai_recommendations;
CREATE POLICY "Owners can read own recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can update acknowledged_at" ON public.ai_recommendations;
CREATE POLICY "Owners can update acknowledged_at"
  ON public.ai_recommendations FOR UPDATE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- =============================================================================
-- RLS: weekly_briefs
-- =============================================================================

DROP POLICY IF EXISTS "Owners can read own briefs" ON public.weekly_briefs;
CREATE POLICY "Owners can read own briefs"
  ON public.weekly_briefs FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can update confirmed_at" ON public.weekly_briefs;
CREATE POLICY "Owners can update confirmed_at"
  ON public.weekly_briefs FOR UPDATE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- =============================================================================
-- Trigger: auto-create profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RPC: upsert rule-based recommendation (SECURITY DEFINER — no service role in app)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_ai_recommendation(
  p_business_id uuid,
  p_recommendation_date date,
  p_recommendation_title text,
  p_reason text,
  p_expected_impact text,
  p_confidence_level public.confidence_level,
  p_action_type public.action_type,
  p_fallback_message text,
  p_source public.recommendation_source,
  p_input_snapshot jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.ai_recommendations (
    business_id,
    recommendation_date,
    recommendation_title,
    reason,
    expected_impact,
    confidence_level,
    action_type,
    fallback_message,
    source,
    input_snapshot
  ) VALUES (
    p_business_id,
    p_recommendation_date,
    p_recommendation_title,
    p_reason,
    p_expected_impact,
    p_confidence_level,
    p_action_type,
    p_fallback_message,
    p_source,
    p_input_snapshot
  )
  ON CONFLICT (business_id, recommendation_date)
  DO UPDATE SET
    recommendation_title = EXCLUDED.recommendation_title,
    reason = EXCLUDED.reason,
    expected_impact = EXCLUDED.expected_impact,
    confidence_level = EXCLUDED.confidence_level,
    action_type = EXCLUDED.action_type,
    fallback_message = EXCLUDED.fallback_message,
    source = EXCLUDED.source,
    input_snapshot = EXCLUDED.input_snapshot,
    acknowledged_at = NULL
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_ai_recommendation TO authenticated;
