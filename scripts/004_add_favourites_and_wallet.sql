-- Add favourites and wallet functionality to BooksWorld

-- 1. Create favourites table (for users to save books from other users)
CREATE TABLE IF NOT EXISTS favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_tag_id UUID NOT NULL REFERENCES book_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_tag_id)
);

-- 2. Create wallet table (user balances)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create wallet_transactions table (transaction history)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL, -- positive for deposits/earnings, negative for withdrawals/purchases
  transaction_type TEXT NOT NULL, -- top_up, withdrawal, purchase, sale, refund
  status TEXT DEFAULT 'completed', -- pending, completed, failed, cancelled
  description TEXT,
  stripe_payment_intent_id TEXT,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for favourites
CREATE POLICY favourites_select_own ON favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY favourites_insert_own ON favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY favourites_delete_own ON favourites FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS Policies for wallets
CREATE POLICY wallets_select_own ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY wallets_insert_own ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY wallets_update_own ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create RLS Policies for wallet_transactions
CREATE POLICY wallet_transactions_select_own ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY wallet_transactions_insert_own ON wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create indexes
CREATE INDEX idx_favourites_user_id ON favourites(user_id);
CREATE INDEX idx_favourites_book_tag_id ON favourites(book_tag_id);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- 9. Create trigger for wallets updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to auto-create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance_cents)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger to auto-create wallet
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_new_user();

-- 12. Backfill wallets for existing users
INSERT INTO wallets (user_id, balance_cents)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
