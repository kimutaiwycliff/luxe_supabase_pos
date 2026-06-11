-- Default products.tax_rate to 0 (VAT applied only when explicitly set)
ALTER TABLE products ALTER COLUMN tax_rate SET DEFAULT 0;
