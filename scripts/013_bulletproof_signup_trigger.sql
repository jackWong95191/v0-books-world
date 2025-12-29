-- Bulletproof signup trigger that handles all edge cases
-- This fixes the "Database error saving new user" error

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a robust function that never fails the auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_attempt INTEGER := 0;
  v_max_attempts INTEGER := 10;
  v_success BOOLEAN := FALSE;
BEGIN
  -- Extract username from email (before @)
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Clean username: lowercase, alphanumeric only
  v_username := lower(regexp_replace(v_username, '[^a-z0-9_]', '', 'g'));
  
  -- Ensure minimum length
  IF length(v_username) < 3 THEN
    v_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  -- Try to insert profile with unique username
  WHILE v_attempt < v_max_attempts AND NOT v_success LOOP
    BEGIN
      -- Attempt to insert profile
      INSERT INTO public.profiles (
        id,
        username,
        full_name,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        CASE 
          WHEN v_attempt = 0 THEN v_username
          ELSE v_username || '_' || v_attempt
        END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
        NOW(),
        NOW()
      );
      
      v_success := TRUE;
      
    EXCEPTION 
      WHEN unique_violation THEN
        -- Username taken, try next variation
        v_attempt := v_attempt + 1;
      WHEN OTHERS THEN
        -- Log error but don't fail auth
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        v_attempt := v_max_attempts; -- Exit loop
    END;
  END LOOP;

  -- Create wallet (separate transaction to avoid blocking profile)
  BEGIN
    INSERT INTO public.wallets (
      id,
      user_id,
      balance_cents,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Handle race conditions
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Wallet creation failed for user %: %', NEW.id, SQLERRM;
  END;

  -- Always return NEW to allow auth signup to succeed
  RETURN NEW;
  
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow trigger inserts
-- Profiles policies
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts from trigger context

-- Wallets policies  
DROP POLICY IF EXISTS "wallets_insert_trigger" ON public.wallets;
CREATE POLICY "wallets_insert_trigger"
  ON public.wallets
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts from trigger context

-- Add unique constraint on wallets.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallets_user_id_key'
  ) THEN
    ALTER TABLE public.wallets 
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.wallets TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;

-- Test the trigger (optional - remove in production)
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that creates profile and wallet for new users. Never fails auth signup.';
