-- ============================================
-- Migration: 00001_initial_schema.sql
-- ============================================
-- ============================================
-- Smart Home: 공인중개사 올인원 업무 플랫폼
-- Initial Schema Migration
-- ============================================

-- Custom enum types
CREATE TYPE public.user_role AS ENUM ('customer', 'agent', 'staff');
CREATE TYPE public.staff_role AS ENUM ('lead_agent', 'associate_agent', 'assistant');

-- ============================================
-- updated_at trigger function (used by multiple tables)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. users 테이블
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'customer',
  display_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. agent_profiles 테이블
-- ============================================
CREATE TABLE public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  office_name TEXT NOT NULL,
  representative TEXT NOT NULL,
  business_number TEXT NOT NULL,
  license_number TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  business_hours JSONB,
  logo_url TEXT,
  description TEXT,
  specialties TEXT[],
  insurance_info JSONB,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. staff_members 테이블
-- ============================================
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL DEFAULT 'assistant',
  permissions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_profile_id, user_id)
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. agent_feature_settings 테이블
-- ============================================
CREATE TABLE public.agent_feature_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  settings_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, feature_key)
);

ALTER TABLE public.agent_feature_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies (after all tables created)
-- ============================================

-- users policies
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_select_office_members"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_members sm
      JOIN public.agent_profiles ap ON ap.id = sm.agent_profile_id
      WHERE sm.user_id = auth.uid()
        AND (ap.user_id = public.users.id
             OR EXISTS (
               SELECT 1 FROM public.staff_members sm2
               WHERE sm2.agent_profile_id = sm.agent_profile_id
                 AND sm2.user_id = public.users.id
             ))
    )
  );

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- agent_profiles policies
CREATE POLICY "agent_profiles_select_authenticated"
  ON public.agent_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "agent_profiles_insert_own"
  ON public.agent_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_profiles_update_own"
  ON public.agent_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- staff_members policies
CREATE POLICY "staff_members_select_office"
  ON public.staff_members FOR SELECT
  USING (
    agent_profile_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
      UNION
      SELECT sm.agent_profile_id FROM public.staff_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "staff_members_insert_owner"
  ON public.staff_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_profile_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "staff_members_update_owner"
  ON public.staff_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_profile_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "staff_members_delete_owner"
  ON public.staff_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_profile_id AND ap.user_id = auth.uid()
    )
  );

