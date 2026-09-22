-- Tiona Assistant PostgreSQL Schema Migration 001
-- Defines persistent tables for products, knowledge sources, chat sessions, enquiries, email outbox, and audit logs.

CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    permalink TEXT NOT NULL,
    sku VARCHAR(100) DEFAULT '',
    price_minor INTEGER NOT NULL,
    regular_price_minor INTEGER,
    sale_price_minor INTEGER,
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    on_sale BOOLEAN DEFAULT FALSE,
    in_stock BOOLEAN DEFAULT TRUE,
    images JSONB NOT NULL DEFAULT '[]',
    description TEXT NOT NULL DEFAULT '',
    categories JSONB NOT NULL DEFAULT '[]',
    attributes JSONB NOT NULL DEFAULT '[]',
    design_theme VARCHAR(100) DEFAULT '',
    metal_specified VARCHAR(100) DEFAULT '925 sterling silver',
    stones_specified VARCHAR(150) DEFAULT '',
    conflict_notes TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_price ON products (price_minor);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products (in_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);

CREATE TABLE IF NOT EXISTS knowledge_sources (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'public_page', 'catalogue_api', 'terms', 'unverified_discovery'
    title VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    raw_content TEXT NOT NULL,
    approval_status VARCHAR(50) DEFAULT 'approved', -- 'approved', 'conflict', 'pending_review'
    conflict_notes TEXT DEFAULT '',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed'
    last_error TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS knowledge_items (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'brand', 'contact', 'hours', 'shipping', 'returns', 'piercing', 'care'
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    has_conflict BOOLEAN DEFAULT FALSE,
    conflict_resolution TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(128) PRIMARY KEY,
    visitor_ip_hash VARCHAR(64),
    language_preference VARCHAR(20) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    recommended_product_ids JSONB DEFAULT '[]',
    source_links JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id);

CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    session_id VARCHAR(128),
    name VARCHAR(150) NOT NULL,
    reply_method VARCHAR(30) NOT NULL, -- 'email', 'phone_whatsapp'
    reply_value VARCHAR(150) NOT NULL,
    enquiry_type VARCHAR(60) NOT NULL, -- 'Product enquiry', 'Order support', 'Piercing enquiry', 'Bulk/wholesale', 'Feedback', 'Other Tiona-related enquiry'
    message TEXT NOT NULL,
    product_id BIGINT,
    product_name VARCHAR(255),
    product_url TEXT,
    order_reference VARCHAR(100),
    consent_given BOOLEAN NOT NULL DEFAULT TRUE,
    consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'resolved'
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS email_outbox (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER REFERENCES enquiries(id) ON DELETE CASCADE,
    enquiry_reference VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'queued', -- 'queued', 'provider_accepted', 'delivered', 'failed', 'bounced'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox (status);

CREATE TABLE IF NOT EXISTS admin_audit_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_hash VARCHAR(64) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
