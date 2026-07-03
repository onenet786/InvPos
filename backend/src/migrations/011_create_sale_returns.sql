-- Migration: 011_create_sale_returns
-- Description: Create sale_returns and sale_return_items for refund processing

-- UP
CREATE TABLE sale_returns (
    id SERIAL PRIMARY KEY,
    return_number VARCHAR(50) NOT NULL UNIQUE,
    original_sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    processed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total DECIMAL(14, 2) NOT NULL DEFAULT 0,
    refund_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    reason TEXT,
    return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sale_return_items (
    id SERIAL PRIMARY KEY,
    sale_return_id INTEGER NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
    sale_item_id INTEGER NOT NULL REFERENCES sale_items(id) ON DELETE RESTRICT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sale_returns_original_sale ON sale_returns(original_sale_id);
CREATE INDEX idx_sale_returns_branch ON sale_returns(branch_id);
CREATE INDEX idx_sale_return_items_return_id ON sale_return_items(sale_return_id);

-- DOWN
-- DROP TABLE IF EXISTS sale_return_items;
-- DROP TABLE IF EXISTS sale_returns;
