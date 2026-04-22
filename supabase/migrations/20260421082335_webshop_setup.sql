-- ============================================================
-- Task 1.2a — Extend orders table for webshop orders
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'pos'
    CHECK (source IN ('pos', 'webshop')),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup'
    CHECK (delivery_method IN ('pickup', 'delivery'));

-- ============================================================
-- Task 1.2b — New webshop tables
-- ============================================================

-- Guest cart + session persistence
CREATE TABLE IF NOT EXISTS webshop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cart_data JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webshop_sessions_token ON webshop_sessions(session_token);

-- Link Supabase Auth customer accounts to POS customers table
CREATE TABLE IF NOT EXISTS webshop_customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned cart recovery
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  session_token TEXT,
  cart_data JSONB NOT NULL DEFAULT '[]',
  recovery_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery
  ON abandoned_carts(recovery_sent_at) WHERE recovery_sent_at IS NULL;

-- Product reviews (used in Phase 7)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Task 1.2c — Secure public views (hide cost_price, supplier_id)
-- ============================================================
CREATE OR REPLACE VIEW public_products AS
  SELECT
    id, name, slug, description, short_description,
    category_id, brand,
    selling_price, compare_at_price, tax_rate, is_taxable,
    is_active, is_featured, has_variants, allow_backorder,
    low_stock_threshold, image_url, gallery_paths, tags, meta_data,
    track_inventory, created_at, updated_at
  FROM products
  WHERE is_active = true;

CREATE OR REPLACE VIEW public_inventory AS
  SELECT id, product_id, variant_id, location_id, quantity, reserved_quantity
  FROM inventory;

-- Revoke direct table access from anonymous + customer users
REVOKE SELECT ON products FROM anon, authenticated;
GRANT SELECT ON public_products TO anon, authenticated;
GRANT SELECT ON public_inventory TO anon, authenticated;

-- ============================================================
-- Task 1.2d — RLS policies
-- ============================================================

-- Orders: customers can only see their own webshop orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Customers see own webshop orders'
  ) THEN
    CREATE POLICY "Customers see own webshop orders"
      ON orders FOR SELECT
      USING (source = 'webshop' AND customer_email = auth.jwt() ->> 'email');
  END IF;
END $$;

-- Categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'categories' AND policyname = 'Public read active categories'
  ) THEN
    CREATE POLICY "Public read active categories"
      ON categories FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- ============================================================
-- Task 1.2e — Atomic inventory reservation function
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_location_id UUID,
  p_quantity INT
) RETURNS BOOLEAN AS $$
DECLARE v_available INT;
BEGIN
  SELECT quantity - reserved_quantity INTO v_available
  FROM inventory
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (p_variant_id IS NULL AND variant_id IS NULL))
    AND location_id = p_location_id
  FOR UPDATE;

  IF v_available >= p_quantity THEN
    UPDATE inventory
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE product_id = p_product_id AND location_id = p_location_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Task 2.1 — Auto-create user_profiles row for webshop customers
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_webshop_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_webshop_auth_user_created ON auth.users;
CREATE TRIGGER on_webshop_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_webshop_user();
