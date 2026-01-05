-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  message_type TEXT CHECK (message_type IN ('general', 'borrow_request', 'buy_request')) DEFAULT 'general',
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_book ON messages(book_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete messages they sent"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- RLS Policies for message_attachments
CREATE POLICY "Users can view attachments of their messages"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_attachments.message_id 
      AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can add attachments to their sent messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_attachments.message_id 
      AND messages.sender_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "admin_select_all_messages"
  ON messages FOR SELECT
  USING (auth.uid() = '7881efa4-4809-47da-b719-2139bd41d603'::uuid);

CREATE POLICY "admin_select_all_attachments"
  ON message_attachments FOR SELECT
  USING (auth.uid() = '7881efa4-4809-47da-b719-2139bd41d603'::uuid);
