/**
 * Verified starter WooCommerce catalogue from tionasilver.com (Checked 21 September 2026).
 * Prices are stored in integer minor units (paise: e.g. ₹1,185 = 118500).
 * Never invent weight, measurements, pair-vs-single counts, natural gemstones, or allergy guarantees.
 */

import { Product } from '../../src/types.ts';

export const STARTER_PRODUCTS: Product[] = [
  {
    id: 803,
    name: 'Mini Circle Cubic Zirconia Helix Hanging Earring',
    slug: 'mini-circle-cubic-zirconia-helix-hanging-earring',
    permalink: 'https://tionasilver.com/product/mini-circle-cubic-zirconia-helix-hanging-earring/',
    sku: 'TS-EAR-803',
    price_minor: 118500,
    regular_price_minor: 118500,
    sale_price_minor: null,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: false,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/09/mini-circle-helix.jpg',
        alt: 'Mini Circle Cubic Zirconia Helix Hanging Earring in 925 silver'
      }
    ],
    description: 'Crafted in 925 sterling silver featuring a minimalist circle design set with cubic zirconia stones. Suitable for helix or cartilage piercing styling.',
    categories: ['Earrings', 'Helix Hanging', '925 Silver'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Sterling Silver'] },
      { id: 2, name: 'Design', options: ['Minimalist Circle'] }
    ],
    design_theme: 'Minimalist Circle',
    metal_specified: '925 sterling silver',
    stones_specified: 'Cubic zirconia stones',
    conflict_notes: 'None. Clean single price listing.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 800,
    name: 'Zerconia Hoop Earring',
    slug: 'zerconia-hoop-earring',
    permalink: 'https://tionasilver.com/product/zerconia-hoop-earring/',
    sku: 'TS-EAR-800',
    price_minor: 218500,
    regular_price_minor: 238500,
    sale_price_minor: 218500,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: true,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/09/zerconia-hoop.jpg',
        alt: 'Zerconia Hoop Earring double hoops'
      }
    ],
    description: 'Double hoop earrings crafted in 925 silver embellished with zirconia stones. (Note: Plating wording on website is unspecified; precise plating specification is unconfirmed).',
    categories: ['Earrings', 'Hoops', '925 Silver'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Stone', options: ['Zirconia'] },
      { id: 3, name: 'Design', options: ['Double Hoop'] }
    ],
    design_theme: 'Double Hoop',
    metal_specified: '925 silver',
    stones_specified: 'Zirconia stones',
    conflict_notes: 'Plating specification unconfirmed in source wording. Do not promise specific plating type.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 793,
    name: 'Geometric cubic zerconia',
    slug: 'geometric-cubic-zerconia',
    permalink: 'https://tionasilver.com/product/geometric-cubic-zerconia/',
    sku: 'TS-EAR-793',
    price_minor: 198500,
    regular_price_minor: 228500,
    sale_price_minor: 198500,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: true,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/09/geometric-cz.jpg',
        alt: 'Geometric cubic zirconia earring pair with emerald-green hue'
      }
    ],
    description: 'Geometric earrings crafted in 925 silver with micron gold plating and emerald-green cubic zirconia stones. (Emerald-green indicates colour tone; not a natural emerald gemstone).',
    categories: ['Earrings', 'Geometric', 'Gold Plated'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Plating', options: ['Micron Gold Plating'] },
      { id: 3, name: 'Stone Colour', options: ['Emerald Green Hue'] }
    ],
    design_theme: 'Geometric',
    metal_specified: '925 silver with micron gold plating',
    stones_specified: 'Cubic zirconia (emerald-green hue, not natural emerald)',
    conflict_notes: 'Colour is emerald-green tone only; must not be represented as natural emerald gemstone.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 788,
    name: 'Green zircon scallop pendant earring',
    slug: 'green-zircon-scallop-pendant-earring-pair',
    permalink: 'https://tionasilver.com/product/green-zircon-scallop-pendant-earring-pair/',
    sku: 'TS-EAR-788',
    price_minor: 198500,
    regular_price_minor: 218500,
    sale_price_minor: 198500,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: true,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/09/green-zircon-scallop.jpg',
        alt: 'Green zircon scallop pendant earring pair'
      }
    ],
    description: 'Scallop design pendant earrings crafted in 925 silver with micron gold plating and accented with green zircon stones.',
    categories: ['Earrings', 'Pendant Earring', 'Scallop Design'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Plating', options: ['Micron Gold Plating'] },
      { id: 3, name: 'Stone', options: ['Green Zircon'] }
    ],
    design_theme: 'Scallop Pendant',
    metal_specified: '925 silver with micron gold plating',
    stones_specified: 'Green zircon stone',
    conflict_notes: 'None.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 782,
    name: 'Ruby look-alike evil eye hanging',
    slug: 'ruby-look-alike-evil-eye-hanging',
    permalink: 'https://tionasilver.com/product/ruby-look-alike-evil-eye-hanging/',
    sku: 'TS-EAR-782',
    price_minor: 128500,
    regular_price_minor: 178500,
    sale_price_minor: 128500,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: true,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/09/ruby-evil-eye.jpg',
        alt: 'Ruby look-alike evil eye hanging in 925 sterling silver'
      }
    ],
    description: 'Evil-eye motif hanging crafted in 925 sterling silver featuring ruby-hued stones. (The ruby look is a colour aesthetic; does not contain a natural ruby).',
    categories: ['Earrings', 'Evil Eye', '925 Silver'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Sterling Silver'] },
      { id: 2, name: 'Theme', options: ['Evil Eye'] },
      { id: 3, name: 'Stone Colour', options: ['Ruby Look-Alike'] }
    ],
    design_theme: 'Evil Eye',
    metal_specified: '925 sterling silver',
    stones_specified: 'Ruby-hued synthetic stones (not natural ruby)',
    conflict_notes: 'Explicit ruby look-alike; do not claim it contains a natural ruby.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 246,
    name: 'New Zirconia Curve Leaf Charm Helix Hanging',
    slug: 'new-zirconia-curve-leaf-charm-helix-hanging',
    permalink: 'https://tionasilver.com/product/new-zirconia-curve-leaf-charm-helix-hanging/',
    sku: 'TS-EAR-246',
    price_minor: 148500,
    regular_price_minor: 148500,
    sale_price_minor: null,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: false,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/07/curve-leaf-charm.jpg',
        alt: 'New Zirconia Curve Leaf Charm Helix Hanging'
      }
    ],
    description: 'Delicate curved leaf charm hanging crafted in 925 silver with a rhodium finish and shimmering zirconia stones for helix piercing.',
    categories: ['Earrings', 'Helix Hanging', 'Leaf Motif'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Finish', options: ['Rhodium Finish'] },
      { id: 3, name: 'Design', options: ['Curve Leaf Charm'] }
    ],
    design_theme: 'Curved Leaf Charm',
    metal_specified: '925 silver with rhodium finish',
    stones_specified: 'Zirconia stones',
    conflict_notes: 'None.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 242,
    name: 'MINI EVIL EYE HANGING',
    slug: 'mini-evil-eye-hanging',
    permalink: 'https://tionasilver.com/product/mini-evil-eye-hanging/',
    sku: 'TS-EAR-242',
    price_minor: 158500,
    regular_price_minor: 158500,
    sale_price_minor: null,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: false,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/07/mini-evil-eye.jpg',
        alt: 'MINI EVIL EYE HANGING earring'
      }
    ],
    description: 'Small evil-eye motif hanging crafted in 925 silver with rhodium finish, ideal for cartilage or earlobe styling.',
    categories: ['Earrings', 'Evil Eye', 'Hanging'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Finish', options: ['Rhodium Finish'] },
      { id: 3, name: 'Design', options: ['Mini Evil Eye'] }
    ],
    design_theme: 'Evil Eye',
    metal_specified: '925 silver with rhodium finish',
    stones_specified: 'Zirconia stones',
    conflict_notes: 'Symbolism is aesthetic design theme; do not promise metaphysical protective effects.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 239,
    name: 'Silver lotus Zirconia Helix Hanging Earring',
    slug: 'lotus-hanging',
    permalink: 'https://tionasilver.com/product/lotus-hanging/',
    sku: 'TS-EAR-239',
    price_minor: 138500,
    regular_price_minor: 138500,
    sale_price_minor: null,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: false,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/07/lotus-hanging.jpg',
        alt: 'Silver lotus Zirconia Helix Hanging Earring'
      }
    ],
    description: 'Elegant lotus blossom design hanging earring crafted in 925 sterling silver with rhodium finish and sparkling zirconia accents.',
    categories: ['Earrings', 'Helix Hanging', 'Floral Motif'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Sterling Silver'] },
      { id: 2, name: 'Finish', options: ['Rhodium Finish'] },
      { id: 3, name: 'Design', options: ['Lotus Flower'] }
    ],
    design_theme: 'Lotus Blossom',
    metal_specified: '925 sterling silver with rhodium finish',
    stones_specified: 'Zirconia accents',
    conflict_notes: 'None.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 233,
    name: 'GOLDEN SWASTIK HANGING',
    slug: 'golden-swastik-hanging',
    permalink: 'https://tionasilver.com/product/golden-swastik-hanging/',
    sku: 'TS-EAR-233',
    price_minor: 188500,
    regular_price_minor: 188500,
    sale_price_minor: null,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: false,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/07/golden-swastik.jpg',
        alt: 'GOLDEN SWASTIK HANGING earring'
      }
    ],
    description: 'Traditional swastik design hanging earring crafted in 925 silver. (Note: Attribute data on website contains ambiguous price-like values; do not infer a cheaper variant or unverified finish).',
    categories: ['Earrings', 'Traditional Motif', '925 Silver'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Design', options: ['Traditional Swastik'] }
    ],
    design_theme: 'Traditional Swastik',
    metal_specified: '925 silver',
    stones_specified: 'None specified',
    conflict_notes: 'Imported attribute values contain ambiguous price-like tokens; preserve ₹1,885 listing price and do not infer alternative prices.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  },
  {
    id: 230,
    name: 'Turkish Evil Eye Hanging',
    slug: 'turkish-evil-eye-hanging',
    permalink: 'https://tionasilver.com/product/turkish-evil-eye-hanging/',
    sku: 'TS-EAR-230',
    price_minor: 238500,
    regular_price_minor: 238500,
    sale_price_minor: null,
    currency: 'INR',
    currency_symbol: '₹',
    on_sale: false,
    in_stock: true,
    images: [
      {
        src: 'https://tionasilver.com/wp-content/uploads/2024/07/turkish-evil-eye.jpg',
        alt: 'Turkish Evil Eye Hanging in 925 silver rhodium finish'
      }
    ],
    description: 'Turkish evil-eye design hanging earring in 925 silver with rhodium finish. Eye symbolism is celebrated as a cultural aesthetic design theme, not guaranteed metaphysical protection.',
    categories: ['Earrings', 'Evil Eye', 'Hanging'],
    attributes: [
      { id: 1, name: 'Metal', options: ['925 Silver'] },
      { id: 2, name: 'Finish', options: ['Rhodium Finish'] },
      { id: 3, name: 'Design', options: ['Turkish Evil Eye'] }
    ],
    design_theme: 'Turkish Evil Eye',
    metal_specified: '925 silver with rhodium finish',
    stones_specified: 'Enamel / zirconia accents',
    conflict_notes: 'Symbolism is purely an aesthetic design theme, not a guaranteed protective effect.',
    is_active: true,
    last_verified_at: '2026-09-21T00:00:00Z'
  }
];
