-- Add is_template column to bookstore_images table
ALTER TABLE bookstore_images 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookstore_images_is_template 
ON bookstore_images(is_template) WHERE is_template = true;

-- Update RLS policies if needed (allow public to view templates)
DROP POLICY IF EXISTS bookstore_images_select_all ON bookstore_images;

CREATE POLICY bookstore_images_select_all ON bookstore_images
  FOR SELECT
  USING (
    is_template = true OR 
    user_id = auth.uid() OR 
    is_active_storefront = true
  );

COMMENT ON COLUMN bookstore_images.is_template IS 'Indicates if this is a reusable template bookstore';
