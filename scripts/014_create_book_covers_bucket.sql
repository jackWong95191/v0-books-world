-- ============================================================================
-- SUPABASE STORAGE SETUP - BOOK COVERS BUCKET
-- Fixed version using split_part() instead of array syntax
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET FOR BOOK COVERS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STEP 2: DROP EXISTING POLICIES (Clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload their own book covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view book covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own book covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own book covers" ON storage.objects;

-- ============================================================================
-- STEP 3: CREATE STORAGE POLICIES (Fixed with split_part)
-- ============================================================================

-- Policy 1: Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own book covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-covers' 
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Policy 2: Allow everyone to view book covers (public bucket)
CREATE POLICY "Anyone can view book covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'book-covers');

-- Policy 3: Allow users to update their own book covers
CREATE POLICY "Users can update their own book covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-covers' 
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'book-covers' 
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Policy 4: Allow users to delete their own book covers
CREATE POLICY "Users can delete their own book covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-covers' 
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- ============================================================================
-- STEP 4: CREATE BOOK COVERS METADATA TABLE (Optional but recommended)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.book_covers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID, -- Reference to your books table if you have one
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, file_path)
);

-- Enable RLS on metadata table
ALTER TABLE public.book_covers ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_book_covers_user_id ON public.book_covers(user_id);
CREATE INDEX IF NOT EXISTS idx_book_covers_book_id ON public.book_covers(book_id);

-- Drop existing policies for metadata table
DROP POLICY IF EXISTS "Users can insert their own book cover records" ON public.book_covers;
DROP POLICY IF EXISTS "Users can view their own book cover records" ON public.book_covers;
DROP POLICY IF EXISTS "Users can update their own book cover records" ON public.book_covers;
DROP POLICY IF EXISTS "Users can delete their own book cover records" ON public.book_covers;

-- Create policies for metadata table
CREATE POLICY "Users can insert their own book cover records"
ON public.book_covers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own book cover records"
ON public.book_covers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own book cover records"
ON public.book_covers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book cover records"
ON public.book_covers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: CREATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_book_cover_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_book_covers_updated_at ON public.book_covers;

CREATE TRIGGER set_book_covers_updated_at
  BEFORE UPDATE ON public.book_covers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_book_cover_updated_at();

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_covers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 7: VERIFICATION
-- ============================================================================

-- Verify bucket exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'book-covers') THEN
    RAISE NOTICE '✓ Bucket "book-covers" exists';
  ELSE
    RAISE WARNING '✗ Bucket "book-covers" not found';
  END IF;
END $$;

-- Verify storage policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%book cover%';
  
  RAISE NOTICE '✓ Found % storage policies for book covers', policy_count;
END $$;

-- Verify metadata table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'book_covers'
  ) THEN
    RAISE NOTICE '✓ Metadata table "book_covers" exists';
  ELSE
    RAISE WARNING '✗ Metadata table "book_covers" not found';
  END IF;
END $$;

-- Display final summary
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'BOOK COVERS STORAGE SETUP COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Bucket: book-covers (public)';
  RAISE NOTICE 'File limit: 5MB';
  RAISE NOTICE 'Allowed types: JPEG, PNG, WebP, GIF';
  RAISE NOTICE 'RLS: Enabled';
  RAISE NOTICE 'File path format: {user_id}/{filename}';
  RAISE NOTICE '================================================';
END $$;
