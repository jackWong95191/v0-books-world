-- BooksWorld: Transform to interactive virtual bookstore platform
-- This script adds tables for bookstore images, book tags, shopping cart, and orders

-- 1. Create bookstore_images table
-- Users can upload bookstore images and make them their "virtual storefront"
CREATE TABLE IF NOT EXISTS bookstore_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Nullable for template stores
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active_storefront BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_bookstore_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Explicitly alter user_id to allow NULL if table already exists
ALTER TABLE bookstore_images ALTER COLUMN user_id DROP NOT NULL;

-- 2. Create book_tags table
-- Interactive tags/hotspots on bookstore images with X,Y coordinates
CREATE TABLE IF NOT EXISTS book_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookstore_image_id UUID NOT NULL REFERENCES bookstore_images(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_percent DECIMAL(5,2) NOT NULL,
  y_percent DECIMAL(5,2) NOT NULL,
  price_cents INTEGER,
  condition TEXT DEFAULT 'new',
  stock_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_tag_id UUID NOT NULL REFERENCES book_tags(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_tag_id)
);

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  delivery_status TEXT DEFAULT 'pending',
  delivery_provider TEXT DEFAULT 'sf_express',
  tracking_number TEXT,
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_tag_id UUID NOT NULL REFERENCES book_tags(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security
ALTER TABLE bookstore_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist, then create new ones
-- Drop existing policies to avoid duplicate policy errors
DO $$ 
BEGIN
  -- Drop bookstore_images policies
  DROP POLICY IF EXISTS bookstore_images_select_all ON bookstore_images;
  DROP POLICY IF EXISTS bookstore_images_insert_own ON bookstore_images;
  DROP POLICY IF EXISTS bookstore_images_update_own ON bookstore_images;
  DROP POLICY IF EXISTS bookstore_images_delete_own ON bookstore_images;
  
  -- Drop book_tags policies
  DROP POLICY IF EXISTS book_tags_select_all ON book_tags;
  DROP POLICY IF EXISTS book_tags_insert_own ON book_tags;
  DROP POLICY IF EXISTS book_tags_update_own ON book_tags;
  DROP POLICY IF EXISTS book_tags_delete_own ON book_tags;
  
  -- Drop cart_items policies
  DROP POLICY IF EXISTS cart_items_select_own ON cart_items;
  DROP POLICY IF EXISTS cart_items_insert_own ON cart_items;
  DROP POLICY IF EXISTS cart_items_update_own ON cart_items;
  DROP POLICY IF EXISTS cart_items_delete_own ON cart_items;
  
  -- Drop orders policies
  DROP POLICY IF EXISTS orders_select_own ON orders;
  DROP POLICY IF EXISTS orders_insert_own ON orders;
  DROP POLICY IF EXISTS orders_update_own ON orders;
  
  -- Drop order_items policies
  DROP POLICY IF EXISTS order_items_select_own ON order_items;
END $$;

-- 8. Create RLS Policies for bookstore_images
CREATE POLICY bookstore_images_select_all ON bookstore_images FOR SELECT USING (true);
CREATE POLICY bookstore_images_insert_own ON bookstore_images FOR INSERT WITH CHECK (
  (is_template = true AND user_id IS NULL) OR (auth.uid() = user_id)
);
CREATE POLICY bookstore_images_update_own ON bookstore_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY bookstore_images_delete_own ON bookstore_images FOR DELETE USING (auth.uid() = user_id);

-- 9. Create RLS Policies for book_tags
CREATE POLICY book_tags_select_all ON book_tags FOR SELECT USING (true);
CREATE POLICY book_tags_insert_own ON book_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY book_tags_update_own ON book_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY book_tags_delete_own ON book_tags FOR DELETE USING (auth.uid() = user_id);

-- 10. Create RLS Policies for cart_items
CREATE POLICY cart_items_select_own ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY cart_items_insert_own ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cart_items_update_own ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cart_items_delete_own ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- 11. Create RLS Policies for orders
CREATE POLICY orders_select_own ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY orders_insert_own ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY orders_update_own ON orders FOR UPDATE USING (auth.uid() = user_id);

-- 12. Create RLS Policies for order_items
CREATE POLICY order_items_select_own ON order_items FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM orders WHERE id = order_id
  )
);

-- 13. Create indexes for performance (with IF NOT EXISTS checks)
CREATE INDEX IF NOT EXISTS idx_bookstore_images_user_id ON bookstore_images(user_id);
CREATE INDEX IF NOT EXISTS idx_bookstore_images_active ON bookstore_images(user_id, is_active_storefront);
CREATE INDEX IF NOT EXISTS idx_bookstore_images_template ON bookstore_images(is_template);
CREATE INDEX IF NOT EXISTS idx_book_tags_bookstore_image ON book_tags(bookstore_image_id);
CREATE INDEX IF NOT EXISTS idx_book_tags_book_id ON book_tags(book_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 14. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Drop existing triggers if they exist, then create new ones
-- Drop existing triggers to avoid errors on re-run
DROP TRIGGER IF EXISTS update_bookstore_images_updated_at ON bookstore_images;
DROP TRIGGER IF EXISTS update_book_tags_updated_at ON book_tags;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- 16. Create triggers for updated_at
CREATE TRIGGER update_bookstore_images_updated_at BEFORE UPDATE ON bookstore_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_book_tags_updated_at BEFORE UPDATE ON book_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
