-- Login records table
CREATE TABLE IF NOT EXISTS login_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_records_user_id ON login_records(user_id);
CREATE INDEX idx_login_records_created_at ON login_records(created_at DESC);

-- RLS
ALTER TABLE login_records ENABLE ROW LEVEL SECURITY;

-- Users can only read their own login records
CREATE POLICY login_records_select ON login_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own login records
CREATE POLICY login_records_insert ON login_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
