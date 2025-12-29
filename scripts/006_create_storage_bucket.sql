-- Removed direct SQL manipulation of storage.buckets - this must be done via Supabase Dashboard
-- Instructions for creating storage bucket:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create a new bucket"
-- 3. Bucket name: bookstore-images
-- 4. Public bucket: Yes
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

-- Note: The storage bucket must be created manually through the Supabase Dashboard
-- because direct SQL access to storage.buckets requires superuser privileges.

-- After creating the bucket in the dashboard, run this script to set up RLS policies:

-- Set up RLS policies for the bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public can view bookstore images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload bookstore images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own bookstore images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own bookstore images" ON storage.objects;
END $$;

CREATE POLICY "Public can view bookstore images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bookstore-images');

CREATE POLICY "Authenticated users can upload bookstore images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bookstore-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own bookstore images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bookstore-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'bookstore-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own bookstore images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bookstore-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