-- agent_feature_settings policies
CREATE POLICY "feature_settings_select_office"
  ON public.agent_feature_settings FOR SELECT
  USING (
    agent_id IN (
      SELECT ap.id FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
      UNION
      SELECT sm.agent_profile_id FROM public.staff_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "feature_settings_insert_owner"
  ON public.agent_feature_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "feature_settings_update_owner"
  ON public.agent_feature_settings FOR UPDATE
  USING (
    NOT is_locked
    AND EXISTS (
      SELECT 1 FROM public.agent_profiles ap
      WHERE ap.id = agent_id AND ap.user_id = auth.uid()
    )
  );

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_agent_profiles_user_id ON public.agent_profiles(user_id);
CREATE INDEX idx_agent_profiles_is_verified ON public.agent_profiles(is_verified);
CREATE INDEX idx_staff_members_agent_profile_id ON public.staff_members(agent_profile_id);
CREATE INDEX idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX idx_feature_settings_agent_id ON public.agent_feature_settings(agent_id);

-- ============================================
-- Trigger
-- ============================================
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.agent_feature_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Migration: 00002_properties.sql
-- ============================================
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

-- ============================================
-- Migration: 00003_inquiries_crm.sql
-- ============================================
-- ============================================================
-- Migration 00003: Inquiries & CRM
-- ============================================================

-- Enums
CREATE TYPE inquiry_type AS ENUM ('property', 'price', 'contract', 'other');
CREATE TYPE inquiry_status AS ENUM ('new', 'checked', 'in_progress', 'answered', 'closed');
CREATE TYPE customer_type AS ENUM ('lead', 'interest', 'consulting', 'contracting', 'completed');
CREATE TYPE customer_source AS ENUM ('inquiry', 'direct', 'referral', 'website');
CREATE TYPE activity_type AS ENUM ('view', 'favorite', 'inquiry', 'appointment', 'contract_view');

-- ============================================================
-- inquiries
-- ============================================================
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_number TEXT NOT NULL UNIQUE,          -- 'INQ-YYYYMMDD-NNN'
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,                          -- encrypt in app layer
  email TEXT,
  inquiry_type inquiry_type NOT NULL DEFAULT 'other',
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  preferred_visit_date DATE,
  content TEXT NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'new',
  agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_agent ON inquiries(agent_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_property ON inquiries(property_id);

-- RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Agents can read/write their own inquiries
CREATE POLICY inquiries_agent_select ON inquiries FOR SELECT
  USING (agent_id IN (SELECT id FROM agent_profiles WHERE user_id = auth.uid()));
CREATE POLICY inquiries_agent_insert ON inquiries FOR INSERT
  WITH CHECK (true);  -- anyone can submit (user or anonymous)
CREATE POLICY inquiries_agent_update ON inquiries FOR UPDATE
  USING (agent_id IN (SELECT id FROM agent_profiles WHERE user_id = auth.uid()));

-- Users can read their own inquiries
CREATE POLICY inquiries_user_select ON inquiries FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- inquiry_replies
-- ============================================================
CREATE TABLE inquiry_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_via TEXT[] DEFAULT '{}',                -- 'email', 'alimtalk', 'sms'
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_replies_inquiry ON inquiry_replies(inquiry_id);

ALTER TABLE inquiry_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY inquiry_replies_agent_select ON inquiry_replies FOR SELECT
  USING (agent_id IN (SELECT id FROM agent_profiles WHERE user_id = auth.uid()));
CREATE POLICY inquiry_replies_agent_insert ON inquiry_replies FOR INSERT
  WITH CHECK (agent_id IN (SELECT id FROM agent_profiles WHERE user_id = auth.uid()));

-- Users can read replies to their own inquiries
CREATE POLICY inquiry_replies_user_select ON inquiry_replies FOR SELECT
  USING (inquiry_id IN (SELECT id FROM inquiries WHERE user_id = auth.uid()));

-- ============================================================
-- customers
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  customer_type customer_type NOT NULL DEFAULT 'lead',
  preferences JSONB DEFAULT '{}',             -- { region, propertyType, priceRange, area, etc. }
  score INTEGER NOT NULL DEFAULT 0,
  source customer_source NOT NULL DEFAULT 'direct',
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_agent ON customers(agent_id);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_score ON customers(score DESC);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_agent_all ON customers FOR ALL
  USING (agent_id IN (SELECT id FROM agent_profiles WHERE user_id = auth.uid()));

-- ============================================================
-- customer_activities
-- ============================================================
CREATE TABLE customer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_activities_customer ON customer_activities(customer_id);
CREATE INDEX idx_customer_activities_created ON customer_activities(created_at DESC);

ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_activities_agent_all ON customer_activities FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers WHERE agent_id IN (
      SELECT id FROM agent_profiles WHERE user_id = auth.uid()
    )
  ));

-- ============================================================
-- Triggers: updated_at
-- ============================================================
CREATE TRIGGER set_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- Migration: 00004_contracts.sql
-- ============================================
-- ============================================================
-- Migration 00004: Contracts & Contract Process Tracker
-- ============================================================

-- Enums
CREATE TYPE contract_template_type AS ENUM (
  'apartment_sale', 'apartment_lease',
  'officetel_sale', 'officetel_lease',
  'commercial_sale', 'commercial_lease',
  'building_sale',
  'land_sale',
  'factory_sale', 'factory_lease',
  'knowledge_center_sale', 'knowledge_center_lease'
);

CREATE TYPE contract_status AS ENUM ('drafting', 'pending_sign', 'signed', 'completed');

CREATE TYPE contract_step_type AS ENUM (
  'contract_signed', 'down_payment', 'mid_payment', 'final_payment',
  'ownership_transfer', 'move_in_report', 'fixed_date', 'moving',
  'maintenance_settle', 'completed'
);

-- ============================================================
-- contracts
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  template_type contract_template_type NOT NULL,
  seller_info JSONB NOT NULL DEFAULT '{}',
  buyer_info JSONB NOT NULL DEFAULT '{}',
  agent_info JSONB NOT NULL DEFAULT '{}',
  price_info JSONB NOT NULL DEFAULT '{}',
  special_terms TEXT,
  status contract_status NOT NULL DEFAULT 'drafting',
  confirmation_doc JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_agent ON contracts(agent_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_property ON contracts(property_id);
CREATE INDEX idx_contracts_created ON contracts(created_at DESC);

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own contracts
CREATE POLICY contracts_agent_all ON contracts FOR ALL
  USING (agent_id IN (SELECT id FROM agent_profiles WHERE user_id = auth.uid()));

-- Buyers/sellers can read contracts they are involved in (matched by user_id in JSONB)
CREATE POLICY contracts_party_select ON contracts FOR SELECT
  USING (
    seller_info->>'user_id' = auth.uid()::text
    OR buyer_info->>'user_id' = auth.uid()::text
  );

-- ============================================================
-- contract_process
-- ============================================================
CREATE TABLE contract_process (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  step_type contract_step_type NOT NULL,
  step_label TEXT NOT NULL,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_process_contract ON contract_process(contract_id);
CREATE INDEX idx_contract_process_sort ON contract_process(contract_id, sort_order);

ALTER TABLE contract_process ENABLE ROW LEVEL SECURITY;

-- Agents can manage process steps for their contracts
CREATE POLICY contract_process_agent_all ON contract_process FOR ALL
  USING (contract_id IN (
    SELECT id FROM contracts WHERE agent_id IN (
      SELECT id FROM agent_profiles WHERE user_id = auth.uid()
    )
  ));

-- Parties can read process steps
CREATE POLICY contract_process_party_select ON contract_process FOR SELECT
  USING (contract_id IN (
    SELECT id FROM contracts WHERE
      seller_info->>'user_id' = auth.uid()::text
      OR buyer_info->>'user_id' = auth.uid()::text
  ));

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- Migration: 00005_ai_generation_logs.sql
-- ============================================
-- AI Generation Logs
-- Stores history of all AI-generated content

CREATE TYPE ai_generation_type AS ENUM (
  'description', 'legal_review', 'inquiry_reply',
  'chatbot', 'customer_analysis', 'move_in_guide'
);

CREATE TABLE ai_generation_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  type        ai_generation_type NOT NULL,
  input_data  JSONB NOT NULL DEFAULT '{}',
  output_text TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_logs_agent ON ai_generation_logs(agent_id);
CREATE INDEX idx_ai_logs_type ON ai_generation_logs(type);
CREATE INDEX idx_ai_logs_created ON ai_generation_logs(created_at DESC);

-- Move-in guides (generated and saved for user access)
CREATE TABLE move_in_guides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  agent_id    UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  address     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_move_in_guide_contract ON move_in_guides(contract_id);

-- RLS
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_in_guides ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own logs
CREATE POLICY "Agents manage own AI logs"
  ON ai_generation_logs FOR ALL
  USING (agent_id = (SELECT ap.id FROM agent_profiles ap WHERE ap.user_id = auth.uid()));

-- Agents can manage move-in guides
CREATE POLICY "Agents manage own guides"
  ON move_in_guides FOR ALL
  USING (agent_id = (SELECT ap.id FROM agent_profiles ap WHERE ap.user_id = auth.uid()));

-- Users can read move-in guides for their contracts
CREATE POLICY "Users read own guides"
  ON move_in_guides FOR SELECT
  USING (
    contract_id IN (
      SELECT c.id FROM contracts c
      WHERE (c.buyer_info->>'user_id')::uuid = auth.uid()
    )
  );

-- ============================================
-- Migration: 00006_inspection_rental_legal.sql
-- ============================================
-- Inspection system
CREATE TYPE inspection_status AS ENUM ('scheduled', 'in_progress', 'completed');
CREATE TYPE check_item_status AS ENUM ('good', 'normal', 'bad');
CREATE TYPE inspection_grade AS ENUM ('A', 'B', 'C', 'D', 'F');

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  property_title TEXT NOT NULL,
  address TEXT NOT NULL,
  status inspection_status NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE,
  completed_date DATE,
  checklist JSONB NOT NULL DEFAULT '[]',
  overall_comment TEXT,
  grade inspection_grade,
  ai_comment TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their inspections"
  ON inspections FOR ALL
  USING (agent_id = auth.uid());

-- Rental management
CREATE TYPE rental_property_status AS ENUM ('occupied', 'vacant', 'expiring');
CREATE TYPE repair_request_status AS ENUM ('requested', 'confirmed', 'in_progress', 'completed');

CREATE TABLE rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  address TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  tenant_name TEXT NOT NULL DEFAULT '',
  tenant_phone TEXT NOT NULL DEFAULT '',
  deposit BIGINT NOT NULL DEFAULT 0,
  monthly_rent BIGINT NOT NULL DEFAULT 0,
  contract_start DATE,
  contract_end DATE,
  status rental_property_status NOT NULL DEFAULT 'vacant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their rental properties"
  ON rental_properties FOR ALL
  USING (agent_id = auth.uid());

CREATE TABLE rental_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
  payment_month DATE NOT NULL,
  amount BIGINT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rental_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage payments of their rentals"
  ON rental_payments FOR ALL
  USING (
    rental_property_id IN (
      SELECT id FROM rental_properties WHERE agent_id = auth.uid()
    )
  );

CREATE TABLE repair_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  status repair_request_status NOT NULL DEFAULT 'requested',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cost BIGINT,
  memo TEXT
);

ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage repair requests of their rentals"
  ON repair_requests FOR ALL
  USING (
    rental_property_id IN (
      SELECT id FROM rental_properties WHERE agent_id = auth.uid()
    )
  );

-- Share links for landlord view
CREATE TABLE rental_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rental_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage share links of their rentals"
  ON rental_share_links FOR ALL
  USING (
    rental_property_id IN (
      SELECT id FROM rental_properties WHERE agent_id = auth.uid()
    )
  );

-- Public read for valid share links (via RPC or service role)
CREATE POLICY "Public can read valid share links"
  ON rental_share_links FOR SELECT
  USING (expires_at > now());

-- ============================================
-- Migration: 00007_co_brokerage.sql
-- ============================================
-- Co-Brokerage tables

-- Shared properties pool
CREATE TABLE shared_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  office_name TEXT NOT NULL,
  commission_ratio INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  property_title TEXT NOT NULL,
  address TEXT NOT NULL,
  transaction_type transaction_type NOT NULL,
  sale_price BIGINT,
  deposit BIGINT,
  monthly_rent BIGINT,
  exclusive_area_m2 DECIMAL(10,2),
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Co-brokerage request status enum
CREATE TYPE co_brokerage_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Co-brokerage requests
CREATE TABLE co_brokerage_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_property_id UUID NOT NULL REFERENCES shared_properties(id) ON DELETE CASCADE,
  requester_agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_office TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  status co_brokerage_request_status NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL DEFAULT '',
  commission_ratio INTEGER,
  property_title TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_shared_properties_agent ON shared_properties(agent_id);
CREATE INDEX idx_shared_properties_active ON shared_properties(is_active) WHERE is_active = true;
CREATE INDEX idx_co_brokerage_requests_shared ON co_brokerage_requests(shared_property_id);
CREATE INDEX idx_co_brokerage_requests_requester ON co_brokerage_requests(requester_agent_id);
CREATE INDEX idx_co_brokerage_requests_status ON co_brokerage_requests(status);

-- RLS
ALTER TABLE shared_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_brokerage_requests ENABLE ROW LEVEL SECURITY;

-- Shared properties: agents can see active shared properties, manage their own
CREATE POLICY "Agents can view active shared properties"
  ON shared_properties FOR SELECT
  USING (is_active = true);

CREATE POLICY "Agents can manage own shared properties"
  ON shared_properties FOR ALL
  USING (agent_id = auth.uid());

-- Requests: agents can see requests they sent or received
CREATE POLICY "Agents can view relevant requests"
  ON co_brokerage_requests FOR SELECT
  USING (
    requester_agent_id = auth.uid()
    OR shared_property_id IN (
      SELECT id FROM shared_properties WHERE agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create requests"
  ON co_brokerage_requests FOR INSERT
  WITH CHECK (requester_agent_id = auth.uid());

CREATE POLICY "Property owners can update request status"
  ON co_brokerage_requests FOR UPDATE
  USING (
    shared_property_id IN (
      SELECT id FROM shared_properties WHERE agent_id = auth.uid()
    )
  );

-- ============================================
-- Migration: 00008_auth_trigger.sql
-- ============================================
-- Auth Trigger: auth.users → public.users 자동 프로필 생성

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
