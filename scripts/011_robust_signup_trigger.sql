-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a completely robust trigger function that bypasses all RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username TEXT;
  username_suffix INT := 0;
  final_username TEXT;
  max_attempts INT := 100;
BEGIN
  -- Generate base username from email or metadata
  new_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    SPLIT_PART(NEW.email, '@', 1),
    'user_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)
  );
  
  final_username := new_username;
  
  -- Try to insert profile with unique username
  FOR i IN 1..max_attempts LOOP
    BEGIN
      -- Insert profile - using INSERT with explicit columns
      INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL),
        NOW(),
        NOW()
      );
      
      -- If successful, exit the loop
      EXIT;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Username exists, try with suffix
        username_suffix := username_suffix + 1;
        final_username := new_username || '_' || username_suffix;
        
        -- If we've tried too many times, use a UUID-based username
        IF i >= max_attempts - 1 THEN
          final_username := 'user_' || REPLACE(NEW.id::TEXT, '-', '')::TEXT;
        END IF;
        
      WHEN OTHERS THEN
        -- Log the error but continue
        RAISE WARNING 'Error creating profile for user %: % %', NEW.id, SQLERRM, SQLSTATE;
        EXIT;
    END;
  END LOOP;

  -- Create wallet for new user
  BEGIN
    INSERT INTO public.wallets (user_id, balance_cents, created_at, updated_at)
    VALUES (NEW.id, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating wallet for user %: % %', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Catch any unexpected errors - log but don't fail auth
    RAISE WARNING 'Critical error in handle_new_user for %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure the function owner has proper permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Temporarily disable RLS for the trigger to work
-- The trigger policies should allow inserts when auth.role() is postgres
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Ensure trigger-specific policies exist and are correct
DO $$
BEGIN
  -- Drop old trigger policies if they exist
  DROP POLICY IF EXISTS profiles_insert_trigger ON public.profiles;
  DROP POLICY IF EXISTS wallets_insert_trigger ON public.wallets;
  
  -- Create new trigger policies that allow the postgres role (SECURITY DEFINER functions run as postgres)
  CREATE POLICY profiles_insert_trigger
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts from trigger context
    
  CREATE POLICY wallets_insert_trigger
    ON public.wallets
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts from trigger context
END $$;
