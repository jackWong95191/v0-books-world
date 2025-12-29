-- Fix RLS policies to allow trigger to create profiles and wallets
-- The trigger runs as SECURITY DEFINER but RLS still applies

-- Drop and recreate profiles RLS policies to allow trigger inserts
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_trigger ON public.profiles;

-- Allow authenticated users to insert their own profile
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow the trigger function to insert profiles (runs as postgres/definer)
CREATE POLICY profiles_insert_trigger ON public.profiles
  FOR INSERT
  TO postgres, service_role
  WITH CHECK (true);

-- Fix wallets RLS policies
DROP POLICY IF EXISTS wallets_insert_own ON public.wallets;
DROP POLICY IF EXISTS wallets_insert_trigger ON public.wallets;

-- Allow authenticated users to insert their own wallet
CREATE POLICY wallets_insert_own ON public.wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow the trigger function to insert wallets
CREATE POLICY wallets_insert_trigger ON public.wallets
  FOR INSERT
  TO postgres, service_role
  WITH CHECK (true);

-- Ensure the trigger function has the right role grants
GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.wallets TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
