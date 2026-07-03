-- Migration: 008_create_stock_adjustments
-- Description: Create stock_adjustments table for damage, loss, returns with reason logging

-- UP
CREATE TYPE adjustment_type AS ENUM ('damage', 'loss', 'return', 'initial_stock', 'transfer_in', 'transfer_out', 'correction');

CREATE TABLE stock_adjustments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    type adjustment_type NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference VARCHAR(255),
    adjusted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_adj_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adj_branch_id ON stock_adjustments(branch_id);
CREATE INDEX idx_stock_adj_type ON stock_adjustments(type);
CREATE INDEX idx_stock_adj_date ON stock_adjustments(adjustment_date);

-- DOWN
-- DROP TABLE IF EXISTS stock_adjustments;
-- DROP TYPE IF EXISTS adjustment_type;
