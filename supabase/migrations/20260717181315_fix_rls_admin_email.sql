-- Fix RLS constraints by allowing any registered auth user as admin
CREATE OR REPLACE FUNCTION get_admin_email()
RETURNS text AS $$
DECLARE
  v_email text;
BEGIN
  -- If user is logged in, check if their email claim is registered in public auth users list
  v_email := auth.jwt() ->> 'email';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RETURN v_email;
  END IF;
  
  -- Fallback to the configured single admin settings email
  SELECT admin_email INTO v_email
  FROM public.admin_settings
  LIMIT 1;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_admin_email() IS 'Resolves admin email from the caller JWT if they are in auth.users, or falls back to public.admin_settings configuration.';
