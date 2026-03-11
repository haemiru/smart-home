-- ============================================
-- Enterprise 플랜 제거 (Free / Basic / Pro만 사용)
-- ============================================

-- 기존 CHECK 제약 제거 후 재생성
ALTER TABLE public.agent_profiles
  DROP CONSTRAINT IF EXISTS agent_profiles_subscription_plan_check;

ALTER TABLE public.agent_profiles
  ADD CONSTRAINT agent_profiles_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'basic', 'pro'));

-- 혹시 enterprise인 기존 데이터가 있으면 pro로 변경
UPDATE public.agent_profiles
  SET subscription_plan = 'pro'
  WHERE subscription_plan = 'enterprise';
