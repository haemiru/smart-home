-- ============================================
-- 매물 관리 시스템
-- ============================================

-- Enum types
CREATE TYPE public.transaction_type AS ENUM ('sale', 'jeonse', 'monthly');
CREATE TYPE public.property_status AS ENUM ('draft', 'active', 'contracted', 'completed', 'hold');

-- ============================================
-- 1. property_categories 테이블
-- ============================================
CREATE TABLE public.property_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  required_fields JSONB,
  UNIQUE(agent_id, name)
);

ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY;

-- 시스템 카테고리(agent_id IS NULL)는 모든 인증 사용자 조회 가능
CREATE POLICY "property_categories_select_system"
  ON public.property_categories FOR SELECT
  TO authenticated
  USING (is_system = true AND agent_id IS NULL);

-- 중개사 커스텀 카테고리: 본인 것만 조회
CREATE POLICY "property_categories_select_own"
  ON public.property_categories FOR SELECT
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "property_categories_insert_own"
  ON public.property_categories FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "property_categories_update_own"
  ON public.property_categories FOR UPDATE
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "property_categories_delete_own"
  ON public.property_categories FOR DELETE
  USING (
    is_system = false
    AND agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    )
  );

-- ============================================
-- 2. properties 테이블
-- ============================================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.property_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  address TEXT NOT NULL,
  address_detail TEXT,
  dong TEXT,
  ho TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  sale_price BIGINT,
  deposit BIGINT,
  monthly_rent BIGINT,
  maintenance_fee INTEGER,
  supply_area_m2 NUMERIC(10,2),
  exclusive_area_m2 NUMERIC(10,2),
  rooms SMALLINT,
  bathrooms SMALLINT,
  total_floors SMALLINT,
  floor SMALLINT,
  direction TEXT,
  move_in_date DATE,
  parking_per_unit NUMERIC(3,1),
  has_elevator BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  options TEXT[],
  description TEXT,
  status public.property_status NOT NULL DEFAULT 'draft',
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  is_co_brokerage BOOLEAN NOT NULL DEFAULT false,
  co_brokerage_fee_ratio NUMERIC(5,2),
  internal_memo TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  inquiry_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  built_year SMALLINT,
  tags TEXT[],
  photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자: active 매물 조회
CREATE POLICY "properties_select_active"
  ON public.properties FOR SELECT
  TO authenticated
  USING (status = 'active');

-- 비인증 사용자(anon): active 매물 조회
CREATE POLICY "properties_select_active_anon"
  ON public.properties FOR SELECT
  TO anon
  USING (status = 'active');

-- 중개사: 자기 매물 전체 조회 (모든 상태)
CREATE POLICY "properties_select_own"
  ON public.properties FOR SELECT
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
      UNION
      SELECT sm.agent_profile_id FROM public.staff_members sm
        WHERE sm.user_id = auth.uid() AND sm.is_active = true
    )
  );

-- 중개사: 자기 매물만 등록
CREATE POLICY "properties_insert_own"
  ON public.properties FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
      UNION
      SELECT sm.agent_profile_id FROM public.staff_members sm
        WHERE sm.user_id = auth.uid() AND sm.is_active = true
    )
  );

-- 중개사: 자기 매물만 수정
CREATE POLICY "properties_update_own"
  ON public.properties FOR UPDATE
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
      UNION
      SELECT sm.agent_profile_id FROM public.staff_members sm
        WHERE sm.user_id = auth.uid() AND sm.is_active = true
    )
  );

-- 중개사: 자기 매물만 삭제
CREATE POLICY "properties_delete_own"
  ON public.properties FOR DELETE
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. property_favorites 테이블
-- ============================================
CREATE TABLE public.property_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.property_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_favorites_select_own"
  ON public.property_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "property_favorites_insert_own"
  ON public.property_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "property_favorites_delete_own"
  ON public.property_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_properties_agent_id ON public.properties(agent_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_transaction_type ON public.properties(transaction_type);
CREATE INDEX idx_properties_category_id ON public.properties(category_id);
CREATE INDEX idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX idx_properties_sale_price ON public.properties(sale_price);
CREATE INDEX idx_properties_deposit ON public.properties(deposit);
CREATE INDEX idx_properties_exclusive_area ON public.properties(exclusive_area_m2);
CREATE INDEX idx_property_favorites_user ON public.property_favorites(user_id);
CREATE INDEX idx_property_favorites_property ON public.property_favorites(property_id);
CREATE INDEX idx_property_categories_agent ON public.property_categories(agent_id);

-- ============================================
-- Trigger: updated_at
-- ============================================
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 시스템 기본 카테고리 (agent_id = NULL)
-- ============================================
INSERT INTO public.property_categories (agent_id, name, icon, sort_order, is_system, is_active) VALUES
  (NULL, '아파트', '🏢', 1, true, true),
  (NULL, '오피스텔', '🏬', 2, true, true),
  (NULL, '분양권', '📋', 3, true, true),
  (NULL, '빌라', '🏘️', 4, true, true),
  (NULL, '주택', '🏡', 5, true, true),
  (NULL, '원룸', '🚪', 6, true, true),
  (NULL, '상가', '🏪', 7, true, true),
  (NULL, '사무실', '🏛️', 8, true, true),
  (NULL, '토지', '🌍', 9, true, true),
  (NULL, '공장/창고', '🏭', 10, true, true),
  (NULL, '재개발', '🔨', 11, true, true),
  (NULL, '숙박/펜션', '🏕️', 12, true, true);
