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
