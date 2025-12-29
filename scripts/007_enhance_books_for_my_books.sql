-- Enhance books table for "My Books" feature
-- Add more fields for book management and allow users to add their own books

-- Add new columns to books table for more detailed information
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh';
ALTER TABLE books ADD COLUMN IF NOT EXISTS pages INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'paperback';
ALTER TABLE books ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make ISBN non-unique since multiple users might add the same book
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_isbn_key;

-- Update RLS policies for books - allow users to add their own books
DROP POLICY IF EXISTS books_insert_admin ON books;

CREATE POLICY books_insert_authenticated ON books FOR INSERT 
  WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY books_update_own ON books FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY books_delete_own ON books FOR DELETE 
  USING (auth.uid() = owner_id);

-- Add index for owner_id
CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);

-- Add updated_at column and trigger for books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
