/**
 * Replaceable Server-Side Conversational AI Adapter.
 * Integrates Gemini API via @google/genai when GEMINI_API_KEY is available,
 * with seamless deterministic fallback to grounded rule-based retrieval when absent or failed.
 * Applies budget/attribute filters strictly in backend code to prevent LLM hallucinations.
 */

import { GoogleGenAI } from '@google/genai';
import { query } from '../db.ts';
import { Product } from '../../src/types.ts';
import { VERIFIED_BUSINESS_FACTS } from '../data/businessKnowledge.ts';

export interface ChatResponse {
  reply: string;
  recommended_products?: Product[];
  source_links?: { title: string; url: string }[];
  follow_up?: string;
  provider_used: 'gemini' | 'grounded_rules';
}

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY?.trim()) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    } catch (err: any) {
      console.warn('[Gemini Adapter] Initialization warning:', err.message);
      geminiClient = null;
    }
  }
  return geminiClient;
}

/**
 * Filter products deterministically in backend code.
 * Strict budget limit, availability check, and category/motif matching.
 */
export async function searchProducts(options: {
  max_budget_inr?: number;
  min_budget_inr?: number;
  keyword?: string;
  limit?: number;
}): Promise<Product[]> {
  const limit = options.limit || 3;
  let sql = 'SELECT * FROM products WHERE is_active = TRUE AND in_stock = TRUE';
  const params: any[] = [];
  let paramIdx = 1;

  if (options.max_budget_inr !== undefined && !isNaN(options.max_budget_inr)) {
    // Convert INR to minor units (paise)
    const maxMinor = Math.round(options.max_budget_inr * 100);
    sql += ` AND price_minor <= $${paramIdx++}`;
    params.push(maxMinor);
  }

  if (options.min_budget_inr !== undefined && !isNaN(options.min_budget_inr)) {
    const minMinor = Math.round(options.min_budget_inr * 100);
    sql += ` AND price_minor >= $${paramIdx++}`;
    params.push(minMinor);
  }

  if (options.keyword && options.keyword.trim().length > 0) {
    const cleanWord = `%${options.keyword.trim().toLowerCase()}%`;
    sql += ` AND (LOWER(name) LIKE $${paramIdx} OR LOWER(description) LIKE $${paramIdx} OR LOWER(design_theme) LIKE $${paramIdx})`;
    params.push(cleanWord);
    paramIdx++;
  }

  sql += ' ORDER BY price_minor ASC LIMIT ' + limit;

  const rows = await query<any>(sql, params);
  return rows.map((r) => ({
    ...r,
    images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
    categories: typeof r.categories === 'string' ? JSON.parse(r.categories) : r.categories,
    attributes: typeof r.attributes === 'string' ? JSON.parse(r.attributes) : r.attributes,
  }));
}

/**
 * Parse budget numbers from user text (e.g. "under 1500", "around 2000", "₹1200 budget", "less than 1800").
 */
function extractBudgetFromText(text: string): number | null {
  const lower = text.toLowerCase();
  const match = lower.match(/(?:under|below|less than|within|max|budget(?: of)?|around|upto|up to|₹|rs\.?)\s*(\d{3,5})/i);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (val >= 500 && val <= 50000) {
      return val;
    }
  }
  return null;
}

/**
 * Main chat handler.
 * Tries Gemini first if configured, falls back to grounded rule engine.
 */
