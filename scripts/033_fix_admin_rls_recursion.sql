-- Drop all existing admin policies that cause recursion
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_select_all_user_books" ON user_books;
DROP POLICY IF EXISTS "admin_select_all_books" ON books;
DROP POLICY IF EXISTS "admin_select_all_bookstores" ON bookstore_images;
DROP POLICY IF EXISTS "admin_select_all_orders" ON orders;
DROP POLICY IF EXISTS "admin_select_all_connections" ON connection_invitations;

-- Create a security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Check if the current user is the known admin
  RETURN auth.uid() = '7881efa4-4809-47da-b719-2139bd41d603'::uuid;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Recreate admin policies using the security definer function
CREATE POLICY "admin_select_all_profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_select_all_user_books"
  ON user_books FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_select_all_books"
  ON books FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_select_all_bookstores"
  ON bookstore_images FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_select_all_orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_select_all_connections"
  ON connection_invitations FOR SELECT
  USING (is_admin());

-- Allow admin to update profiles
CREATE POLICY "admin_update_all_profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Allow admin to delete books
CREATE POLICY "admin_delete_all_books"
  ON books FOR DELETE
  USING (is_admin());

COMMENT ON FUNCTION is_admin IS 'Checks if current user is admin without causing RLS recursion';
