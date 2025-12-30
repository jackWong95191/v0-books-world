-- Add display_order column to user_books table for custom book ordering
ALTER TABLE user_books ADD COLUMN IF NOT EXISTS display_order integer;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_books_display_order ON user_books(user_id, display_order);

-- Set initial display order based on added_at timestamp
UPDATE user_books 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY added_at) as row_num
  FROM user_books
  WHERE display_order IS NULL
) as subquery
WHERE user_books.id = subquery.id;
