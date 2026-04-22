-- ============================================================
-- Webshop payment support additions
-- ============================================================

-- Idempotency: unique M-Pesa receipt number prevents duplicate payment records
ALTER TABLE payments
  ADD CONSTRAINT payments_mpesa_receipt_unique UNIQUE (mpesa_receipt_number);

-- confirm_inventory: converts reserved → actual decrement after payment confirmed
CREATE OR REPLACE FUNCTION confirm_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET
    quantity          = quantity - p_quantity,
    reserved_quantity = reserved_quantity - p_quantity
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (p_variant_id IS NULL AND variant_id IS NULL));
END;
$$ LANGUAGE plpgsql;
