-- ============================================
-- 비로그인(anon) 사용자도 시스템 카테고리 조회 허용
-- 사용자 포털 홈페이지에서 카테고리 탭 표시 필요
-- ============================================

CREATE POLICY "property_categories_select_anon"
  ON public.property_categories FOR SELECT
  TO anon
  USING (is_system = true AND agent_id IS NULL);
