-- Drop the old check constraint
ALTER TABLE user_books DROP CONSTRAINT IF EXISTS user_books_status_check;

-- Add new check constraint with the correct status values
ALTER TABLE user_books ADD CONSTRAINT user_books_status_check 
  CHECK (status IN ('private', 'hold', 'lending', 'selling', 'reading', 'completed', 'want_to_read', 'not_interested'));

-- Update default value to match new options
ALTER TABLE user_books ALTER COLUMN status SET DEFAULT 'private';
