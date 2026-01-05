-- Add visibility field to user_books for admin to control book searchability
ALTER TABLE user_books ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';
ALTER TABLE user_books ADD CONSTRAINT user_books_visibility_check CHECK (visibility IN ('private', 'searchable'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_books_visibility ON user_books(visibility);

-- Update RLS policies to hide admin from public view
-- Admin can see all, but others cannot see admin's data unless explicitly shared

-- Update books policies to allow searchable admin books to be visible
DROP POLICY IF EXISTS "books_select_own_and_public" ON books;
CREATE POLICY "books_select_own_and_public" ON books
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR owner_id = '7881efa4-4809-47da-b719-2139bd41d603'::uuid
    OR auth.uid() = '7881efa4-4809-47da-b719-2139bd41d603'::uuid
  );

-- Update profiles RLS to hide admin from searches
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR auth.uid() = '7881efa4-4809-47da-b719-2139bd41d603'::uuid
    OR id != '7881efa4-4809-47da-b719-2139bd41d603'::uuid
  );

-- Prevent follows to/from admin
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT
  WITH CHECK (
    follower_id = auth.uid()
    AND follower_id != '7881efa4-4809-47da-b719-2139bd41d603'::uuid
    AND following_id != '7881efa4-4809-47da-b719-2139bd41d603'::uuid
  );

COMMENT ON COLUMN user_books.visibility IS 'Visibility setting for admin books: private (default) or searchable (shows as system recommended)';
