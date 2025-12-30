-- Add new fields to profiles table for enhanced user profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS interested_categories text[], -- array of category strings
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text;

-- Create connection_invitations table for user connections
CREATE TABLE IF NOT EXISTS connection_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- RLS policies for connection_invitations
ALTER TABLE connection_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY connection_invitations_select_involved ON connection_invitations
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY connection_invitations_insert_own ON connection_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY connection_invitations_update_receiver ON connection_invitations
  FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY connection_invitations_delete_own ON connection_invitations
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connection_invitations_sender ON connection_invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_invitations_receiver ON connection_invitations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_invitations_status ON connection_invitations(status);
