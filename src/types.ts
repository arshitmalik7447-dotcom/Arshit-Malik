/**
 * Tiona Assistant - Shared Types & Interfaces
 */

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  price_minor: number; // Stored as integer minor units (paise: e.g. 118500 = ₹1,185)
  regular_price_minor: number | null;
  sale_price_minor: number | null;
  currency: string;
  currency_symbol: string;
  on_sale: boolean;
  in_stock: boolean;
  images: ProductImage[];
  description: string;
  categories: string[];
  attributes: ProductAttribute[];
  design_theme: string;
  metal_specified: string;
  stones_specified: string;
  conflict_notes: string;
  is_active: boolean;
  last_verified_at: string;
}

export interface KnowledgeSource {
  id: number;
  url: string;
  source_type: 'public_page' | 'catalogue_api' | 'terms' | 'unverified_discovery';
  title: string;
  content_hash: string;
  raw_content: string;
  approval_status: 'approved' | 'conflict' | 'pending_review';
  conflict_notes: string;
  last_synced_at: string;
  sync_status: 'success' | 'failed';
  last_error: string;
}

export interface KnowledgeItem {
  id: number;
  source_id?: number;
  category: string;
  question: string;
  answer: string;
  has_conflict: boolean;
  conflict_resolution: string;
}

export interface ChatMessage {
  id: string | number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  recommended_products?: Product[];
  source_links?: { title: string; url: string }[];
  follow_up?: string;
  created_at: string;
}

export type EnquiryType =
  | 'Product enquiry'
  | 'Order support'
  | 'Piercing enquiry'
  | 'Bulk/wholesale'
  | 'Feedback'
  | 'Other Tiona-related enquiry';

export interface Enquiry {
  id: number;
  reference: string;
  idempotency_key?: string;
  session_id?: string;
  name: string;
  reply_method: 'email' | 'phone_whatsapp';
  reply_value: string;
  enquiry_type: EnquiryType;
  message: string;
  product_id?: number | null;
  product_name?: string | null;
  product_url?: string | null;
  order_reference?: string | null;
  consent_given: boolean;
  consent_timestamp: string;
  status: 'new' | 'in_progress' | 'resolved';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  email_status?: string;
}

export interface OutboxJob {
  id: number;
  enquiry_id: number;
  enquiry_reference: string;
  recipient: string;
  reply_to: string;
  subject: string;
  body_text: string;
  body_html: string;
  status: 'queued' | 'provider_accepted' | 'delivered' | 'failed' | 'bounced';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  brand: string;
  bot_name: string;
  tagline: string;
  website: string;
  email: string;
  phone: string;
  whatsapp_url: string;
  address: string;
  showroom_disclaimer: string;
  contact_hours: string;
  response_estimate: string;
  quick_actions: string[];
}
