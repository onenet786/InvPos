-- Migration: 014_add_hot_item_to_products
-- Description: Add is_hot_item and hot_item_order columns for manual quick-select items

-- UP
ALTER TABLE products ADD COLUMN is_hot_item BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN hot_item_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_products_hot_item ON products (is_hot_item) WHERE is_hot_item = true;

-- DOWN
-- ALTER TABLE products DROP COLUMN IF EXISTS hot_item_order;
-- ALTER TABLE products DROP COLUMN IF EXISTS is_hot_item;
