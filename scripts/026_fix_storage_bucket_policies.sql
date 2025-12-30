-- Fix storage bucket policies for book-covers
-- This ensures authenticated users can upload their own book covers

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own book covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view book covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own book covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own book covers" ON storage.objects;

-- Allow authenticated users to upload their own book covers
CREATE POLICY "Users can upload their own book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view book covers (since they're public)
CREATE POLICY "Anyone can view book covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-covers');

-- Allow users to update their own book covers
CREATE POLICY "Users can update their own book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'book-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own book covers
CREATE POLICY "Users can delete their own book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
