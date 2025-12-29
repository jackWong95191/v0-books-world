-- Fix RLS policies for bookshelf_preferences to allow inserts and updates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON bookshelf_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON bookshelf_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON bookshelf_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON bookshelf_preferences;

-- Enable RLS
ALTER TABLE bookshelf_preferences ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for authenticated users
CREATE POLICY "Users can view their own preferences"
ON bookshelf_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON bookshelf_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON bookshelf_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON bookshelf_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON bookshelf_preferences TO authenticated;
