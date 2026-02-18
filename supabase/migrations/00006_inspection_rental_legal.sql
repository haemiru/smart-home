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
