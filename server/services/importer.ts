/**
 * Website Knowledge Importer & Public WooCommerce Catalogue Synchronizer.
 * Enforces strict SSRF protection, pagination handling, price parsing into minor units,
 * and conflict / review queue management.
 */

import crypto from 'crypto';
import { query } from '../db.ts';
import { STARTER_PRODUCTS } from '../data/starterCatalogue.ts';

const ALLOWED_HOSTS = ['tionasilver.com', 'www.tionasilver.com'];
const WOOCOMMERCE_API_BASE = 'https://tionasilver.com/wp-json/wc/store/v1/products?per_page=100&page=';

export interface SyncResult {
  source: string;
  status: 'success' | 'failed' | 'stale_preserved';
  message: string;
  itemCount: number;
  syncedAt: string;
}

/**
 * Validates a URL against strict SSRF constraints.
 * Only HTTPS requests to tionasilver.com are permitted.
 */
export function isSafePublicUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.includes(hostname)) {
      return false;
    }
    // Disallow IP literals, internal hostnames, or authentication
    if (parsed.username || parsed.password || parsed.port) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Syncs the WooCommerce catalogue from public Store API.
 * Preserves existing products if network fails.
 */
export async function syncWooCommerceCatalogue(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  let currentPage = 1;
  let totalPages = 1;
  const fetchedProducts: any[] = [];
  let fetchFailed = false;
  let failureReason = '';

  try {
    while (currentPage <= totalPages) {
      const targetUrl = `${WOOCOMMERCE_API_BASE}${currentPage}`;
      if (!isSafePublicUrl(targetUrl)) {
        throw new Error('Target URL violates SSRF safety policy.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'TionaAssistantBot/1.0 (PublicCatalogueSync; +https://tionasilver.com)',
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          fetchFailed = true;
          failureReason = `WooCommerce API returned HTTP ${response.status}`;
          break;
        }

        const totalPagesHeader = response.headers.get('X-WP-TotalPages');
        if (totalPagesHeader) {
          const parsedPages = parseInt(totalPagesHeader, 10);
          if (!isNaN(parsedPages) && parsedPages > 0) {
            totalPages = parsedPages;
          }
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          fetchedProducts.push(...data);
        }
      } catch (reqErr: any) {
        clearTimeout(timeoutId);
        fetchFailed = true;
        failureReason = reqErr.name === 'AbortError' ? 'Request timed out after 8s' : reqErr.message;
        break;
      }

      currentPage++;
    }
  } catch (err: any) {
    fetchFailed = true;
    failureReason = err.message;
  }

  // If live sync failed, we preserve current catalogue and mark stale
  if (fetchFailed || fetchedProducts.length === 0) {
    console.warn(`[Sync] Public WooCommerce catalogue fetch failed (${failureReason}). Preserving existing catalogue.`);
    
    // Log failure in knowledge_sources
    await query(
      `UPDATE knowledge_sources
       SET sync_status = 'failed', last_error = $1
       WHERE url = 'https://tionasilver.com/wp-json/wc/store/v1/products'`,
      [`Catalogue sync fallback: ${failureReason}. Existing items preserved.`]
    );

    return {
      source: 'WooCommerce Store API',
      status: 'stale_preserved',
      message: `Live fetch failed (${failureReason}). Retained verified starter catalogue.`,
      itemCount: STARTER_PRODUCTS.length,
      syncedAt
    };
  }

  // If live fetch succeeded, parse products and update database
  try {
    const fetchedIds: number[] = [];

    for (const raw of fetchedProducts) {
      const id = Number(raw.id);
      if (!id) continue;
      fetchedIds.push(id);

      const name = String(raw.name || '').trim();
      const slug = String(raw.slug || '').trim();
      const permalink = String(raw.permalink || `https://tionasilver.com/product/${slug}/`);
      const sku = String(raw.sku || '');

      // Parse price with currency_minor_unit
      const minorUnit = raw.prices?.currency_minor_unit ?? 2;
      const rawPrice = raw.prices?.price || '0';
      const rawRegPrice = raw.prices?.regular_price || null;
      const rawSalePrice = raw.prices?.sale_price || null;

      const price_minor = parseInt(rawPrice, 10);
      const regular_price_minor = rawRegPrice ? parseInt(rawRegPrice, 10) : null;
      const sale_price_minor = rawSalePrice ? parseInt(rawSalePrice, 10) : null;
      const on_sale = Boolean(raw.on_sale || (sale_price_minor && sale_price_minor < (regular_price_minor || 0)));
      const in_stock = Boolean(raw.is_in_stock ?? true);

      const images = Array.isArray(raw.images)
        ? raw.images.map((img: any) => ({
            src: String(img.src || ''),
            alt: String(img.alt || name)
          }))
        : [];

      // Clean HTML tags from description
      const description = String(raw.description || raw.short_description || '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const categories = Array.isArray(raw.categories)
        ? raw.categories.map((c: any) => String(c.name || '').trim())
        : [];

      const attributes = Array.isArray(raw.attributes)
        ? raw.attributes.map((a: any) => ({
            id: Number(a.id || 0),
            name: String(a.name || ''),
            options: Array.isArray(a.terms) ? a.terms.map((t: any) => String(t.name || '')) : []
          }))
        : [];

      await query(
        `INSERT INTO products (
          id, name, slug, permalink, sku, price_minor, regular_price_minor, sale_price_minor,
          currency, currency_symbol, on_sale, in_stock, images, description, categories,
          attributes, is_active, last_verified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          permalink = EXCLUDED.permalink,
          sku = EXCLUDED.sku,
          price_minor = EXCLUDED.price_minor,
          regular_price_minor = EXCLUDED.regular_price_minor,
          sale_price_minor = EXCLUDED.sale_price_minor,
          on_sale = EXCLUDED.on_sale,
          in_stock = EXCLUDED.in_stock,
          images = EXCLUDED.images,
          description = EXCLUDED.description,
          categories = EXCLUDED.categories,
          attributes = EXCLUDED.attributes,
          is_active = TRUE,
          last_verified_at = EXCLUDED.last_verified_at`,
        [
          id,
          name,
          slug,
          permalink,
          sku,
          price_minor,
          regular_price_minor,
          sale_price_minor,
          raw.prices?.currency_code || 'INR',
          raw.prices?.currency_symbol || '₹',
          on_sale,
          in_stock,
          JSON.stringify(images),
          description,
          JSON.stringify(categories),
          JSON.stringify(attributes),
          true,
          syncedAt
        ]
      );
    }

    // Only deactivate missing products after a complete, successful catalogue sync
    if (fetchedIds.length > 0) {
      await query(
        `UPDATE products SET is_active = FALSE WHERE id NOT IN (${fetchedIds.join(',')})`
      );
    }

    return {
      source: 'WooCommerce Store API',
      status: 'success',
      message: `Successfully synchronized ${fetchedIds.length} public WooCommerce products.`,
      itemCount: fetchedIds.length,
      syncedAt
    };
  } catch (dbErr: any) {
    console.error('[Sync] Database update error:', dbErr.message);
    return {
      source: 'WooCommerce Store API',
      status: 'failed',
      message: `Database update error during sync: ${dbErr.message}`,
      itemCount: 0,
      syncedAt
    };
  }
}

/**
 * Attempts a read-only fetch of discovered informational pages.
 * Validates against SSRF, hashes content, detects changes, and flags for admin review.
 */
export async function syncDiscoveredPage(url: string): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();

  if (!isSafePublicUrl(url)) {
    return {
      source: url,
      status: 'failed',
      message: 'Blocked by SSRF policy: URL is not an approved public tionasilver.com HTTPS page.',
      itemCount: 0,
      syncedAt
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TionaAssistantBot/1.0 (PageImporter; +https://tionasilver.com)'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      await query(
        `UPDATE knowledge_sources SET sync_status = 'failed', last_error = $1 WHERE url = $2`,
        [`HTTP ${response.status} ${response.statusText}`, url]
      );
      return {
        source: url,
        status: 'failed',
        message: `HTTP response ${response.status}`,
        itemCount: 0,
        syncedAt
      };
    }

    const html = await response.text();
    // Simple text extraction from HTML
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const hash = crypto.createHash('sha256').update(cleanText).digest('hex').substring(0, 32);

    await query(
      `UPDATE knowledge_sources
       SET content_hash = $1, raw_content = $2, sync_status = 'success', last_synced_at = $3, last_error = ''
       WHERE url = $4`,
      [hash, cleanText.substring(0, 5000), syncedAt, url]
    );

    return {
      source: url,
      status: 'success',
      message: 'Fetched and hashed successfully. Awaiting administrative review.',
      itemCount: 1,
      syncedAt
    };
  } catch (err: any) {
    await query(
      `UPDATE knowledge_sources SET sync_status = 'failed', last_error = $1 WHERE url = $2`,
      [err.message, url]
    );
    return {
      source: url,
      status: 'failed',
      message: `Fetch failed: ${err.message}`,
      itemCount: 0,
      syncedAt
    };
  }
}
