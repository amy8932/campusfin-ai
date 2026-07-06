-- Sprint 6b.1 — Expand action_type enum for finer operational recommendations

DO $$ BEGIN ALTER TYPE public.action_type ADD VALUE 'reduce_inventory'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.action_type ADD VALUE 'highlight_signature_product'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.action_type ADD VALUE 'adjust_menu'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.action_type ADD VALUE 'optimize_queue'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.action_type ADD VALUE 'push_takeaway'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.action_type ADD VALUE 'increase_display'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
