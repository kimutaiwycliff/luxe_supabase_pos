-- The public_inventory view is a plain (non-SECURITY DEFINER) view, so it
-- executes under the caller's role. Without an anon SELECT policy on the
-- underlying inventory table, anonymous webshop visitors receive zero rows,
-- making every variant product appear out of stock.
CREATE POLICY "Anon can read inventory quantities"
  ON inventory
  FOR SELECT
  TO anon
  USING (true);
