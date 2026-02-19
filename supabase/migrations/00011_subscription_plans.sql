-- ============================================
-- Subscription Plan 컬럼 추가
-- ============================================
-- agent_profiles에 구독 플랜 정보를 추가합니다.
-- 가입 즉시 Free 플랜으로 시작하여 SaaS 형태로 운영됩니다.
-- ============================================

-- 1. subscription_plan 컬럼 추가
ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise'));

-- 2. subscription_started_at 컬럼 추가
ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT now();

-- 3. handle_new_user() 트리거 업데이트: 가입 시 subscription_plan 포함
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _agent_data JSONB;
BEGIN
  INSERT INTO public.users (id, email, role, display_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'customer'
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  -- agent_profiles 자동 생성
  IF (NEW.raw_user_meta_data ->> 'role') = 'agent' THEN
    _agent_data := NEW.raw_user_meta_data -> 'agent_data';
    IF _agent_data IS NOT NULL THEN
      INSERT INTO public.agent_profiles (
        user_id, office_name, representative, business_number,
        license_number, address, phone, is_verified,
        subscription_plan, subscription_started_at
      ) VALUES (
        NEW.id,
        _agent_data ->> 'officeName',
        _agent_data ->> 'representative',
        _agent_data ->> 'businessNumber',
        _agent_data ->> 'licenseNumber',
        _agent_data ->> 'address',
        _agent_data ->> 'phone',
        false,
        'free',
        now()
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
