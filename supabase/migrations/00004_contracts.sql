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
