-- Allow anonymous book creation by making owner_id nullable
-- and updating RLS policies to allow NULL owner_id

-- Make owner_id nullable in books table
ALTER TABLE books ALTER COLUMN owner_id DROP NOT NULL;

-- Drop existing insert policy
DROP POLICY IF EXISTS books_insert_authenticated ON books;

-- Create new insert policy that allows both authenticated and anonymous users
CREATE POLICY books_insert_all ON books
  FOR INSERT
  WITH CHECK (true);

-- Update update policy to allow updates for books with NULL owner_id
DROP POLICY IF EXISTS books_update_own ON books;
CREATE POLICY books_update_own ON books
  FOR UPDATE
  USING (owner_id IS NULL OR owner_id = auth.uid());

-- Update delete policy to allow deletes for books with NULL owner_id  
DROP POLICY IF EXISTS books_delete_own ON books;
CREATE POLICY books_delete_own ON books
  FOR DELETE
  USING (owner_id IS NULL OR owner_id = auth.uid());
