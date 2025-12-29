-- Add default bookstore image templates for all users to choose from
-- These are famous world-class bookstores with beautiful interior designs
-- Note: Run this AFTER 003_transform_to_booksworld.sql

-- Use NULL for template stores instead of system user ID
DO $$
BEGIN
  -- Insert default bookstore templates with NULL user_id
  INSERT INTO bookstore_images (id, user_id, image_url, title, description, is_template, created_at)
  VALUES 
    (
      gen_random_uuid(),
      NULL, -- Templates don't belong to any user
      '/images/bookstores/el-ateneo.jpg',
      'El Ateneo Grand Splendid',
      'Historic theatre converted into a bookstore in Buenos Aires, Argentina. Features ornate ceiling frescoes, red velvet curtains, and theatre balconies.',
      true,
      NOW()
    ),
    (
      gen_random_uuid(),
      NULL,
      '/images/bookstores/daikanyama-tsutaya.jpg',
      'Daikanyama Tsutaya Books',
      'Modern Japanese bookstore in Tokyo with floor-to-ceiling shelves made of ash wood, arranged by lifestyle themes.',
      true,
      NOW()
    ),
    (
      gen_random_uuid(),
      NULL,
      '/images/bookstores/zhongshuge-hangzhou.jpg',
      'Hangzhou Zhongshuge',
      'Contemporary Chinese bookstore featuring tree-like pillars, mirrored ceiling creating infinite space illusion, and creative children''s section.',
      true,
      NOW()
    )
  ON CONFLICT DO NOTHING; -- Prevent duplicate inserts if script runs multiple times
END $$;

-- Update RLS to allow everyone to read template bookstores
DROP POLICY IF EXISTS bookstore_images_select_all ON bookstore_images;
CREATE POLICY bookstore_images_select_all
  ON bookstore_images FOR SELECT
  USING (is_template = true OR auth.uid() = user_id);
