-- Allow public (unauthenticated) read access to agent_settings
-- for specific setting keys used in the user portal (e.g., regions, floating)
CREATE POLICY "agent_settings_public_read"
  ON public.agent_settings FOR SELECT
  USING (setting_key IN ('regions', 'floating'));
