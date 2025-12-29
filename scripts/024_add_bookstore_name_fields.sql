-- Add bookstore name styling fields to bookstore_images table
ALTER TABLE bookstore_images
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS name_x_percent NUMERIC DEFAULT 50,
ADD COLUMN IF NOT EXISTS name_y_percent NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS name_font_family TEXT DEFAULT 'serif',
ADD COLUMN IF NOT EXISTS name_font_size INTEGER DEFAULT 48;

-- Update default templates with sample store names
UPDATE bookstore_images
SET store_name = title
WHERE is_template = true AND store_name IS NULL;
