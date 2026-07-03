-- Migration: 006_create_customers
-- Description: Create customers table with loyalty points and credit account

-- UP
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    credit_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
    date_of_birth DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- DOWN
-- DROP TABLE IF EXISTS customers;
