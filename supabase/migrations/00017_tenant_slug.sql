-- ============================================================
-- 00017_tenant_slug.sql
-- Multi-tenant subdomain support: slug, custom domains, RPC
-- ============================================================

-- 1. Add slug column to agent_profiles
ALTER TABLE agent_profiles
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Unique partial index (only non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_profiles_slug
  ON agent_profiles(slug) WHERE slug IS NOT NULL;

-- Slug format check: lowercase alphanumeric + hyphens, 3-63 chars
ALTER TABLE agent_profiles
  ADD CONSTRAINT chk_slug_format
  CHECK (slug IS NULL OR slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$');


-- 2. Reserved slugs table
CREATE TABLE IF NOT EXISTS reserved_slugs (
  slug TEXT PRIMARY KEY
);

INSERT INTO reserved_slugs (slug) VALUES
  ('www'), ('app'), ('admin'), ('api'), ('auth'),
  ('blog'), ('help'), ('support'), ('docs'), ('status'),
  ('mail'), ('test'), ('dev'), ('staging'), ('demo'),
  ('dashboard'), ('login'), ('signup'), ('callback'),
  ('static'), ('assets'), ('cdn'), ('media'), ('ftp')
ON CONFLICT DO NOTHING;


-- 3. Custom domains table (Pro+ plan)
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_agent ON custom_domains(agent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);

-- RLS for custom_domains
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own domains"
  ON custom_domains FOR ALL
  USING (agent_id IN (
    SELECT id FROM agent_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Verified domains are publicly readable"
  ON custom_domains FOR SELECT
  USING (is_verified = TRUE);


-- 4. RPC: resolve_tenant_by_slug
-- Returns agent public info for a given subdomain slug.
-- SECURITY DEFINER so unauthenticated visitors can call it.
CREATE OR REPLACE FUNCTION resolve_tenant_by_slug(_slug TEXT)
RETURNS TABLE (
  id UUID,
  office_name TEXT,
  representative TEXT,
  address TEXT,
  phone TEXT,
  fax TEXT,
  logo_url TEXT,
  description TEXT,
  specialties TEXT[],
  business_hours JSONB,
  subscription_plan TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ap.id,
    ap.office_name,
    ap.representative,
    ap.address,
    ap.phone,
    ap.fax,
    ap.logo_url,
    ap.description,
    ap.specialties,
    ap.business_hours,
    ap.subscription_plan::TEXT
  FROM agent_profiles ap
  WHERE ap.slug = _slug
    AND ap.is_verified = TRUE
  LIMIT 1;
$$;


-- 5. RPC: resolve_tenant_by_domain
-- Same result but resolves via custom_domains table.
CREATE OR REPLACE FUNCTION resolve_tenant_by_domain(_domain TEXT)
RETURNS TABLE (
  id UUID,
  office_name TEXT,
  representative TEXT,
  address TEXT,
  phone TEXT,
  fax TEXT,
  logo_url TEXT,
  description TEXT,
  specialties TEXT[],
  business_hours JSONB,
  subscription_plan TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ap.id,
    ap.office_name,
    ap.representative,
    ap.address,
    ap.phone,
    ap.fax,
    ap.logo_url,
    ap.description,
    ap.specialties,
    ap.business_hours,
    ap.subscription_plan::TEXT
  FROM agent_profiles ap
  INNER JOIN custom_domains cd ON cd.agent_id = ap.id
  WHERE cd.domain = _domain
    AND cd.is_verified = TRUE
    AND ap.is_verified = TRUE
  LIMIT 1;
$$;


-- 6. Extend agent_settings public read policy for 'search' and 'unit' keys
-- (The existing policy from 00016 covers 'regions'; extend to include more keys)
DROP POLICY IF EXISTS "Public can read region settings" ON agent_settings;

CREATE POLICY "Public can read public settings"
  ON agent_settings FOR SELECT
  USING (setting_key IN ('regions', 'search', 'unit', 'floating'));
