-- Add gallery_paths to product_variants for multi-image variant support
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS gallery_paths text[] DEFAULT '{}';

-- Expose gallery_paths in the public variant select used by webshop
-- (product_variants table has no public view — accessed directly with RLS via webshop service role)
