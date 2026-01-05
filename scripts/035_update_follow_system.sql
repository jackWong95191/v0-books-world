-- Update the follows table to add message and status for follow requests
-- This allows Instagram-like follow functionality with approval

-- Add columns for follow request message and status
ALTER TABLE follows ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE follows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
ALTER TABLE follows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add constraint for status values
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_status_check;
ALTER TABLE follows ADD CONSTRAINT follows_status_check CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update RLS policies for follows
DROP POLICY IF EXISTS follows_select_all ON follows;
DROP POLICY IF EXISTS follows_insert_own ON follows;
DROP POLICY IF EXISTS follows_delete_own ON follows;

-- Allow users to view follows where they are involved
CREATE POLICY follows_select_involved ON follows
  FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

-- Allow users to create follow requests
CREATE POLICY follows_insert_request ON follows
  FOR INSERT
  WITH CHECK (follower_id = auth.uid());

-- Allow users to update follow requests they received
CREATE POLICY follows_update_receiver ON follows
  FOR UPDATE
  USING (following_id = auth.uid())
  WITH CHECK (following_id = auth.uid());

-- Allow users to delete their own follow relationships
CREATE POLICY follows_delete_involved ON follows
  FOR DELETE
  USING (follower_id = auth.uid() OR following_id = auth.uid());

-- Admin policies for follows
CREATE POLICY admin_select_all_follows ON follows
  FOR SELECT
  USING (auth.uid() = '7881efa4-4809-47da-b719-2139bd41d603'::uuid);
