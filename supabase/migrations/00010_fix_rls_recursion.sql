-- ============================================
-- Fix: RLS 무한 재귀 해결
-- ============================================
-- 문제: users_select_office_members → staff_members 조회
--       → staff_members_select_office가 자기 자신 재조회 → 무한 루프
-- 해결: staff_members 정책에서 자기참조 제거
-- ============================================

-- 1. 기존 문제 정책 삭제
DROP POLICY IF EXISTS "staff_members_select_office" ON public.staff_members;
DROP POLICY IF EXISTS "users_select_office_members" ON public.users;

-- 2. staff_members: 자기참조 없는 정책으로 교체
--    - 본인이 해당 스태프이거나
--    - 본인이 해당 사무소의 대표(agent_profile 소유자)인 경우
CREATE POLICY "staff_members_select_office"
  ON public.staff_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR agent_profile_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    )
  );

-- 3. users: staff_members 조회 시 더 이상 재귀 안 함
--    - 본인이 대표인 사무소의 스태프 유저를 볼 수 있음
--    - 본인이 스태프인 사무소의 대표를 볼 수 있음
CREATE POLICY "users_select_office_members"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      JOIN public.staff_members sm ON sm.agent_profile_id = ap.id
      WHERE ap.user_id = auth.uid()
        AND sm.user_id = public.users.id
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_members sm
      JOIN public.agent_profiles ap ON ap.id = sm.agent_profile_id
      WHERE sm.user_id = auth.uid()
        AND ap.user_id = public.users.id
    )
  );
