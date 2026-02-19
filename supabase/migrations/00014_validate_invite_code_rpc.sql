-- ============================================
-- 초대코드 검증 RPC 함수
-- ============================================
-- 비로그인 사용자(회원가입 중)도 초대코드를 검증할 수 있도록
-- SECURITY DEFINER로 RLS를 우회합니다.
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_invite_code(_code TEXT)
RETURNS TABLE(office_name TEXT, agent_profile_id UUID)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT ap.office_name, ap.id
  FROM agent_settings s
  JOIN agent_profiles ap ON ap.id = s.agent_id
  WHERE s.setting_key = 'invite_code'
    AND (s.setting_value ->> 'code') = upper(_code)
  LIMIT 1;
END;
$$;
