-- Add text color and border color fields to bookstore_images table
ALTER TABLE bookstore_images
ADD COLUMN IF NOT EXISTS name_text_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS name_border_color TEXT DEFAULT '#000000';

-- Update existing records with default colors
UPDATE bookstore_images
SET name_text_color = '#FFFFFF',
    name_border_color = '#000000'
WHERE name_text_color IS NULL OR name_border_color IS NULL;
