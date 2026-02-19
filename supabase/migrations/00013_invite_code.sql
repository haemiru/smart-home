-- ============================================
-- 사무소 초대코드 시스템
-- ============================================
-- agent_profiles에 invite_code 컬럼 추가
-- 소속원 가입 시 초대코드로 사무소 자동 연결
-- ============================================

-- 1. invite_code 컬럼 추가
ALTER TABLE agent_profiles ADD COLUMN invite_code TEXT UNIQUE;

-- 기존 rows에 8자 영숫자 코드 자동 부여
UPDATE agent_profiles SET invite_code = upper(substr(md5(random()::text), 1, 8));

-- 2. invite_code 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _code TEXT;
  _exists BOOLEAN;
BEGIN
  IF NEW.invite_code IS NULL THEN
    LOOP
      _code := upper(substr(md5(random()::text), 1, 8));
      SELECT EXISTS(SELECT 1 FROM agent_profiles WHERE invite_code = _code) INTO _exists;
      EXIT WHEN NOT _exists;
    END LOOP;
    NEW.invite_code := _code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invite_code
  BEFORE INSERT ON agent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invite_code();

-- 3. handle_new_user 확장: staff 초대코드 처리
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _agent_data JSONB;
  _invite_code TEXT;
  _agent_profile_id UUID;
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

  -- staff 초대코드 처리
  IF (NEW.raw_user_meta_data ->> 'role') = 'staff' THEN
    _invite_code := NEW.raw_user_meta_data ->> 'invite_code';
    IF _invite_code IS NOT NULL THEN
      SELECT id INTO _agent_profile_id
        FROM public.agent_profiles
        WHERE invite_code = _invite_code;

      IF _agent_profile_id IS NOT NULL THEN
        INSERT INTO public.staff_members (
          agent_profile_id, user_id, role, permissions, is_active
        ) VALUES (
          _agent_profile_id,
          NEW.id,
          'assistant',
          '{"property_create":true,"property_delete":false,"contract_create":false,"contract_approve":false,"e_signature":false,"customer_view":true,"ai_tools":false,"co_brokerage":false,"settings":false}'::jsonb,
          true
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
