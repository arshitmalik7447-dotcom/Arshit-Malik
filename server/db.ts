/**
 * PostgreSQL Database Adapter with automatic schema migrations & seed initialization.
 * Supports embedded PostgreSQL (PGlite) for container/local development and standard pg.Pool when DATABASE_URL is set.
 */

import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { STARTER_PRODUCTS } from './data/starterCatalogue.ts';
import { VERIFIED_BUSINESS_FACTS, UNVERIFIED_DISCOVERY_URLS } from './data/businessKnowledge.ts';

const { Pool } = pg;

interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>;
  exec(text: string): Promise<void>;
  close(): Promise<void>;
}

let activeClient: DbClient | null = null;
let isInitialized = false;

export async function getDb(): Promise<DbClient> {
  if (activeClient && isInitialized) {
    return activeClient;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    console.log('[Database] Connecting to external PostgreSQL instance via pg.Pool...');
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[Database] Unexpected error on idle PostgreSQL client:', err.message);
    });

    activeClient = {
      query: async <T = any>(text: string, params?: any[]) => {
        const res = await pool.query(text, params);
        return { rows: res.rows as T[] };
      },
      exec: async (text: string) => {
        await pool.query(text);
      },
      close: async () => {
        await pool.end();
      }
    };
  } else {
    const dataDir = path.resolve(process.cwd(), 'data', 'tiona_pg');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`[Database] Initializing embedded PostgreSQL (PGlite) storage at ${dataDir}...`);
    const pglite = new PGlite(dataDir);

    activeClient = {
      query: async <T = any>(text: string, params?: any[]) => {
        const res = await pglite.query(text, params);
        return { rows: (res.rows as T[]) || [] };
      },
      exec: async (text: string) => {
        await pglite.exec(text);
      },
      close: async () => {
        await pglite.close();
      }
    };
  }

  if (!activeClient) {
    throw new Error('Database client could not be initialized.');
  }

  await runMigrationsAndSeed(activeClient);
  isInitialized = true;
  return activeClient;
}

async function runMigrationsAndSeed(client: DbClient) {
  try {
    const migrationPath = path.resolve(process.cwd(), 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      // Execute the multi-statement migration script with exec
      await client.exec(sql);
      console.log('[Database] Migrations verified successfully.');
    }

    // Seed products if empty
    const { rows: existingProducts } = await client.query('SELECT COUNT(*) as count FROM products');
    const productCount = parseInt((existingProducts[0] as any)?.count || '0', 10);

    if (productCount === 0) {
      console.log(`[Database] Seeding ${STARTER_PRODUCTS.length} verified starter products...`);
      for (const prod of STARTER_PRODUCTS) {
        await client.query(
          `INSERT INTO products (
            id, name, slug, permalink, sku, price_minor, regular_price_minor, sale_price_minor,
            currency, currency_symbol, on_sale, in_stock, images, description, categories,
            attributes, design_theme, metal_specified, stones_specified, conflict_notes, is_active, last_verified_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO NOTHING`,
          [
            prod.id,
            prod.name,
            prod.slug,
            prod.permalink,
            prod.sku,
            prod.price_minor,
            prod.regular_price_minor,
            prod.sale_price_minor,
            prod.currency,
            prod.currency_symbol,
            prod.on_sale,
            prod.in_stock,
            JSON.stringify(prod.images),
            prod.description,
            JSON.stringify(prod.categories),
            JSON.stringify(prod.attributes),
            prod.design_theme,
            prod.metal_specified,
            prod.stones_specified,
            prod.conflict_notes,
            prod.is_active,
            prod.last_verified_at,
          ]
        );
      }
    }

    // Seed knowledge sources & items if empty
    const { rows: existingSources } = await client.query('SELECT COUNT(*) as count FROM knowledge_sources');
    const sourceCount = parseInt((existingSources[0] as any)?.count || '0', 10);

    if (sourceCount === 0) {
      console.log('[Database] Seeding verified knowledge sources and items...');
      // Primary verified sources
      const primarySources = [
        {
          url: 'https://tionasilver.com/contact-us/',
          title: 'Contact Us & Business Hours',
          type: 'public_page',
          status: 'approved',
          notes: 'Verified contact info, shared address disclaimer, hours'
        },
        {
          url: 'https://tionasilver.com/about-us/',
          title: 'About Tiona Silver',
          type: 'public_page',
          status: 'approved',
          notes: 'Brand tagline and story'
        },
        {
          url: 'https://tionasilver.com/batch-2026/',
          title: 'Materials, Piercing & Aftercare',
          type: 'public_page',
          status: 'approved',
          notes: '92.5 silver, surgical steel, piercing aftercare spray/product'
        },
        {
          url: 'https://tionasilver.com/',
          title: 'Homepage Policies',
          type: 'public_page',
          status: 'conflict',
          notes: 'COD advertised; delivery 3-4 days; no exchanges; gift packing ₹99'
        },
        {
          url: 'https://tionasilver.com/terms-and-coditions/',
          title: 'Terms & Conditions',
          type: 'terms',
          status: 'conflict',
          notes: 'Order confirmed on payment; used jewellery non-returnable; tarnish not defect'
        }
      ];

      for (const src of primarySources) {
        const hash = Buffer.from(src.url + src.title).toString('base64').substring(0, 32);
        const res = await client.query(
          `INSERT INTO knowledge_sources (url, source_type, title, content_hash, raw_content, approval_status, conflict_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (url) DO NOTHING
           RETURNING id`,
          [src.url, src.type, src.title, hash, src.notes, src.status, src.notes]
        );

        const sourceId = res.rows[0]?.id;
        if (sourceId) {
          // Add related items
          const matchingFacts = VERIFIED_BUSINESS_FACTS.filter(f => f.source_url === src.url);
          for (const fact of matchingFacts) {
            await client.query(
              `INSERT INTO knowledge_items (source_id, category, question, answer, has_conflict, conflict_resolution)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                sourceId,
                fact.category,
                fact.question,
                fact.answer,
                fact.has_conflict || false,
                fact.conflict_notes || ''
              ]
            );
          }
        }
      }

      // Add unverified discovery URLs
      for (const disc of UNVERIFIED_DISCOVERY_URLS) {
        const hash = Buffer.from(disc.url).toString('base64').substring(0, 32);
        await client.query(
          `INSERT INTO knowledge_sources (url, source_type, title, content_hash, raw_content, approval_status, conflict_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (url) DO NOTHING`,
          [disc.url, 'unverified_discovery', disc.title, hash, disc.notes, 'pending_review', disc.notes]
        );
      }
    }
  } catch (err: any) {
    console.error('[Database] Migration/Seed error:', err.message);
    throw err;
  }
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  try {
    const client = await getDb();
    const res = await client.query<T>(text, params);
    return res.rows;
  } catch (err: any) {
    console.error('[Database Query Error]:', err.message);
    throw new Error('Database operation failed. Please try again.');
  }
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
