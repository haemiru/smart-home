-- Super Admin RPC functions
-- Only accessible by junominu@gmail.com

-- 1. Get all agents with user info and property count
CREATE OR REPLACE FUNCTION admin_get_all_agents()
RETURNS TABLE (
  agent_id UUID,
  user_id UUID,
  email TEXT,
  display_name TEXT,
  office_name TEXT,
  representative TEXT,
  slug TEXT,
  subscription_plan TEXT,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  property_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Super admin check
  IF auth.jwt() ->> 'email' NOT IN ('junominu@gmail.com') THEN
    RAISE EXCEPTION 'Unauthorized: super admin access only';
  END IF;

  RETURN QUERY
  SELECT
    ap.id AS agent_id,
    ap.user_id,
    u.email::TEXT,
    u.display_name::TEXT,
    ap.office_name::TEXT,
    ap.representative::TEXT,
    ap.slug::TEXT,
    ap.subscription_plan::TEXT,
    ap.is_verified,
    ap.created_at,
    COALESCE(pc.cnt, 0) AS property_count
  FROM agent_profiles ap
  JOIN users u ON u.id = ap.user_id
  LEFT JOIN (
    SELECT agent_id AS aid, COUNT(*) AS cnt
    FROM properties
    GROUP BY agent_id
  ) pc ON pc.aid = ap.id
  ORDER BY ap.created_at DESC;
END;
$$;

-- 2. Update agent subscription plan
CREATE OR REPLACE FUNCTION admin_update_agent_plan(
  target_agent_id UUID,
  new_plan TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Super admin check
  IF auth.jwt() ->> 'email' NOT IN ('junominu@gmail.com') THEN
    RAISE EXCEPTION 'Unauthorized: super admin access only';
  END IF;

  -- Validate plan value
  IF new_plan NOT IN ('free', 'basic', 'pro') THEN
    RAISE EXCEPTION 'Invalid plan: must be free, basic, or pro';
  END IF;

  UPDATE agent_profiles
  SET subscription_plan = new_plan
  WHERE id = target_agent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent not found';
  END IF;
END;
$$;
