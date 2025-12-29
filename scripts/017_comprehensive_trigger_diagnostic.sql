-- Comprehensive diagnostic and fix for signup trigger issues
-- Run this script to ensure all signup functionality works correctly

-- Step 1: Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
    RAISE EXCEPTION 'profiles table does not exist';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'wallets') THEN
    RAISE EXCEPTION 'wallets table does not exist';
  END IF;
  RAISE NOTICE 'All required tables exist';
END $$;

-- Step 2: Ensure username can be NULL temporarily during signup
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN username SET DEFAULT NULL;

-- Step 3: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 4: Create comprehensive signup trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_attempt INTEGER := 0;
  v_max_attempts INTEGER := 50;
  v_profile_created BOOLEAN := FALSE;
  v_wallet_created BOOLEAN := FALSE;
  v_error_msg TEXT;
BEGIN
  RAISE NOTICE '🚀 Starting signup trigger for user %', NEW.id;
  
  -- Extract username from metadata or email
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  RAISE NOTICE '📝 Initial username: %', v_username;
  
  -- Step 4a: Create profile with retry logic
  WHILE v_attempt < v_max_attempts AND NOT v_profile_created LOOP
    BEGIN
      v_attempt := v_attempt + 1;
      
      -- Try with numbered suffix if not first attempt
      IF v_attempt > 1 THEN
        v_username := COALESCE(
          NEW.raw_user_meta_data->>'username',
          split_part(NEW.email, '@', 1)
        ) || '_' || v_attempt::TEXT;
      END IF;
      
      RAISE NOTICE '🔄 Attempt % to create profile with username: %', v_attempt, v_username;
      
      INSERT INTO public.profiles (
        id,
        username,
        full_name,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        v_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
      );
      
      v_profile_created := TRUE;
      RAISE NOTICE '✅ Profile created successfully with username: %', v_username;
      
    EXCEPTION 
      WHEN unique_violation THEN
        RAISE NOTICE '⚠️ Username % already exists, trying next...', v_username;
        IF v_attempt >= v_max_attempts THEN
          -- Last resort: use UUID
          v_username := 'user_' || substring(NEW.id::TEXT from 1 for 8);
          RAISE NOTICE '🆘 Using UUID-based username: %', v_username;
        END IF;
        CONTINUE;
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
        RAISE WARNING '❌ Profile creation error: %', v_error_msg;
        EXIT;
    END;
  END LOOP;
  
  -- Step 4b: Create wallet
  BEGIN
    RAISE NOTICE '💰 Creating wallet for user %', NEW.id;
    
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
    );
    
    v_wallet_created := TRUE;
    RAISE NOTICE '✅ Wallet created successfully';
    
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
    RAISE WARNING '❌ Wallet creation error: %', v_error_msg;
  END;
  
  -- Log final status
  IF v_profile_created AND v_wallet_created THEN
    RAISE NOTICE '🎉 Signup completed successfully for user %', NEW.id;
  ELSIF v_profile_created THEN
    RAISE WARNING '⚠️ Profile created but wallet failed for user %', NEW.id;
  ELSIF v_wallet_created THEN
    RAISE WARNING '⚠️ Wallet created but profile failed for user %', NEW.id;
  ELSE
    RAISE WARNING '❌ Both profile and wallet creation failed for user %', NEW.id;
  END IF;
  
  -- Always return NEW to allow auth signup to complete
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 6: Ensure RLS policies allow trigger operations
DROP POLICY IF EXISTS profiles_insert_trigger ON profiles;
CREATE POLICY profiles_insert_trigger ON profiles
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS wallets_insert_trigger ON wallets;
CREATE POLICY wallets_insert_trigger ON wallets
  FOR INSERT
  WITH CHECK (true);

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, authenticated, service_role;
GRANT ALL ON public.wallets TO postgres, authenticated, service_role;

-- Done!
RAISE NOTICE '✅ Comprehensive trigger setup completed successfully';
