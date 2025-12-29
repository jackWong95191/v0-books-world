-- Corrected signup trigger with proper SQL syntax
-- Run this script to fix the signup functionality

-- Step 1: Ensure username can be NULL
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN username SET DEFAULT NULL;

-- Step 2: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 3: Create the signup trigger function with corrected syntax
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
BEGIN
  -- Extract username from metadata or email
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Create profile with retry logic for username conflicts
  WHILE v_attempt < v_max_attempts AND NOT v_profile_created LOOP
    BEGIN
      v_attempt := v_attempt + 1;
      
      -- Add numbered suffix if not first attempt
      IF v_attempt > 1 THEN
        v_username := COALESCE(
          NEW.raw_user_meta_data->>'username',
          split_part(NEW.email, '@', 1)
        ) || '_' || v_attempt::TEXT;
      END IF;
      
      -- Try to insert profile
      INSERT INTO public.profiles (
        id,
        username,
        full_name,
        avatar_url,
        bio,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        v_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
        NEW.raw_user_meta_data->>'avatar_url',
        NULL,
        NOW(),
        NOW()
      );
      
      v_profile_created := TRUE;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Username conflict, will retry with different suffix
        IF v_attempt >= v_max_attempts THEN
          -- Last resort: use UUID-based username
          v_username := 'user_' || substring(NEW.id::TEXT from 1 for 8);
        END IF;
      WHEN OTHERS THEN
        -- Log error but don't fail signup
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        EXIT;
    END;
  END LOOP;
  
  -- Create wallet (separate transaction to not block signup)
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
    );
    
    v_wallet_created := TRUE;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Wallet already exists, that's ok
      v_wallet_created := TRUE;
    WHEN OTHERS THEN
      -- Log error but don't fail signup
      RAISE WARNING 'Wallet creation failed for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Always return NEW to allow signup to proceed
  RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 5: Ensure RLS policies allow trigger to insert
DROP POLICY IF EXISTS profiles_insert_trigger ON profiles;
CREATE POLICY profiles_insert_trigger
  ON profiles
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS wallets_insert_trigger ON wallets;
CREATE POLICY wallets_insert_trigger
  ON wallets
  FOR INSERT
  WITH CHECK (true);

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.wallets TO postgres, service_role;
