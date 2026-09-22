/**
 * Verified Tiona Silver Business Facts & Grounded Knowledge
 * Checked against public website content on 21 September 2026.
 */

export interface VerifiedFact {
  category: 'brand' | 'contact' | 'showroom' | 'hours' | 'products' | 'services' | 'shipping' | 'returns' | 'care';
  question: string;
  answer: string;
  source_url: string;
  has_conflict?: boolean;
  conflict_notes?: string;
  team_handoff_recommended?: boolean;
}

export const VERIFIED_BUSINESS_FACTS: VerifiedFact[] = [
  {
    category: 'brand',
    question: 'What is Tiona Silver?',
    answer: 'Tiona Silver is an online jewellery brand dedicated to modern, elegant 92.5 sterling silver jewellery and surgical steel earrings, with the tagline "The Silver That Defines You."',
    source_url: 'https://tionasilver.com/about-us/'
  },
  {
    category: 'contact',
    question: 'How can I contact the Tiona Silver team?',
    answer: 'You can reach Tiona Silver by phone at +91 98115 09777 or on WhatsApp at https://wa.me/919811509777. Our business email is arshitmalik@tionasilver.com. Call and WhatsApp are our preferred contact methods.',
    source_url: 'https://tionasilver.com/contact-us/'
  },
  {
    category: 'hours',
    question: 'What are your contact hours?',
    answer: 'Our published contact hours (Asia/Kolkata time) are Monday: 3:00 PM – 7:00 PM, and Tuesday through Sunday: 12:00 PM – 9:00 PM. Our team aims to respond to enquiries within 24 hours (this is an estimate, not an instant guarantee).',
    source_url: 'https://tionasilver.com/contact-us/'
  },
  {
    category: 'showroom',
    question: 'Do you have a physical store or showroom where I can visit?',
    answer: 'Tiona Silver is strictly an online jewellery brand with no separate physical showroom. Our published contact address (UB-37, Jawahar Nagar, Kamla Nagar, Delhi – 110007, India) is shared with MyPiercingBook and is not a dedicated Tiona retail showroom. We cannot promise walk-in appointments or in-person shopping.',
    source_url: 'https://tionasilver.com/contact-us/'
  },
  {
    category: 'products',
    question: 'What kind of jewellery do you offer?',
    answer: 'Tiona Silver describes 92.5 sterling silver jewellery and surgical steel earrings, mentioning categories such as earrings, studs, rings, chains, bracelets, and pendants. Please note: a general category mention does not guarantee that a matching item is currently listed or in stock in our active catalogue.',
    source_url: 'https://tionasilver.com/batch-2026/'
  },
  {
    category: 'services',
    question: 'Do you offer piercing services and aftercare?',
    answer: 'Our published services mention professional piercing along with complimentary aftercare, which includes Cleansing Spray, an Aftercare Product, and guidance. Because aftercare depends on individual needs, we do not provide medical advice, drug prescriptions, DIY piercing steps, or pricing over chat. Would you like to connect with our team on WhatsApp for professional assistance?',
    source_url: 'https://tionasilver.com/batch-2026/',
    team_handoff_recommended: true
  },
  {
    category: 'shipping',
    question: 'What are your delivery times and order confirmation policies?',
    answer: 'According to our homepage, orders are typically confirmed within 24–48 hours, with an estimated delivery time of 3–4 days after confirmation across India. Please treat these confirmation and delivery windows as published estimates, as courier delays can occur. Note on payment/COD: The homepage advertises Cash on Delivery across India, whereas our Terms page mentions orders being confirmed after successful payment. Our team can clarify current payment and COD availability for your specific PIN code via WhatsApp or an enquiry.',
    source_url: 'https://tionasilver.com/',
    has_conflict: true,
    conflict_notes: 'Homepage advertises COD across India; Terms page states orders are confirmed after successful payment. Team confirmation required.',
    team_handoff_recommended: true
  },
  {
    category: 'shipping',
    question: 'Do you offer gift packing?',
    answer: 'Yes, gift packing is available for ₹99 as published on the website.',
    source_url: 'https://tionasilver.com/'
  },
  {
    category: 'returns',
    question: 'What is your return and exchange policy?',
    answer: 'Our homepage states that returns are available and exchanges are not offered. However, our Terms & Conditions mention that used earrings and piercing jewellery cannot be returned due to hygiene reasons unless damaged, defective, or incorrectly supplied. Furthermore, natural silver tarnish or improper care is not considered a manufacturing defect, and product appearance may vary slightly from photographs. Because the Terms also reference returns/exchanges generally, our team must verify eligibility for your specific item.',
    source_url: 'https://tionasilver.com/terms-and-coditions/',
    has_conflict: true,
    conflict_notes: 'Homepage explicitly states exchanges are not offered; Terms refer generally to returns/exchanges. Used earrings/piercings are non-returnable unless defective. Hand off to team.',
    team_handoff_recommended: true
  },
  {
    category: 'care',
    question: 'How should I care for my 92.5 sterling silver jewellery?',
    answer: 'Normal silver naturally tarnishes when exposed to air and moisture over time; this is expected of authentic 92.5 silver and is not a defect. Store pieces in airtight pouches away from humidity, avoid spraying perfumes or chemicals directly on the jewellery, and gently clean with a soft silver polishing cloth.',
    source_url: 'https://tionasilver.com/terms-and-coditions/'
  }
];

export const UNVERIFIED_DISCOVERY_URLS = [
  {
    url: 'https://tionasilver.com/225-2/',
    title: 'Discovered Page 225-2',
    status: 'pending_review',
    notes: 'Discovered via crawl/sitemap; requires administrative review before use as bot knowledge.'
  },
  {
    url: 'https://tionasilver.com/lp/',
    title: 'Discovered Landing Page (LP)',
    status: 'pending_review',
    notes: 'Discovered landing page; requires administrative verification.'
  },
  {
    url: 'https://tionasilver.com/the-new-silver-standard-tiona-silver/',
    title: 'The New Silver Standard',
    status: 'pending_review',
    notes: 'Editorial or promotional post; unverified.'
  },
  {
    url: 'https://tionasilver.com/the-silver-edit-timeless-pieces-by-tiona-silver/',
    title: 'The Silver Edit: Timeless Pieces',
    status: 'pending_review',
    notes: 'Editorial post; unverified.'
  },
  {
    url: 'https://tionasilver.com/silver-that-speaks-discover-tiona-silver/',
    title: 'Silver That Speaks',
    status: 'pending_review',
    notes: 'Editorial post; unverified.'
  }
];

export const WIDGET_DEFAULT_CONFIG = {
  brand: 'Tiona Silver',
  bot_name: 'Tiona Assistant',
  tagline: 'The Silver That Defines You.',
  website: 'https://tionasilver.com/',
  email: 'arshitmalik@tionasilver.com',
  phone: '+91 98115 09777',
  whatsapp_url: 'https://wa.me/919811509777',
  address: 'UB-37, Jawahar Nagar, Kamla Nagar, Delhi – 110007, India',
  showroom_disclaimer: 'Tiona Silver is an online jewellery brand with no separate physical showroom. The address is shared with MyPiercingBook and cannot accommodate walk-in visits.',
  contact_hours: 'Monday: 3 PM – 7 PM; Tuesday – Sunday: 12 PM – 9 PM (Asia/Kolkata)',
  response_estimate: 'Within 24 hours (estimate, not instant guarantee)',
  quick_actions: [
    'Find jewellery',
    'Ask about a product',
    'Delivery and returns',
    'Send an enquiry',
    'WhatsApp the team'
  ]
};
