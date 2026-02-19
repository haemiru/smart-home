-- ============================================
-- Auth Trigger 확장: agent_profiles 자동 생성
-- ============================================
-- 회원가입 시 role='agent'이고 agent_data가 메타데이터에 있으면
-- public.agent_profiles도 자동 생성합니다.
-- SECURITY DEFINER로 RLS를 우회합니다.
-- ============================================

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
        license_number, address, phone, is_verified
      ) VALUES (
        NEW.id,
        _agent_data ->> 'officeName',
        _agent_data ->> 'representative',
        _agent_data ->> 'businessNumber',
        _agent_data ->> 'licenseNumber',
        _agent_data ->> 'address',
        _agent_data ->> 'phone',
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
