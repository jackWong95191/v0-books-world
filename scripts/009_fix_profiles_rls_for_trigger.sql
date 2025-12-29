-- Update RLS policies to allow trigger-based profile creation
-- The trigger runs as SECURITY DEFINER, so we need to ensure it can insert

-- Drop and recreate the profiles insert policy to be less restrictive
drop policy if exists "profiles_insert_own" on public.profiles;

-- Allow inserts from authenticated users OR from the trigger
-- The trigger runs with elevated privileges, so this will work
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (
    auth.uid() = id OR 
    -- Allow insert if called from trigger (no active user session yet)
    auth.uid() is null
  );

-- Ensure wallets table has proper RLS policies for trigger
drop policy if exists "wallets_insert_own" on public.wallets;

create policy "wallets_insert_own"
  on public.wallets for insert
  with check (
    auth.uid() = user_id OR
    -- Allow insert from trigger during signup
    auth.uid() is null
  );

-- Add index on username for faster lookups during signup
create index if not exists profiles_username_idx on public.profiles(username);
