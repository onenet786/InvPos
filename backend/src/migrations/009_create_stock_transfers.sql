-- Migration: 009_create_stock_transfers
-- Description: Create stock_transfers table for inter-branch stock movements

-- UP
CREATE TYPE transfer_status AS ENUM ('draft', 'in_transit', 'received', 'cancelled');

CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    from_branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status transfer_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock_transfer_items (
    id SERIAL PRIMARY KEY,
    stock_transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transfers_from_branch ON stock_transfers(from_branch_id);
CREATE INDEX idx_transfers_to_branch ON stock_transfers(to_branch_id);
CREATE INDEX idx_transfers_status ON stock_transfers(status);
CREATE INDEX idx_transfer_items_transfer_id ON stock_transfer_items(stock_transfer_id);

-- DOWN
-- DROP TABLE IF EXISTS stock_transfer_items;
-- DROP TABLE IF EXISTS stock_transfers;
-- DROP TYPE IF EXISTS transfer_status;
