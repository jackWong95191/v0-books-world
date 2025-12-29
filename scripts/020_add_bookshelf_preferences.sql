-- Add bookshelf_preferences table to store user customizations
CREATE TABLE IF NOT EXISTS bookshelf_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wood_color TEXT NOT NULL DEFAULT 'mahogany',
  wood_material TEXT NOT NULL DEFAULT 'wood',
  shelf_rows INTEGER NOT NULL DEFAULT 4,
  shelf_columns INTEGER NOT NULL DEFAULT 5,
  show_decorations BOOLEAN NOT NULL DEFAULT true,
  decoration_style TEXT DEFAULT 'minimal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE bookshelf_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookshelf preferences"
  ON bookshelf_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookshelf preferences"
  ON bookshelf_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookshelf preferences"
  ON bookshelf_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_bookshelf_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_bookshelf_preferences_updated_at
  BEFORE UPDATE ON bookshelf_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_bookshelf_preferences_updated_at();

-- Grant permissions
GRANT ALL ON bookshelf_preferences TO authenticated;