export async function handleUserMessage(message: string, history: Array<{ role: string; content: string }> = []): Promise<ChatResponse> {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Health / medical / piercing safety guardrail (strictly disallow DIY or medical advice)
  if (
    lower.includes('infection') ||
    lower.includes('pus') ||
    lower.includes('swelling') ||
    lower.includes('medicine') ||
    lower.includes('ointment') ||
    lower.includes('antibiotic') ||
    lower.includes('how to pierce') ||
    lower.includes('diy pierce')
  ) {
    return {
      reply:
        'I am not able to give medical advice, diagnostic opinions, or DIY piercing instructions. If you are experiencing pain, irritation, or an infection, please consult a certified healthcare professional or qualified medical doctor immediately. For complimentary aftercare product guidance (such as our Cleansing Spray) provided with our piercing service, you can reach our team directly on WhatsApp.',
      source_links: [{ title: 'Materials & Piercing Information', url: 'https://tionasilver.com/batch-2026/' }],
      follow_up: 'Would you like the WhatsApp link to chat with our team?',
      provider_used: 'grounded_rules',
    };
  }

  // 2. Extract budget and check for product discovery queries
  const extractedBudget = extractBudgetFromText(lower);
  const isProductSearch =
    extractedBudget !== null ||
    lower.includes('ring') ||
    lower.includes('earring') ||
    lower.includes('evil eye') ||
    lower.includes('swastik') ||
    lower.includes('zircon') ||
    lower.includes('lotus') ||
    lower.includes('helix') ||
    lower.includes('hoop') ||
    lower.includes('jewellery') ||
    lower.includes('collection') ||
    lower.includes('catalogue') ||
    lower.includes('find') ||
    lower.includes('price') ||
    lower.includes('cost');

  // If user is searching products, run backend deterministic filter
  let matchingProducts: Product[] = [];
  if (isProductSearch) {
    let keyword = '';
    if (lower.includes('evil eye')) keyword = 'evil eye';
    else if (lower.includes('swastik')) keyword = 'swastik';
    else if (lower.includes('lotus')) keyword = 'lotus';
    else if (lower.includes('hoop')) keyword = 'hoop';
    else if (lower.includes('helix')) keyword = 'helix';
    else if (lower.includes('zircon')) keyword = 'zircon';
    else if (lower.includes('green') || lower.includes('emerald')) keyword = 'green';
    else if (lower.includes('ruby')) keyword = 'ruby';

    matchingProducts = await searchProducts({
      max_budget_inr: extractedBudget || undefined,
      keyword: keyword || undefined,
      limit: 3,
    });
  }

  // 3. Try Gemini AI Adapter if client is available
  const ai = getGeminiClient();
  if (ai) {
    try {
      const systemInstruction = `
You are "Tiona Assistant", the official customer support and product enquiry chatbot for Tiona Silver (https://tionasilver.com/).
Tagline: "The Silver That Defines You."
Business Email: arshitmalik@tionasilver.com | Phone: +91 98115 09777 | WhatsApp: https://wa.me/919811509777

CRITICAL GROUNDING RULES:
1. Grounding: Only use facts verified from tionasilver.com.
   - Address: UB-37, Jawahar Nagar, Kamla Nagar, Delhi – 110007. Shared with MyPiercingBook.
   - SHOWROOM: Tiona Silver is an online jewellery brand with NO separate physical showroom. Do not promise walk-in appointments.
   - CONTACT HOURS: Monday 3 PM–7 PM; Tuesday–Sunday 12 PM–9 PM (Asia/Kolkata). Response time estimate: within 24 hours.
   - MATERIALS: 92.5 sterling silver and surgical steel. A category mention does NOT prove it is in stock.
   - PIERCING: Professional piercing with complimentary aftercare (Cleansing Spray, Aftercare Product and guidance). Never invent pricing, appointments, or medical instructions.
   - POLICY CONFLICTS:
     * Homepage states Cash on Delivery (COD) across India; Terms page states orders are confirmed after successful payment.
     * Homepage states returns available, exchanges not offered; Terms reference returns/exchanges generally. Used earrings/piercings are non-returnable unless defective.
     * For policy questions, mention that the team must confirm the applicable terms for their order and offer WhatsApp (+91 98115 09777) or an enquiry.
   - GIFT PACKING: Available for ₹99.
2. Tone & Languages: Short, friendly, helpful in English, Hindi, or Hinglish matching the visitor.
3. Follow-up: Ask at most ONE polite follow-up question.
4. Unknown Information: If not confirmed on tionasilver.com, say:
   "I couldn’t confirm that from Tiona Silver’s website. Would you like to ask the team on WhatsApp or send an enquiry?"
5. Unrelated queries: Politely redirect to Tiona Silver products and services.
6. Product links: Product cards are provided separately by the system. Do NOT fabricate product URLs, prices, or specs.
`;

      const contents = [
        ...history.slice(-4).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
        {
          role: 'user',
          parts: [
            {
              text: `Visitor message: "${trimmed}"\nBackend found ${matchingProducts.length} matching products: ${matchingProducts.map((p) => `${p.name} (₹${(p.price_minor / 100).toLocaleString('en-IN')})`).join(', ')}.`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      });

      const replyText = response.text || '';
      if (replyText.trim().length > 0) {
        return {
          reply: replyText.trim(),
          recommended_products: matchingProducts.length > 0 ? matchingProducts : undefined,
          source_links: getRelevantSourceLinks(lower),
          provider_used: 'gemini',
        };
      }
    } catch (err: any) {
      console.warn('[ConversationalAdapter] Gemini generation failed, falling back to grounded rule engine:', err.message);
    }
  }

  // 4. Grounded Rule Engine Fallback (Deterministic, safe, 100% website-grounded)
  return generateGroundedRuleReply(trimmed, lower, matchingProducts, extractedBudget);
}

function getRelevantSourceLinks(lower: string): { title: string; url: string }[] {
  const links: { title: string; url: string }[] = [];
  if (lower.includes('return') || lower.includes('exchange') || lower.includes('terms')) {
    links.push({ title: 'Terms & Conditions', url: 'https://tionasilver.com/terms-and-coditions/' });
  }
  if (lower.includes('deliver') || lower.includes('shipping') || lower.includes('cod') || lower.includes('cash on delivery')) {
    links.push({ title: 'Tiona Silver Policies', url: 'https://tionasilver.com/' });
  }
  if (lower.includes('contact') || lower.includes('store') || lower.includes('showroom') || lower.includes('address') || lower.includes('visit') || lower.includes('phone') || lower.includes('hours')) {
    links.push({ title: 'Contact Us', url: 'https://tionasilver.com/contact-us/' });
  }
  if (lower.includes('piercing') || lower.includes('material') || lower.includes('silver') || lower.includes('steel')) {
    links.push({ title: 'Materials & Piercing', url: 'https://tionasilver.com/batch-2026/' });
  }
  return links;
}

function generateGroundedRuleReply(
  original: string,
  lower: string,
  products: Product[],
  budget: number | null
): ChatResponse {
  // Greetings
  if (lower.match(/^(hi|hello|hey|namaste|good morning|good evening|good afternoon)/i)) {
    return {
      reply:
        'Hi! I’m Tiona Assistant. I can help you explore our jewellery, check website information, or send an enquiry to our team. What are you looking for?',
      follow_up: 'Are you interested in earrings, piercing jewellery, or checking our delivery policies?',
      provider_used: 'grounded_rules',
    };
  }

  // Showroom / Store visit / Address
  if (lower.includes('store') || lower.includes('showroom') || lower.includes('visit') || lower.includes('shop address') || lower.includes('location')) {
    return {
      reply:
        'Tiona Silver is strictly an online jewellery brand with no separate physical showroom. Our published address (UB-37, Jawahar Nagar, Kamla Nagar, Delhi – 110007) is shared with MyPiercingBook and cannot accommodate walk-in visits or shopping.',
      source_links: [{ title: 'Contact Information', url: 'https://tionasilver.com/contact-us/' }],
      follow_up: 'Would you like to explore our jewellery online, or connect with our team on WhatsApp?',
      provider_used: 'grounded_rules',
    };
  }

  // Contact info / hours / phone / whatsapp
  if (lower.includes('contact') || lower.includes('phone') || lower.includes('whatsapp') || lower.includes('hours') || lower.includes('call') || lower.includes('number')) {
    return {
      reply:
        'You can reach our team by phone at +91 98115 09777 or on WhatsApp at https://wa.me/919811509777. Our published contact hours are Monday, 3 PM–7 PM, and Tuesday–Sunday, 12 PM–9 PM (Asia/Kolkata). Our team aims to respond within 24 hours (estimated response time).',
      source_links: [{ title: 'Contact Us', url: 'https://tionasilver.com/contact-us/' }],
      follow_up: 'Would you like to send an enquiry directly from here?',
      provider_used: 'grounded_rules',
    };
  }

  // Shipping, COD, Payment, Delivery
  if (lower.includes('cod') || lower.includes('cash on delivery') || lower.includes('shipping') || lower.includes('delivery') || lower.includes('payment')) {
    return {
      reply:
        'Our homepage advertises Cash on Delivery across India with order confirmation in 24–48 hours and estimated delivery in 3–4 days. However, our Terms page states that orders are confirmed after successful payment. Because courier services and payment options can vary by location, our team can verify the applicable terms for your PIN code.',
      source_links: [
        { title: 'Tiona Silver Homepage', url: 'https://tionasilver.com/' },
        { title: 'Terms & Conditions', url: 'https://tionasilver.com/terms-and-coditions/' }
      ],
      follow_up: 'Would you like to ask the team on WhatsApp or send an enquiry with your PIN code?',
      provider_used: 'grounded_rules',
    };
  }

  // Returns / Exchange
  if (lower.includes('return') || lower.includes('exchange') || lower.includes('refund')) {
    return {
      reply:
        'Our homepage states that returns are available and exchanges are not offered. Our Terms & Conditions additionally state that used earrings and piercing jewellery cannot be returned due to hygiene reasons unless damaged, defective, or incorrectly supplied. Natural silver tarnish is normal and not a manufacturing defect. Our team must confirm eligibility for your specific item.',
      source_links: [{ title: 'Terms & Conditions', url: 'https://tionasilver.com/terms-and-coditions/' }],
      follow_up: 'Would you like to submit an order support enquiry so our team can review your request?',
      provider_used: 'grounded_rules',
    };
  }

  // Piercing & Aftercare
  if (lower.includes('piercing') || lower.includes('aftercare') || lower.includes('spray')) {
    return {
      reply:
        'Tiona Silver offers professional piercing with complimentary aftercare, which includes Cleansing Spray, an Aftercare Product, and guidance. We do not provide medical diagnosis, medicine names, or DIY piercing instructions over chat.',
      source_links: [{ title: 'Materials & Piercing', url: 'https://tionasilver.com/batch-2026/' }],
      follow_up: 'Would you like to send a piercing enquiry to our team?',
      provider_used: 'grounded_rules',
    };
  }

  // Gift Packing
  if (lower.includes('gift') || lower.includes('packing') || lower.includes('box')) {
    return {
      reply: 'Yes! Gift packing is available for ₹99 as published on our website.',
      source_links: [{ title: 'Tiona Silver Homepage', url: 'https://tionasilver.com/' }],
      follow_up: 'Would you like help finding a piece of jewellery to gift?',
      provider_used: 'grounded_rules',
    };
  }

  // Product discovery recommendations
  if (products.length > 0) {
    const budgetNote = budget ? ` within your budget of ₹${budget.toLocaleString('en-IN')}` : '';
    return {
      reply: `Here are matching pieces from our verified catalogue${budgetNote}:`,
      recommended_products: products,
      follow_up: 'Would you like to enquire about any of these pieces or refine your budget?',
      provider_used: 'grounded_rules',
    };
  }

  // Fallback for missing/unverified info
  return {
    reply:
      'I couldn’t confirm that from Tiona Silver’s website. Would you like to ask the team on WhatsApp or send an enquiry?',
    follow_up: 'You can reach the team directly at +91 98115 09777 or on WhatsApp.',
    source_links: [{ title: 'Contact Us', url: 'https://tionasilver.com/contact-us/' }],
    provider_used: 'grounded_rules',
  };
}
