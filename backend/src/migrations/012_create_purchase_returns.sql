-- Migration: 012_create_purchase_returns
-- Description: Create purchase_returns table for returning goods to suppliers

-- UP
CREATE TABLE purchase_returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    processed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total DECIMAL(14, 2) NOT NULL DEFAULT 0,
    reason TEXT,
    return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_return_items (
    id SERIAL PRIMARY KEY,
    purchase_return_id INTEGER NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_returns_po_id ON purchase_returns(purchase_order_id);
CREATE INDEX idx_purchase_returns_supplier_id ON purchase_returns(supplier_id);
CREATE INDEX idx_purchase_return_items_return_id ON purchase_return_items(purchase_return_id);

-- DOWN
-- DROP TABLE IF EXISTS purchase_return_items;
-- DROP TABLE IF EXISTS purchase_returns;
