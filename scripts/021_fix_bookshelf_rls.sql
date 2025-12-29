-- Fix RLS policies for bookshelf_preferences table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own bookshelf preferences" ON bookshelf_preferences;
DROP POLICY IF EXISTS "Users can insert own bookshelf preferences" ON bookshelf_preferences;
DROP POLICY IF EXISTS "Users can update own bookshelf preferences" ON bookshelf_preferences;
DROP POLICY IF EXISTS "Users can delete own bookshelf preferences" ON bookshelf_preferences;

-- Enable RLS
ALTER TABLE bookshelf_preferences ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Users can view own bookshelf preferences"
  ON bookshelf_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookshelf preferences"
  ON bookshelf_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookshelf preferences"
  ON bookshelf_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookshelf preferences"
  ON bookshelf_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
