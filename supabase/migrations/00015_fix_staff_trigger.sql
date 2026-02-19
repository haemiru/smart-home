-- ============================================
-- handle_new_user 트리거 수정: staff_members 생성 로직 개선
-- ============================================
-- 1. 초대코드를 agent_settings 테이블에서 조회 (agent_profiles.invite_code → agent_settings)
-- 2. staff_role 메타데이터 반영 (associate_agent / assistant)
-- 3. 역할별 권한 분기
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _agent_data JSONB;
  _invite_code TEXT;
  _staff_role TEXT;
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

  -- staff 초대코드 처리: agent_settings 테이블에서 조회
  IF (NEW.raw_user_meta_data ->> 'role') = 'staff' THEN
    _invite_code := NEW.raw_user_meta_data ->> 'invite_code';
    _staff_role := COALESCE(NEW.raw_user_meta_data ->> 'staff_role', 'assistant');

    IF _invite_code IS NOT NULL THEN
      SELECT ap.id INTO _agent_profile_id
        FROM public.agent_settings s
        JOIN public.agent_profiles ap ON ap.id = s.agent_id
        WHERE s.setting_key = 'invite_code'
          AND (s.setting_value ->> 'code') = UPPER(_invite_code);

      IF _agent_profile_id IS NOT NULL THEN
        INSERT INTO public.staff_members (
          agent_profile_id, user_id, role, permissions, is_active
        ) VALUES (
          _agent_profile_id,
          NEW.id,
          _staff_role,
          CASE WHEN _staff_role = 'associate_agent'
            THEN '{"property_create":true,"property_delete":false,"contract_create":true,"contract_approve":false,"e_signature":false,"customer_view":true,"ai_tools":true,"co_brokerage":false,"settings":false}'::jsonb
            ELSE '{"property_create":true,"property_delete":false,"contract_create":false,"contract_approve":false,"e_signature":false,"customer_view":true,"ai_tools":false,"co_brokerage":false,"settings":false}'::jsonb
          END,
          true
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
