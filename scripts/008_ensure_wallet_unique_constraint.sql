-- Add unique constraint on wallets user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallets_user_id_key'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add index on profiles username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
