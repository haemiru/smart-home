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
