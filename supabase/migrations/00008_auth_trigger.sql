-- ============================================
-- Auth Trigger: auth.users → public.users 자동 프로필 생성
-- ============================================
-- 회원가입 시 auth.users에 새 유저가 생성되면
-- 자동으로 public.users에 프로필 레코드를 생성합니다.
-- SECURITY DEFINER로 실행되어 RLS를 우회합니다.
-- 이메일 확인(Email Confirmation) 활성화 시에도 프로필이 먼저 생성됩니다.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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

  RETURN NEW;
END;
$$;

-- auth.users INSERT 시 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
