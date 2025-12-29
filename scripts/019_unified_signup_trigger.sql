-- UNIFIED SIGNUP TRIGGER - FINAL FIX
-- This script creates a single, bulletproof trigger that handles both profile and wallet creation

-- Step 1: Drop all existing signup triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_wallet_for_new_user() CASCADE;

-- Step 2: Ensure wallets_insert_trigger policy exists
DROP POLICY IF EXISTS wallets_insert_trigger ON wallets;
CREATE POLICY wallets_insert_trigger ON wallets
  FOR INSERT
  WITH CHECK (true);

-- Step 3: Ensure profiles_insert_trigger policy exists  
DROP POLICY IF EXISTS profiles_insert_trigger ON profiles;
CREATE POLICY profiles_insert_trigger ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Step 4: Create the unified trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_attempt INTEGER := 0;
  v_max_attempts INTEGER := 20;
  v_profile_created BOOLEAN := FALSE;
  v_wallet_created BOOLEAN := FALSE;
BEGIN
  -- Get username from metadata or generate default
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Try to create profile with retry logic for username conflicts
  WHILE v_attempt < v_max_attempts AND NOT v_profile_created LOOP
    BEGIN
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
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
      );
      
      v_profile_created := TRUE;
      
    EXCEPTION 
      WHEN unique_violation THEN
        v_attempt := v_attempt + 1;
        IF v_attempt >= v_max_attempts THEN
          -- Last resort: use UUID-based username
          BEGIN
            INSERT INTO public.profiles (
              id,
              username,
              full_name,
              created_at,
              updated_at
            ) VALUES (
              NEW.id,
              'user_' || substring(NEW.id::text, 1, 8),
              v_username,
              NOW(),
              NOW()
            );
            v_profile_created := TRUE;
          EXCEPTION WHEN OTHERS THEN
            -- Profile creation failed, but don't block auth
            NULL;
          END;
        END IF;
      WHEN OTHERS THEN
        -- Other errors, don't block auth
        NULL;
    END;
  END LOOP;

  -- Try to create wallet (independent of profile creation)
  BEGIN
    INSERT INTO public.wallets (
      user_id,
      balance_cents,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    v_wallet_created := TRUE;
    
  EXCEPTION WHEN OTHERS THEN
    -- Wallet creation failed, but don't block auth
    NULL;
  END;

  -- Always return NEW to ensure auth signup succeeds
  RETURN NEW;
END;
$$;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 7: Backfill for existing users without profiles or wallets
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT 
  id,
  COALESCE(
    raw_user_meta_data->>'username',
    split_part(email, '@', 1),
    'user_' || substring(id::text, 1, 8)
  ),
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallets (user_id, balance_cents, created_at, updated_at)
SELECT id, 0, NOW(), NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Unified signup trigger created successfully!';
END $$;
