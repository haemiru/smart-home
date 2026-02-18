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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
