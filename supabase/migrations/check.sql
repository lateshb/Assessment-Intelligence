-- Apply migration via Supabase MCP
-- This file will be executed through the Supabase Management API

DO $$
BEGIN
  -- Check if migration already applied
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE 'Applying initial schema migration...';
  ELSE
    RAISE NOTICE 'Migration already applied, skipping...';
    RETURN;
  END IF;
END $$;
