-- ============================================
-- Migration: 00012_sequences_and_settings.sql
-- Inquiry/contract number sequences + agent_settings table
-- ============================================

-- ──────────────────────────────────────────
-- 1. Inquiry number sequence + RPC
-- ──────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.inquiry_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_inquiry_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INT;
BEGIN
  seq_val := nextval('public.inquiry_number_seq');
  RETURN 'INQ-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq_val::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────
-- 2. Contract number sequence + RPC
-- ──────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.contract_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INT;
BEGIN
  seq_val := nextval('public.contract_number_seq');
  RETURN 'CT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq_val::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────
-- 3. agent_settings table (JSONB key-value per agent)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, setting_key)
);

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "agent_settings_select_own"
  ON public.agent_settings FOR SELECT
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
      UNION
      SELECT sm.agent_profile_id FROM public.staff_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_settings_insert_own"
  ON public.agent_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_settings_update_own"
  ON public.agent_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_id AND ap.user_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE TRIGGER agent_settings_updated_at
  BEFORE UPDATE ON public.agent_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
