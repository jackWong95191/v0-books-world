-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Set the specific admin user
UPDATE profiles
SET role = 'admin'
WHERE id = '7881efa4-4809-47da-b719-2139bd41d603';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create RLS policies for admin access
-- Admin can view all profiles
CREATE POLICY "admin_select_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can view all user_books
CREATE POLICY "admin_select_all_user_books"
  ON public.user_books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can view all books
CREATE POLICY "admin_select_all_books"
  ON public.books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can view all bookstore_images
CREATE POLICY "admin_select_all_bookstores"
  ON public.bookstore_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can view all orders
CREATE POLICY "admin_select_all_orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can view all connection_invitations
CREATE POLICY "admin_select_all_connections"
  ON public.connection_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON COLUMN profiles.role IS 'User role: user (default), admin, or moderator';
