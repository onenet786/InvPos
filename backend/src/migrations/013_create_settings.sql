-- Migration: 013_create_settings
-- Description: Create settings table for company information

-- UP
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL DEFAULT 'My Company',
    company_logo VARCHAR(500),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_id VARCHAR(100),
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '$',
    currency_code VARCHAR(10) NOT NULL DEFAULT 'USD',
    receipt_footer TEXT,
    receipt_header TEXT,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    tax_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    loyalty_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    loyalty_points_per_dollar DECIMAL(5, 2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (company_name, address, phone, email, receipt_footer)
VALUES ('InvPos Store', '123 Main Street', '555-0100', 'info@invpos.com', 'Thank you for your business!');

-- DOWN
-- DROP TABLE IF EXISTS settings;
