/**
 * Tiona Assistant - Modular Node.js / Express Full-Stack Server
 * Binds to 0.0.0.0:3000. Serves public API, protected admin API, and mounts Vite in dev mode.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getDb, query, queryOne } from './server/db.ts';
import { WIDGET_DEFAULT_CONFIG } from './server/data/businessKnowledge.ts';
import { handleUserMessage, searchProducts } from './server/services/conversationalAdapter.ts';
import { submitEnquiry, processOutboxJob } from './server/services/emailService.ts';
import { syncWooCommerceCatalogue, syncDiscoveredPage } from './server/services/importer.ts';
import { Enquiry, OutboxJob, KnowledgeSource } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'tiona-admin-secret-2026';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Lightweight in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.'
      });
    }

    entry.count++;
    next();
  };
}

// Admin Authentication Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customKey = req.headers['x-admin-key'] as string | undefined;

  let providedToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7).trim();
  } else if (customKey) {
    providedToken = customKey.trim();
  }

  if (!providedToken || providedToken !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid administrative credentials.' });
  }

  next();
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Tiona Assistant',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString()
  });
});

// Public Widget Configuration
app.get('/api/config', (req, res) => {
  res.json({
    ...WIDGET_DEFAULT_CONFIG,
    api_endpoint: '/api',
    is_gemini_configured: Boolean(process.env.GEMINI_API_KEY?.trim())
  });
});

// Anonymous session generation
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionId = crypto.randomUUID();
    const ip = req.ip || req.socket.remoteAddress || '';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    await query(
      `INSERT INTO chat_sessions (id, visitor_ip_hash, last_activity_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [sessionId, ipHash]
    );

    res.json({ session_id: sessionId });
  } catch (err: any) {
    console.error('[Session Error]:', err.message);
    res.status(500).json({ error: 'Failed to initialize visitor session.' });
  }
});

// Product search & filter
app.get('/api/products', async (req, res) => {
  try {
    const maxBudget = req.query.max_budget ? parseFloat(req.query.max_budget as string) : undefined;
    const minBudget = req.query.min_budget ? parseFloat(req.query.min_budget as string) : undefined;
    const keyword = req.query.q as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const products = await searchProducts({
      max_budget_inr: maxBudget,
      min_budget_inr: minBudget,
      keyword,
      limit
    });

    res.json(products);
  } catch (err: any) {
    console.error('[Product Search Error]:', err.message);
    res.status(500).json({ error: 'Could not fetch products.' });
  }
});

// Chat message handler
app.post('/api/chat', rateLimiter(30, 60 * 1000), async (req, res) => {
  try {
    const { session_id, message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 1000 characters.' });
    }

    // Save visitor message
    if (session_id) {
      await query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
        [session_id, message.trim()]
      );
    }

    const chatResponse = await handleUserMessage(message, history || []);

    // Save assistant reply
    if (session_id) {
      const recIds = (chatResponse.recommended_products || []).map((p) => p.id);
      await query(
        `INSERT INTO chat_messages (session_id, role, content, recommended_product_ids, source_links)
         VALUES ($1, 'assistant', $2, $3, $4)`,
        [
          session_id,
          chatResponse.reply,
          JSON.stringify(recIds),
          JSON.stringify(chatResponse.source_links || [])
        ]
      );
    }

    res.json(chatResponse);
  } catch (err: any) {
    console.error('[Chat API Error]:', err.message);
    res.status(500).json({
      reply: 'An unexpected error occurred. Please contact Tiona Silver directly on WhatsApp at +91 98115 09777.',
      follow_up: 'Would you like to send an enquiry instead?'
    });
  }
});

// Enquiry submission
app.post('/api/enquiries', rateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const {
      name,
      reply_method,
      reply_value,
      enquiry_type,
      message,
      product_id,
      product_name,
      product_url,
      order_reference,
      consent_given,
      session_id,
      idempotency_key
    } = req.body;

    const result = await submitEnquiry({
      name,
      reply_method,
      reply_value,
      enquiry_type,
      message,
      product_id,
      product_name,
      product_url,
      order_reference,
      consent_given: Boolean(consent_given),
      session_id,
      idempotency_key
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.warn('[Enquiry Validation Error]:', err.message);
    res.status(400).json({ error: err.message || 'Failed to submit enquiry.' });
  }
});

// ==========================================
// PROTECTED ADMIN API ROUTES
// ==========================================

// Get operational overview stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const productCountRes = await queryOne(`SELECT COUNT(*) as count FROM products WHERE is_active = TRUE`);
    const enquiryCountRes = await queryOne(`SELECT COUNT(*) as count FROM enquiries`);
    const newEnquiriesRes = await queryOne(`SELECT COUNT(*) as count FROM enquiries WHERE status = 'new'`);
    const pendingSourcesRes = await queryOne(`SELECT COUNT(*) as count FROM knowledge_sources WHERE approval_status = 'pending_review' OR approval_status = 'conflict'`);
    const outboxFailedRes = await queryOne(`SELECT COUNT(*) as count FROM email_outbox WHERE status = 'failed'`);
    const lastSyncRes = await queryOne(`SELECT last_verified_at FROM products ORDER BY last_verified_at DESC LIMIT 1`);

    res.json({
      active_products: parseInt(productCountRes?.count || '0', 10),
      total_enquiries: parseInt(enquiryCountRes?.count || '0', 10),
      new_enquiries: parseInt(newEnquiriesRes?.count || '0', 10),
      flagged_sources: parseInt(pendingSourcesRes?.count || '0', 10),
      failed_emails: parseInt(outboxFailedRes?.count || '0', 10),
      last_sync: lastSyncRes?.last_verified_at || null,
      fixed_recipient: process.env.LEAD_NOTIFICATION_EMAIL || 'arshitmalik@tionasilver.com',
      is_smtp_configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List enquiries with outbox delivery status
app.get('/api/admin/enquiries', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    let sql = `
      SELECT e.*, o.status as email_status, o.attempts as email_attempts, o.last_error as email_last_error
      FROM enquiries e
      LEFT JOIN email_outbox o ON e.id = o.enquiry_id
    `;
    const params: any[] = [];
    if (status && ['new', 'in_progress', 'resolved'].includes(status)) {
      sql += ` WHERE e.status = $1`;
      params.push(status);
    }
    sql += ` ORDER BY e.created_at DESC LIMIT 100`;

    const enquiries = await query<Enquiry>(sql, params);
    res.json(enquiries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update enquiry status or admin notes
app.patch('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, admin_notes } = req.body;

    if (status && !['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updated = await queryOne(
      `UPDATE enquiries
       SET status = COALESCE($1, status),
           admin_notes = COALESCE($2, admin_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status || null, admin_notes || null, id]
    );

    if (!updated) {
      return res.status(404).json({ error: 'Enquiry not found.' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List email outbox jobs
app.get('/api/admin/outbox', requireAdmin, async (req, res) => {
  try {
    const jobs = await query<OutboxJob>(
      `SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 50`
    );
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retry outbox delivery
app.post('/api/admin/outbox/:id/retry', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query(
      `UPDATE email_outbox SET status = 'queued', attempts = 0, last_error = NULL WHERE id = $1`,
      [id]
    );
    await processOutboxJob(id);
    const updated = await queryOne(`SELECT * FROM email_outbox WHERE id = $1`, [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List knowledge sources & conflicts
app.get('/api/admin/sources', requireAdmin, async (req, res) => {
  try {
    const sources = await query<KnowledgeSource>(
      `SELECT * FROM knowledge_sources ORDER BY id ASC`
    );
    res.json(sources);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual synchronisation
app.post('/api/admin/sync', requireAdmin, async (req, res) => {
  try {
    console.log('[Admin] Manual sync triggered.');
    const catalogueResult = await syncWooCommerceCatalogue();
    res.json({
      catalogue: catalogueResult,
      synced_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE / STATIC SERVING & BOOTSTRAP
// ==========================================

async function start() {
  // Ensure DB and migrations are ready
  try {
    await getDb();
  } catch (dbErr: any) {
    console.error('[Server Startup Warning] Database init error:', dbErr.message);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  Tiona Assistant Server running on http://0.0.0.0:${PORT}`);
    console.log(`  Fixed Notification Recipient: ${process.env.LEAD_NOTIFICATION_EMAIL || 'arshitmalik@tionasilver.com'}`);
    console.log(`  Admin Secret Key: ${ADMIN_API_KEY}`);
    console.log(`====================================================`);
  });
}

start().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
