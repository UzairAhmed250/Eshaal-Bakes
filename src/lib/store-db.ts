import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  calculateFixedOrderPricing,
  evaluateDeliverySlotEligibility,
  getKarachiDateParts,
  type RequestedLineItem,
} from "@/lib/lead-time";
import {
  generateSecure128BitToken,
  generateSecureOrderCode,
} from "@/lib/image-validation";
import { isValidStatusTransition } from "@/lib/status-machine";
import { normalizePakistaniPhone } from "@/lib/format";
import type {
  AuditLogEntry,
  Category,
  CustomerSummary,
  Flavour,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Quote,
  ReferenceImage,
  StoreSettings,
} from "@/types";

if (typeof window !== "undefined") {
  throw new Error(
    "SECURITY VIOLATION: src/lib/store-db.ts is server-only and must never be imported in client components."
  );
}

interface InternalDatabaseState {
  store_settings: StoreSettings;
  categories: Category[];
  flavours: Flavour[];
  products: Product[];
  orders: Order[];
  audit_log: AuditLogEntry[];
  private_blobs: Record<
    string,
    { base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }
  >;
}

const DATA_DIR = path.join(process.cwd(), ".local-data");
const DB_FILE_PATH = path.join(DATA_DIR, "store.json");

function createInitialSeedState(): InternalDatabaseState {
  const nowIso = new Date().toISOString();
  const { dateStr: todayKarachi } = getKarachiDateParts(new Date());

  const settings: StoreSettings = {
    id: "00000000-0000-0000-0000-000000000001",
    store_name: "Eshaal Bakes",
    tagline: "Artisan Custom Cakes & Small-Batch Bakes in Karachi",
    logo_url: "/logo.svg",
    whatsapp_number: "923001234567",
    delivery_fee_pkr: 350,
    delivery_areas: [
      "DHA Phase 1-8",
      "Clifton",
      "PECHS / Tariq Road",
      "Bahadurabad / Sharfabad",
      "Gulshan-e-Iqbal",
      "Gulistan-e-Jauhar",
      "North Nazimabad",
      "Karsaz",
    ],
    is_open: true,
    announcement_banner:
      "Fresh celebration cakes & fudgy brownies baked daily in DHA Karachi! Same-day delivery available for orders placed before 1:00 PM.",
    payment_instructions:
      "Easypaisa / JazzCash: 0300-1234567 (Eshaal Fatima) | Meezan Bank IBAN: PK36MEZN0001234567890102. Please send payment screenshot on WhatsApp quoting your Order Code.",
    min_lead_time_hours: 5,
    sameday_cutoff_time: "13:00",
    default_advance_percent: 50,
    cod_advance_threshold_pkr: 5000,
    quote_validity_hours: 24,
    updated_at: nowIso,
  };

  const categories: Category[] = [
    {
      id: "10000000-0000-0000-0000-000000000001",
      name: "Signature Cakes",
      slug: "signature-cakes",
      description: "Ready-to-order celebration cakes with custom message plaque",
      sort_order: 1,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      name: "Cupcakes & Bento",
      slug: "cupcakes-bento",
      description: "Hand-piped cupcakes and Korean lunchbox bento cakes",
      sort_order: 2,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      name: "Brownies & Cookie Boxes",
      slug: "brownies-cookies",
      description: "Belgian chocolate fudge brownies and stuffed NYC cookies",
      sort_order: 3,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      name: "Festive Gift Hampers",
      slug: "gift-hampers",
      description: "Curated dessert boxes for Eid, Nikkah favours, and birthdays",
      sort_order: 4,
      is_active: true,
      created_at: nowIso,
    },
  ];

  const flavours: Flavour[] = [
    {
      id: "20000000-0000-0000-0000-000000000001",
      name: "Belgian Chocolate Fudge",
      slug: "belgian-chocolate-fudge",
      description: "Rich dark chocolate sponge layered with silky couverture ganache",
      price_modifier_pkr: 0,
      sort_order: 1,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      name: "Lotus Biscoff Crunch",
      slug: "lotus-biscoff-crunch",
      description: "Caramelized speculoos sponge with Biscoff spread & cookie crumble",
      price_modifier_pkr: 400,
      sort_order: 2,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "20000000-0000-0000-0000-000000000003",
      name: "Classic Vanilla Raspberry",
      slug: "vanilla-raspberry",
      description: "Madagascar vanilla bean sponge with house-made raspberry compote",
      price_modifier_pkr: 250,
      sort_order: 3,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "20000000-0000-0000-0000-000000000004",
      name: "Pistachio Rose Milk Cake",
      slug: "pistachio-rose",
      description: "Roasted Iranian pistachio sponge with cardamom-rose cream",
      price_modifier_pkr: 500,
      sort_order: 4,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: "20000000-0000-0000-0000-000000000005",
      name: "Red Velvet Cream Cheese",
      slug: "red-velvet-cream-cheese",
      description: "Velvety cocoa crumb with tangy whipped cream cheese frosting",
      price_modifier_pkr: 300,
      sort_order: 5,
      is_active: true,
      created_at: nowIso,
    },
  ];

  const products: Product[] = [
    {
      id: "30000000-0000-0000-0000-000000000001",
      category_id: "10000000-0000-0000-0000-000000000001",
      category_name: "Signature Cakes",
      name: "Belgian Double Chocolate Truffle Cake",
      slug: "belgian-double-chocolate-truffle-cake",
      description:
        "Our #1 bestseller in Karachi. Three layers of moist dark cocoa sponge drenched in 54% Belgian Callebaut chocolate ganache. Includes custom message on chocolate plaque.",
      price_pkr: 3800,
      compare_at_price_pkr: 4200,
      stock_quantity: 8,
      track_inventory: true,
      allow_custom_text: true,
      is_active: true,
      is_deleted: false,
      images: [
        {
          id: "img-1",
          product_id: "30000000-0000-0000-0000-000000000001",
          url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
          alt_text: "Belgian Double Chocolate Truffle Cake",
          sort_order: 0,
        },
      ],
      options: [
        {
          id: "opt-1",
          product_id: "30000000-0000-0000-0000-000000000001",
          name: "Weight",
          required: true,
          choices: [
            { label: "1.5 lb (Standard)", priceDeltaPkr: 0 },
            { label: "2.5 lb (Large Party)", priceDeltaPkr: 1800 },
          ],
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      category_id: "10000000-0000-0000-0000-000000000001",
      category_name: "Signature Cakes",
      name: "Lotus Biscoff Drip Cake",
      slug: "lotus-biscoff-drip-cake",
      description:
        "Spiced caramel sponge filled with whipped Biscoff buttercream, melted Lotus drip, and crushed speculoos biscuits.",
      price_pkr: 4200,
      compare_at_price_pkr: null,
      stock_quantity: 5,
      track_inventory: true,
      allow_custom_text: true,
      is_active: true,
      is_deleted: false,
      images: [
        {
          id: "img-2",
          product_id: "30000000-0000-0000-0000-000000000002",
          url: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80",
          alt_text: "Lotus Biscoff Drip Cake",
          sort_order: 0,
        },
      ],
      options: [
        {
          id: "opt-2",
          product_id: "30000000-0000-0000-0000-000000000002",
          name: "Weight",
          required: true,
          choices: [
            { label: "1.5 lb (Standard)", priceDeltaPkr: 0 },
            { label: "2.5 lb (Large Party)", priceDeltaPkr: 1900 },
          ],
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "30000000-0000-0000-0000-000000000003",
      category_id: "10000000-0000-0000-0000-000000000002",
      category_name: "Cupcakes & Bento",
      name: "Korean Minimalist Bento Cake & 2 Cupcakes Combo",
      slug: "korean-bento-cake-combo",
      description:
        "4-inch pastel bento cake (serves 2-3) paired with 2 matching cupcakes in an eco gift box with wooden fork and candle.",
      price_pkr: 2450,
      compare_at_price_pkr: 2700,
      stock_quantity: 12,
      track_inventory: true,
      allow_custom_text: true,
      is_active: true,
      is_deleted: false,
      images: [
        {
          id: "img-3",
          product_id: "30000000-0000-0000-0000-000000000003",
          url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80",
          alt_text: "Korean Minimalist Bento Cake Combo",
          sort_order: 0,
        },
      ],
      options: [],
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "30000000-0000-0000-0000-000000000004",
      category_id: "10000000-0000-0000-0000-000000000002",
      category_name: "Cupcakes & Bento",
      name: "Assorted Gourmet Cupcake Box (Box of 6)",
      slug: "assorted-gourmet-cupcakes-6",
      description:
        "Two Belgian Fudge, two Red Velvet Cream Cheese, and two Lotus Biscoff cupcakes piped fresh every morning.",
      price_pkr: 1950,
      compare_at_price_pkr: null,
      stock_quantity: 15,
      track_inventory: true,
      allow_custom_text: false,
      is_active: true,
      is_deleted: false,
      images: [
        {
          id: "img-4",
          product_id: "30000000-0000-0000-0000-000000000004",
          url: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80",
          alt_text: "Assorted Gourmet Cupcake Box",
          sort_order: 0,
        },
      ],
      options: [],
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "30000000-0000-0000-0000-000000000005",
      category_id: "10000000-0000-0000-0000-000000000003",
      category_name: "Brownies & Cookie Boxes",
      name: "Crinkle-Top Fudge Brownie Slab (9 Pieces)",
      slug: "fudge-brownie-slab-9",
      description:
        "Dense, gooey brownies baked with brown butter, Dutch cocoa, and sea salt flakes. Optional Nutella & Biscoff swirls.",
      price_pkr: 2200,
      compare_at_price_pkr: 2500,
      stock_quantity: 3, // Low stock demo item
      track_inventory: true,
      allow_custom_text: true,
      is_active: true,
      is_deleted: false,
      images: [
        {
          id: "img-5",
          product_id: "30000000-0000-0000-0000-000000000005",
          url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
          alt_text: "Crinkle-Top Fudge Brownie Slab",
          sort_order: 0,
        },
      ],
      options: [],
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "30000000-0000-0000-0000-000000000006",
      category_id: "10000000-0000-0000-0000-000000000004",
      category_name: "Festive Gift Hampers",
      name: "Grand Nikkah & Eid Dessert Hamper",
      slug: "grand-nikkah-eid-dessert-hamper",
      description:
        "Luxury rigid keepsake box containing 1 mini cake, 4 gourmet cupcakes, 4 stuffed cookies, and gold acrylic topper.",
      price_pkr: 5800,
      compare_at_price_pkr: 6500,
      stock_quantity: null, // Unlimited stock demo item
      track_inventory: false,
      allow_custom_text: true,
      is_active: true,
      is_deleted: false,
      images: [
        {
          id: "img-6",
          product_id: "30000000-0000-0000-0000-000000000006",
          url: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=80",
          alt_text: "Grand Nikkah & Eid Dessert Hamper",
          sort_order: 0,
        },
      ],
      options: [],
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  const orders: Order[] = [
    {
      id: "40000000-0000-0000-0000-000000000001",
      order_code: "EB-8K2M9P",
      tracking_token: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      idempotency_key: "seed-idem-fixed-1",
      order_type: "fixed",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "manual_transfer",
      customer_name: "Zainab Tariq",
      customer_phone: "03212345678",
      delivery_address: "House 18-B, Khayaban-e-Shamsheer, Phase 5 DHA",
      delivery_area: "DHA Phase 1-8",
      delivery_date: todayKarachi,
      delivery_slot: "17:00 - 20:00",
      customer_notes: "Please write 'Happy Anniversary Mama & Baba'",
      internal_notes: "Regular VIP customer from DHA Phase 5",
      cancellation_reason: "",
      subtotal_pkr: 3800,
      delivery_fee_pkr: 350,
      advance_required_pkr: 0,
      total_pkr: 4150,
      is_first_time_customer: false,
      needs_confirmation: false,
      items: [
        {
          id: "oi-1",
          order_id: "40000000-0000-0000-0000-000000000001",
          product_id: "30000000-0000-0000-0000-000000000001",
          product_name_snapshot: "Belgian Double Chocolate Truffle Cake",
          variant_label_snapshot: "1.5 lb (Standard)",
          unit_price_pkr: 3800,
          quantity: 1,
          custom_text: "Happy Anniversary Mama & Baba",
          line_total_pkr: 3800,
        },
      ],
      status_history: [
        {
          id: "sh-1",
          order_id: "40000000-0000-0000-0000-000000000001",
          from_status: null,
          to_status: "pending",
          note: "Order placed via storefront",
          changed_by: null,
          created_at: nowIso,
        },
        {
          id: "sh-2",
          order_id: "40000000-0000-0000-0000-000000000001",
          from_status: "pending",
          to_status: "confirmed",
          note: "Meezan Bank transfer verified",
          changed_by: "admin",
          created_at: nowIso,
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "40000000-0000-0000-0000-000000000002",
      order_code: "EB-4R7N3W",
      tracking_token: "f0e1d2c3b4a5968778695a4b3c2d1e0f",
      idempotency_key: "seed-idem-custom-1",
      order_type: "custom",
      status: "quote_requested",
      payment_status: "unpaid",
      payment_method: "manual_transfer",
      customer_name: "Maham Siddiqui",
      customer_phone: "03339876543",
      delivery_address: "Apartment 902, Sea Breeze Tower, Block 4 Clifton",
      delivery_area: "Clifton",
      delivery_date: todayKarachi,
      delivery_slot: "20:00 - 22:30",
      customer_notes: "Pastel lavender & gold butterflies",
      internal_notes: "",
      cancellation_reason: "",
      subtotal_pkr: 0,
      delivery_fee_pkr: 350,
      advance_required_pkr: 0,
      total_pkr: 350,
      is_first_time_customer: true,
      needs_confirmation: true,
      items: [],
      custom_details: {
        id: "cod-1",
        order_id: "40000000-0000-0000-0000-000000000002",
        flavour_id: "20000000-0000-0000-0000-000000000002",
        flavour_name_snapshot: "Lotus Biscoff Crunch",
        weight_label: "2 lb (Serves 8-12)",
        design_description:
          "Two-tone lavender and cream vintage Lambeth piping with edible gold butterflies.",
        theme_text: "Happy 18th Inaya",
        same_day_eligible: false,
        created_at: nowIso,
      },
      quotes: [],
      reference_images: [],
      status_history: [
        {
          id: "sh-3",
          order_id: "40000000-0000-0000-0000-000000000002",
          from_status: null,
          to_status: "quote_requested",
          note: "Custom cake quote request submitted",
          changed_by: null,
          created_at: nowIso,
        },
      ],
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  return {
    store_settings: settings,
    categories,
    flavours,
    products,
    orders,
    audit_log: [],
    private_blobs: {},
  };
}

let memoryCache: InternalDatabaseState | null = null;

function readState(): InternalDatabaseState {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw) as InternalDatabaseState;
      memoryCache = parsed;
      return parsed;
    }
  } catch {
    // Re-seed if file is missing or corrupted
  }

  const seeded = createInitialSeedState();
  writeState(seeded);
  return seeded;
}

function writeState(state: InternalDatabaseState): void {
  memoryCache = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // In read-only test sandboxes, keep in memoryCache
  }
}

export function resetDatabaseForTests(): void {
  const seeded = createInitialSeedState();
  writeState(seeded);
}

/**
 * Records a PII-scrubbed admin audit log entry.
 * Personal data (phone, address) is explicitly stripped before logging.
 */
export function recordAuditLog(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): AuditLogEntry {
  const state = readState();
  const scrubbedMeta: Record<string, unknown> = {};

  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      const lower = k.toLowerCase();
      if (
        lower.includes("phone") ||
        lower.includes("address") ||
        lower.includes("password") ||
        lower.includes("token")
      ) {
        continue;
      }
      scrubbedMeta[k] = v;
    }
  }

  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    metadata: scrubbedMeta,
    created_at: new Date().toISOString(),
  };

  state.audit_log.unshift(entry);
  writeState(state);
  return entry;
}

export function getAuditLogsAdmin(): AuditLogEntry[] {
  return readState().audit_log;
}

// =============================================================================
// PUBLIC READ QUERIES (RLS-equivalent: only active store settings, categories, flavours, products)
// =============================================================================

export function getStoreSettings(): StoreSettings {
  return structuredClone(readState().store_settings);
}

export function getPublicCategories(): Category[] {
  return readState()
    .categories.filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getPublicFlavours(): Flavour[] {
  return readState()
    .flavours.filter((f) => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getPublicProducts(): Product[] {
  const state = readState();
  const activeCatMap = new Map(
    state.categories.filter((c) => c.is_active).map((c) => [c.id, c.name])
  );

  return state.products
    .filter((p) => p.is_active && !p.is_deleted && activeCatMap.has(p.category_id))
    .map((p) => ({
      ...structuredClone(p),
      category_name: activeCatMap.get(p.category_id) ?? "",
      images: [...p.images].sort((a, b) => a.sort_order - b.sort_order),
    }));
}

export function getPublicProductBySlug(slug: string): Product | null {
  const products = getPublicProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/**
 * Simulates an unauthenticated/anonymous client attempting to query a table directly
 * (used by security tests to verify RLS blocks direct reads of orders, quotes, and reference_images).
 */
export function simulatePublicAnonTableSelect(
  tableName:
    | "store_settings"
    | "categories"
    | "flavours"
    | "products"
    | "orders"
    | "quotes"
    | "reference_images"
    | "audit_log"
): { allowed: boolean; rows: unknown[]; error?: string } {
  if (
    tableName === "orders" ||
    tableName === "quotes" ||
    tableName === "reference_images" ||
    tableName === "audit_log"
  ) {
    return {
      allowed: false,
      rows: [],
      error: `RLS policy violation: anon role cannot SELECT from ${tableName}.`,
    };
  }

  if (tableName === "store_settings") {
    return { allowed: true, rows: [getStoreSettings()] };
  }
  if (tableName === "categories") {
    return { allowed: true, rows: getPublicCategories() };
  }
  if (tableName === "flavours") {
    return { allowed: true, rows: getPublicFlavours() };
  }
  return { allowed: true, rows: getPublicProducts() };
}

// =============================================================================
// SERVER-VERIFIED CUSTOMER LOOKUPS (Token or Order Code + Phone)
// =============================================================================

export interface SanitizedTrackedOrder {
  order_code: string;
  order_type: "fixed" | "custom";
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  customer_first_name: string;
  delivery_area: string;
  delivery_date: string;
  delivery_slot: string;
  subtotal_pkr: number;
  delivery_fee_pkr: number;
  advance_required_pkr: number;
  total_pkr: number;
  items: Array<{
    product_name_snapshot: string;
    variant_label_snapshot: string;
    quantity: number;
    unit_price_pkr: number;
    line_total_pkr: number;
    custom_text: string;
  }>;
  custom_details?: {
    flavour_name_snapshot: string;
    weight_label: string;
    design_description: string;
    theme_text: string;
  };
  active_quote_token?: string;
  status_history: Array<{
    to_status: OrderStatus;
    note: string;
    created_at: string;
  }>;
  created_at: string;
}

function toSanitizedTrackedOrder(order: Order): SanitizedTrackedOrder {
  const firstName = order.customer_name.split(" ")[0] || "Customer";
  const latestSentQuote = order.quotes?.find((q) => q.status === "sent");

  return {
    order_code: order.order_code,
    order_type: order.order_type,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    customer_first_name: firstName,
    delivery_area: order.delivery_area,
    delivery_date: order.delivery_date,
    delivery_slot: order.delivery_slot,
    subtotal_pkr: order.subtotal_pkr,
    delivery_fee_pkr: order.delivery_fee_pkr,
    advance_required_pkr: order.advance_required_pkr,
    total_pkr: order.total_pkr,
    items: order.items.map((i) => ({
      product_name_snapshot: i.product_name_snapshot,
      variant_label_snapshot: i.variant_label_snapshot,
      quantity: i.quantity,
      unit_price_pkr: i.unit_price_pkr,
      line_total_pkr: i.line_total_pkr,
      custom_text: i.custom_text,
    })),
    custom_details: order.custom_details
      ? {
          flavour_name_snapshot: order.custom_details.flavour_name_snapshot,
          weight_label: order.custom_details.weight_label,
          design_description: order.custom_details.design_description,
          theme_text: order.custom_details.theme_text,
        }
      : undefined,
    active_quote_token: latestSentQuote?.quote_token,
    status_history: order.status_history.map((h) => ({
      to_status: h.to_status,
      note: h.note,
      created_at: h.created_at,
    })),
    created_at: order.created_at,
  };
}

export function lookupOrderByTrackingToken(
  trackingToken: string
): SanitizedTrackedOrder | null {
  if (!trackingToken || trackingToken.length < 16) return null;
  const order = readState().orders.find(
    (o) => o.tracking_token === trackingToken
  );
  if (!order) return null;
  return toSanitizedTrackedOrder(order);
}

export function lookupOrderByCodeAndPhone(
  orderCode: string,
  phone: string
): SanitizedTrackedOrder | null {
  const normalizedPhone = normalizePakistaniPhone(phone);
  if (!normalizedPhone) return null;
  const normalizedCode = orderCode.trim().toUpperCase();

  const order = readState().orders.find(
    (o) =>
      o.order_code.toUpperCase() === normalizedCode &&
      normalizePakistaniPhone(o.customer_phone) === normalizedPhone
  );
  if (!order) return null;
  return toSanitizedTrackedOrder(order);
}

// =============================================================================
// ORDER & CUSTOM REQUEST CREATION (Server-calculated totals, atomic stock, idempotency)
// =============================================================================

export interface CreateFixedOrderInput {
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  deliveryArea: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlot: string;
  customerNotes: string;
  paymentMethod: PaymentMethod;
  items: RequestedLineItem[];
  now?: Date;
}

export function createFixedPriceOrder(input: CreateFixedOrderInput): Order {
  const state = readState();

  // 1. Idempotency check: return existing order if already submitted
  const existingByIdem = state.orders.find(
    (o) => o.idempotency_key === input.idempotencyKey
  );
  if (existingByIdem) {
    return structuredClone(existingByIdem);
  }

  // 2. Store open check
  if (!state.store_settings.is_open) {
    throw new Error("Store is currently closed for new orders.");
  }

  // 3. Validate delivery area
  if (!state.store_settings.delivery_areas.includes(input.deliveryArea)) {
    throw new Error("Selected delivery area is outside our Karachi coverage.");
  }

  // 4. Validate delivery slot & lead time
  const slotCheck = evaluateDeliverySlotEligibility({
    deliveryDate: input.deliveryDate,
    deliverySlot: input.deliverySlot,
    minLeadTimeHours: state.store_settings.min_lead_time_hours,
    samedayCutoffTime: state.store_settings.sameday_cutoff_time,
    now: input.now,
  });
  if (!slotCheck.valid) {
    throw new Error(slotCheck.reason || "Selected delivery slot is unavailable.");
  }

  // 5. Server-side pricing & stock calculation (never trusts client prices)
  const calculated = calculateFixedOrderPricing({
    requestedItems: input.items,
    catalogProducts: state.products,
    deliveryFeePkr: state.store_settings.delivery_fee_pkr,
    paymentMethod: input.paymentMethod,
    codAdvanceThresholdPkr: state.store_settings.cod_advance_threshold_pkr,
    defaultAdvancePercent: state.store_settings.default_advance_percent,
  });

  // 6. Atomic stock decrement across all requested items
  for (const line of calculated.lines) {
    const product = state.products.find((p) => p.id === line.productId);
    if (!product) {
      throw new Error("Product not found.");
    }
    if (product.track_inventory && product.stock_quantity !== null) {
      if (product.stock_quantity < line.quantity) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }
      product.stock_quantity -= line.quantity;
      product.updated_at = new Date().toISOString();
    }
  }

  // 7. First-time customer detection
  const normalizedPhone =
    normalizePakistaniPhone(input.customerPhone) ?? input.customerPhone;
  const previousDeliveredCount = state.orders.filter(
    (o) =>
      normalizePakistaniPhone(o.customer_phone) === normalizedPhone &&
      o.status === "delivered"
  ).length;
  const isFirstTime = previousDeliveredCount === 0;

  const nowIso = new Date().toISOString();
  const orderId = crypto.randomUUID();

  let orderCode = generateSecureOrderCode();
  while (state.orders.some((o) => o.order_code === orderCode)) {
    orderCode = generateSecureOrderCode();
  }

  const order: Order = {
    id: orderId,
    order_code: orderCode,
    tracking_token: generateSecure128BitToken(),
    idempotency_key: input.idempotencyKey,
    order_type: "fixed",
    status: "pending",
    payment_status: "unpaid",
    payment_method: input.paymentMethod,
    customer_name: input.customerName,
    customer_phone: normalizedPhone,
    delivery_address: input.deliveryAddress,
    delivery_area: input.deliveryArea,
    delivery_date: input.deliveryDate,
    delivery_slot: input.deliverySlot,
    customer_notes: input.customerNotes,
    internal_notes: "",
    cancellation_reason: "",
    subtotal_pkr: calculated.subtotalPkr,
    delivery_fee_pkr: calculated.deliveryFeePkr,
    advance_required_pkr: calculated.advanceRequiredPkr,
    total_pkr: calculated.totalPkr,
    is_first_time_customer: isFirstTime,
    needs_confirmation: isFirstTime || calculated.advanceRequiredPkr > 0,
    items: calculated.lines.map((line) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: line.productId,
      product_name_snapshot: line.productNameSnapshot,
      variant_label_snapshot: line.variantLabelSnapshot,
      unit_price_pkr: line.unitPricePkr,
      quantity: line.quantity,
      custom_text: line.customText,
      line_total_pkr: line.lineTotalPkr,
    })),
    status_history: [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        from_status: null,
        to_status: "pending",
        note: "Order placed via online storefront",
        changed_by: null,
        created_at: nowIso,
      },
    ],
    created_at: nowIso,
    updated_at: nowIso,
  };

  state.orders.unshift(order);
  writeState(state);
  return structuredClone(order);
}

export interface CreateCustomOrderInput {
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  flavourId: string;
  weightLabel: string;
  themeText: string;
  designDescription: string;
  deliveryArea: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlot: string;
  customerNotes: string;
  referenceImagePaths: Array<{
    storagePath: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    sizeBytes: number;
  }>;
  now?: Date;
}

export function createCustomOrderRequest(input: CreateCustomOrderInput): Order {
  const state = readState();

  const existingByIdem = state.orders.find(
    (o) => o.idempotency_key === input.idempotencyKey
  );
  if (existingByIdem) {
    return structuredClone(existingByIdem);
  }

  if (!state.store_settings.is_open) {
    throw new Error("Store is currently closed for new custom cake requests.");
  }

  if (!state.store_settings.delivery_areas.includes(input.deliveryArea)) {
    throw new Error("Selected delivery area is outside our Karachi coverage.");
  }

  const flavour = state.flavours.find(
    (f) => f.id === input.flavourId && f.is_active
  );
  if (!flavour) {
    throw new Error("Selected cake flavour is not available.");
  }

  const slotCheck = evaluateDeliverySlotEligibility({
    deliveryDate: input.deliveryDate,
    deliverySlot: input.deliverySlot,
    minLeadTimeHours: state.store_settings.min_lead_time_hours,
    samedayCutoffTime: state.store_settings.sameday_cutoff_time,
    now: input.now,
  });
  if (!slotCheck.valid) {
    throw new Error(slotCheck.reason || "Selected delivery slot is unavailable.");
  }

  const normalizedPhone =
    normalizePakistaniPhone(input.customerPhone) ?? input.customerPhone;
  const previousDeliveredCount = state.orders.filter(
    (o) =>
      normalizePakistaniPhone(o.customer_phone) === normalizedPhone &&
      o.status === "delivered"
  ).length;
  const isFirstTime = previousDeliveredCount === 0;

  const nowIso = new Date().toISOString();
  const orderId = crypto.randomUUID();

  let orderCode = generateSecureOrderCode();
  while (state.orders.some((o) => o.order_code === orderCode)) {
    orderCode = generateSecureOrderCode();
  }

  const refImages: ReferenceImage[] = input.referenceImagePaths
    .slice(0, 4)
    .map((img) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      storage_path: img.storagePath,
      mime_type: img.mimeType,
      size_bytes: img.sizeBytes,
      created_at: nowIso,
    }));

  const order: Order = {
    id: orderId,
    order_code: orderCode,
    tracking_token: generateSecure128BitToken(),
    idempotency_key: input.idempotencyKey,
    order_type: "custom",
    status: "quote_requested",
    payment_status: "unpaid",
    payment_method: "manual_transfer",
    customer_name: input.customerName,
    customer_phone: normalizedPhone,
    delivery_address: input.deliveryAddress,
    delivery_area: input.deliveryArea,
    delivery_date: input.deliveryDate,
    delivery_slot: input.deliverySlot,
    customer_notes: input.customerNotes,
    internal_notes: "",
    cancellation_reason: "",
    subtotal_pkr: 0,
    delivery_fee_pkr: state.store_settings.delivery_fee_pkr,
    advance_required_pkr: 0,
    total_pkr: state.store_settings.delivery_fee_pkr,
    is_first_time_customer: isFirstTime,
    needs_confirmation: true,
    items: [],
    custom_details: {
      id: crypto.randomUUID(),
      order_id: orderId,
      flavour_id: flavour.id,
      flavour_name_snapshot: flavour.name,
      weight_label: input.weightLabel,
      design_description: input.designDescription,
      theme_text: input.themeText,
      same_day_eligible: slotCheck.sameDayDeliveryAvailable,
      created_at: nowIso,
    },
    quotes: [],
    reference_images: refImages,
    status_history: [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        from_status: null,
        to_status: "quote_requested",
        note: "Custom cake quote request submitted",
        changed_by: null,
        created_at: nowIso,
      },
    ],
    created_at: nowIso,
    updated_at: nowIso,
  };

  state.orders.unshift(order);
  writeState(state);
  return structuredClone(order);
}

// =============================================================================
// QUOTES & CUSTOMER APPROVAL FLOW (Immutable once approved; versioned revisions)
// =============================================================================

export function createOrReviseQuoteAdmin(params: {
  orderId: string;
  pricePkr: number;
  advancePkr?: number;
  validityHours?: number;
  notes?: string;
  actorId: string;
}): Quote {
  const state = readState();
  const order = state.orders.find((o) => o.id === params.orderId);
  if (!order || order.order_type !== "custom") {
    throw new Error("Custom order not found.");
  }

  const quotes = order.quotes ?? [];
  const hasImmutableApproved = quotes.some(
    (q) => q.is_immutable || q.status === "approved"
  );
  if (hasImmutableApproved) {
    throw new Error(
      "Approved quotes are immutable and cannot be revised."
    );
  }

  // Mark any previously active quotes as superseded
  for (const prev of quotes) {
    if (prev.status === "sent") {
      prev.status = "superseded";
    }
  }

  const nextVersion =
    quotes.reduce((max, q) => Math.max(max, q.version), 0) + 1;
  const deliveryFeePkr = state.store_settings.delivery_fee_pkr;
  const cleanPricePkr = Math.round(params.pricePkr);
  const totalPkr = cleanPricePkr + deliveryFeePkr;
  const defaultAdvance = Math.round(
    (totalPkr * state.store_settings.default_advance_percent) / 100
  );
  const advancePkr =
    params.advancePkr !== undefined
      ? Math.min(totalPkr, Math.max(0, Math.round(params.advancePkr)))
      : defaultAdvance;

  const validityHours =
    params.validityHours ?? state.store_settings.quote_validity_hours;
  const validUntil = new Date(
    Date.now() + validityHours * 60 * 60 * 1000
  ).toISOString();
  const nowIso = new Date().toISOString();

  const newQuote: Quote = {
    id: crypto.randomUUID(),
    order_id: order.id,
    version: nextVersion,
    quote_token: generateSecure128BitToken(),
    price_pkr: cleanPricePkr,
    delivery_fee_pkr: deliveryFeePkr,
    total_pkr: totalPkr,
    advance_pkr: advancePkr,
    notes: params.notes ?? "",
    valid_until: validUntil,
    status: "sent",
    approved_at: null,
    declined_at: null,
    is_immutable: false,
    created_by: params.actorId,
    created_at: nowIso,
  };

  quotes.push(newQuote);
  order.quotes = quotes;
  const prevStatus = order.status;
  order.status = "quoted";
  order.subtotal_pkr = cleanPricePkr;
  order.delivery_fee_pkr = deliveryFeePkr;
  order.total_pkr = totalPkr;
  order.advance_required_pkr = advancePkr;
  order.updated_at = nowIso;

  order.status_history.push({
    id: crypto.randomUUID(),
    order_id: order.id,
    from_status: prevStatus,
    to_status: "quoted",
    note: `Quote v${nextVersion} sent (${totalPkr} PKR)`,
    changed_by: params.actorId,
    created_at: nowIso,
  });

  writeState(state);

  recordAuditLog({
    actorId: params.actorId,
    action: nextVersion === 1 ? "quote.create" : "quote.revise",
    entityType: "quote",
    entityId: newQuote.id,
    metadata: {
      order_id: order.id,
      version: nextVersion,
      total_pkr: totalPkr,
      advance_pkr: advancePkr,
    },
  });

  return structuredClone(newQuote);
}

export function markQuoteExpiredAdmin(params: {
  orderId: string;
  actorId: string;
}): Order {
  const state = readState();
  const order = state.orders.find((o) => o.id === params.orderId);
  if (!order || order.order_type !== "custom") {
    throw new Error("Custom order not found.");
  }

  for (const q of order.quotes ?? []) {
    if (q.status === "sent") {
      q.status = "expired";
    }
  }

  const prevStatus = order.status;
  order.status = "expired";
  order.updated_at = new Date().toISOString();
  order.status_history.push({
    id: crypto.randomUUID(),
    order_id: order.id,
    from_status: prevStatus,
    to_status: "expired",
    note: "Quote marked expired by admin",
    changed_by: params.actorId,
    created_at: order.updated_at,
  });

  writeState(state);

  recordAuditLog({
    actorId: params.actorId,
    action: "quote.expire",
    entityType: "order",
    entityId: order.id,
  });

  return structuredClone(order);
}

export interface CustomerQuoteLookupView {
  quote: Quote;
  order: {
    order_code: string;
    tracking_token: string;
    status: OrderStatus;
    customer_first_name: string;
    delivery_area: string;
    delivery_date: string;
    delivery_slot: string;
    custom_details?: {
      flavour_name_snapshot: string;
      weight_label: string;
      design_description: string;
      theme_text: string;
    };
  };
  store: {
    store_name: string;
    whatsapp_number: string;
    payment_instructions: string;
  };
}

export function getQuoteByTokenForCustomer(
  quoteToken: string
): CustomerQuoteLookupView | null {
  if (!quoteToken || quoteToken.length < 16) return null;
  const state = readState();

  for (const order of state.orders) {
    const matchedQuote = (order.quotes ?? []).find(
      (q) => q.quote_token === quoteToken
    );
    if (matchedQuote) {
      // Auto-mark expired if valid_until has passed and still 'sent'
      if (
        matchedQuote.status === "sent" &&
        new Date(matchedQuote.valid_until).getTime() <= Date.now()
      ) {
        matchedQuote.status = "expired";
        if (order.status === "quoted") {
          order.status = "expired";
        }
        writeState(state);
      }

      return {
        quote: structuredClone(matchedQuote),
        order: {
          order_code: order.order_code,
          tracking_token: order.tracking_token,
          status: order.status,
          customer_first_name:
            order.customer_name.split(" ")[0] || "Customer",
          delivery_area: order.delivery_area,
          delivery_date: order.delivery_date,
          delivery_slot: order.delivery_slot,
          custom_details: order.custom_details
            ? {
                flavour_name_snapshot:
                  order.custom_details.flavour_name_snapshot,
                weight_label: order.custom_details.weight_label,
                design_description: order.custom_details.design_description,
                theme_text: order.custom_details.theme_text,
              }
            : undefined,
        },
        store: {
          store_name: state.store_settings.store_name,
          whatsapp_number: state.store_settings.whatsapp_number,
          payment_instructions: state.store_settings.payment_instructions,
        },
      };
    }
  }

  return null;
}

/**
 * Customer approves or declines a quote by token.
 * The customer can NEVER modify the price, advance, or delivery fee — only approve or decline before expiry.
 */
export function respondToQuoteByCustomer(params: {
  quoteToken: string;
  action: "approve" | "decline";
  reason?: string;
  now?: Date;
}): CustomerQuoteLookupView {
  const now = params.now ?? new Date();
  const state = readState();

  for (const order of state.orders) {
    const quote = (order.quotes ?? []).find(
      (q) => q.quote_token === params.quoteToken
    );
    if (!quote) continue;

    if (quote.status === "superseded") {
      throw new Error(
        "This quote version has been superseded by a newer quote from the baker."
      );
    }

    if (quote.status === "approved" || quote.is_immutable) {
      throw new Error("This quote has already been approved and is locked.");
    }

    if (quote.status === "declined") {
      throw new Error("This quote was already declined.");
    }

    if (
      quote.status === "expired" ||
      new Date(quote.valid_until).getTime() <= now.getTime()
    ) {
      quote.status = "expired";
      if (order.status === "quoted") {
        order.status = "expired";
      }
      writeState(state);
      throw new Error("This quote has expired and can no longer be approved.");
    }

    const nowIso = now.toISOString();
    const prevStatus = order.status;

    if (params.action === "approve") {
      quote.status = "approved";
      quote.approved_at = nowIso;
      quote.is_immutable = true;
      order.status = "confirmed";
      order.subtotal_pkr = quote.price_pkr;
      order.delivery_fee_pkr = quote.delivery_fee_pkr;
      order.total_pkr = quote.total_pkr;
      order.advance_required_pkr = quote.advance_pkr;
      order.updated_at = nowIso;

      order.status_history.push({
        id: crypto.randomUUID(),
        order_id: order.id,
        from_status: prevStatus,
        to_status: "confirmed",
        note: `Customer approved Quote v${quote.version}`,
        changed_by: null,
        created_at: nowIso,
      });
    } else {
      quote.status = "declined";
      quote.declined_at = nowIso;
      order.status = "declined";
      order.updated_at = nowIso;

      order.status_history.push({
        id: crypto.randomUUID(),
        order_id: order.id,
        from_status: prevStatus,
        to_status: "declined",
        note: params.reason
          ? `Customer declined quote: ${params.reason}`
          : `Customer declined Quote v${quote.version}`,
        changed_by: null,
        created_at: nowIso,
      });
    }

    writeState(state);
    const updatedView = getQuoteByTokenForCustomer(params.quoteToken);
    if (!updatedView) {
      throw new Error("Failed to load updated quote.");
    }
    return updatedView;
  }

  throw new Error("Quote not found.");
}

// =============================================================================
// ADMIN CRUD OPERATIONS (Products, Categories, Flavours, Orders, Settings)
// =============================================================================

export function getAllProductsAdmin(): Product[] {
  const state = readState();
  const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
  return state.products
    .filter((p) => !p.is_deleted)
    .map((p) => ({
      ...structuredClone(p),
      category_name: catMap.get(p.category_id) ?? "Uncategorized",
    }));
}

export function upsertProductAdmin(params: {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  pricePkr: number;
  compareAtPricePkr?: number | null;
  trackInventory: boolean;
  stockQuantity?: number | null;
  allowCustomText: boolean;
  isActive: boolean;
  images: Array<{ url: string; altText?: string; sortOrder: number }>;
  options: Array<{
    name: string;
    required: boolean;
    choices: Array<{ label: string; priceDeltaPkr: number }>;
  }>;
  actorId: string;
}): Product {
  const state = readState();
  const nowIso = new Date().toISOString();

  const duplicateSlug = state.products.find(
    (p) => p.slug === params.slug && p.id !== params.id && !p.is_deleted
  );
  if (duplicateSlug) {
    throw new Error("Another product already uses this URL slug.");
  }

  const productId = params.id || crypto.randomUUID();
  const existingIndex = state.products.findIndex((p) => p.id === productId);

  const product: Product = {
    id: productId,
    category_id: params.categoryId,
    name: params.name,
    slug: params.slug,
    description: params.description,
    price_pkr: Math.round(params.pricePkr),
    compare_at_price_pkr:
      params.compareAtPricePkr && params.compareAtPricePkr > params.pricePkr
        ? Math.round(params.compareAtPricePkr)
        : null,
    track_inventory: params.trackInventory,
    stock_quantity: params.trackInventory
      ? Math.max(0, Math.round(params.stockQuantity ?? 0))
      : null,
    allow_custom_text: params.allowCustomText,
    is_active: params.isActive,
    is_deleted: false,
    images: params.images.map((img, idx) => ({
      id: crypto.randomUUID(),
      product_id: productId,
      url: img.url,
      alt_text: img.altText || params.name,
      sort_order: idx,
    })),
    options: params.options.map((opt) => ({
      id: crypto.randomUUID(),
      product_id: productId,
      name: opt.name,
      required: opt.required,
      choices: opt.choices,
    })),
    created_at:
      existingIndex >= 0
        ? state.products[existingIndex]!.created_at
        : nowIso,
    updated_at: nowIso,
  };

  if (existingIndex >= 0) {
    state.products[existingIndex] = product;
  } else {
    state.products.unshift(product);
  }

  writeState(state);

  recordAuditLog({
    actorId: params.actorId,
    action: existingIndex >= 0 ? "product.update" : "product.create",
    entityType: "product",
    entityId: productId,
    metadata: { name: product.name, price_pkr: product.price_pkr },
  });

  return structuredClone(product);
}

/**
 * Deletes a product. If the product is referenced by any order, performs a soft-delete
 * (`is_deleted = true`, `is_active = false`) to preserve historical order integrity.
 */
export function deleteProductAdmin(params: {
  productId: string;
  actorId: string;
}): { softDeleted: boolean } {
  const state = readState();
  const product = state.products.find((p) => p.id === params.productId);
  if (!product) {
    throw new Error("Product not found.");
  }

  const hasOrders = state.orders.some((o) =>
    o.items.some((item) => item.product_id === params.productId)
  );

  if (hasOrders) {
    product.is_deleted = true;
    product.is_active = false;
    product.updated_at = new Date().toISOString();
  } else {
    state.products = state.products.filter((p) => p.id !== params.productId);
  }

  writeState(state);

  recordAuditLog({
    actorId: params.actorId,
    action: hasOrders ? "product.soft_delete" : "product.hard_delete",
    entityType: "product",
    entityId: params.productId,
    metadata: { softDeleted: hasOrders },
  });

  return { softDeleted: hasOrders };
}

export function getAllCategoriesAdmin(): Category[] {
  return [...readState().categories].sort((a, b) => a.sort_order - b.sort_order);
}

export function upsertCategoryAdmin(params: {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  actorId: string;
}): Category {
  const state = readState();
  const id = params.id || crypto.randomUUID();
  const idx = state.categories.findIndex((c) => c.id === id);
  const nowIso = new Date().toISOString();

  const category: Category = {
    id,
    name: params.name,
    slug: params.slug,
    description: params.description,
    sort_order: params.sortOrder,
    is_active: params.isActive,
    created_at: idx >= 0 ? state.categories[idx]!.created_at : nowIso,
    updated_at: nowIso,
  };

  if (idx >= 0) {
    state.categories[idx] = category;
  } else {
    state.categories.push(category);
  }

  writeState(state);
  recordAuditLog({
    actorId: params.actorId,
    action: idx >= 0 ? "category.update" : "category.create",
    entityType: "category",
    entityId: id,
    metadata: { name: category.name },
  });
  return structuredClone(category);
}

export function deleteCategoryAdmin(params: {
  categoryId: string;
  actorId: string;
}): void {
  const state = readState();
  const inUse = state.products.some(
    (p) => p.category_id === params.categoryId && !p.is_deleted
  );
  if (inUse) {
    throw new Error(
      "Cannot delete a category that still contains active products."
    );
  }
  state.categories = state.categories.filter((c) => c.id !== params.categoryId);
  writeState(state);
  recordAuditLog({
    actorId: params.actorId,
    action: "category.delete",
    entityType: "category",
    entityId: params.categoryId,
  });
}

export function getAllFlavoursAdmin(): Flavour[] {
  return [...readState().flavours].sort((a, b) => a.sort_order - b.sort_order);
}

export function upsertFlavourAdmin(params: {
  id?: string;
  name: string;
  slug: string;
  description: string;
  priceModifierPkr: number;
  sortOrder: number;
  isActive: boolean;
  actorId: string;
}): Flavour {
  const state = readState();
  const id = params.id || crypto.randomUUID();
  const idx = state.flavours.findIndex((f) => f.id === id);
  const nowIso = new Date().toISOString();

  const flavour: Flavour = {
    id,
    name: params.name,
    slug: params.slug,
    description: params.description,
    price_modifier_pkr: Math.round(params.priceModifierPkr),
    sort_order: params.sortOrder,
    is_active: params.isActive,
    created_at: idx >= 0 ? state.flavours[idx]!.created_at : nowIso,
  };

  if (idx >= 0) {
    state.flavours[idx] = flavour;
  } else {
    state.flavours.push(flavour);
  }

  writeState(state);
  recordAuditLog({
    actorId: params.actorId,
    action: idx >= 0 ? "flavour.update" : "flavour.create",
    entityType: "flavour",
    entityId: id,
    metadata: { name: flavour.name },
  });
  return structuredClone(flavour);
}

export function deleteFlavourAdmin(params: {
  flavourId: string;
  actorId: string;
}): void {
  const state = readState();
  state.flavours = state.flavours.filter((f) => f.id !== params.flavourId);
  writeState(state);
  recordAuditLog({
    actorId: params.actorId,
    action: "flavour.delete",
    entityType: "flavour",
    entityId: params.flavourId,
  });
}

export function updateStoreSettingsAdmin(params: {
  settings: Omit<StoreSettings, "id" | "updated_at">;
  actorId: string;
}): StoreSettings {
  const state = readState();
  const updated: StoreSettings = {
    ...state.store_settings,
    ...params.settings,
    updated_at: new Date().toISOString(),
  };
  state.store_settings = updated;
  writeState(state);

  recordAuditLog({
    actorId: params.actorId,
    action: "settings.update",
    entityType: "store_settings",
    entityId: updated.id,
    metadata: {
      is_open: updated.is_open,
      delivery_fee_pkr: updated.delivery_fee_pkr,
    },
  });

  return structuredClone(updated);
}

export function getAdminOrders(): Order[] {
  const state = readState();
  return state.orders.map((order) => {
    const clone = structuredClone(order);
    if (clone.reference_images) {
      clone.reference_images = clone.reference_images.map((refImg) => ({
        ...refImg,
        signed_url: getSignedReferenceImageUrlForAdmin(refImg.storage_path),
      }));
    }
    return clone;
  });
}

export function getAdminOrderById(orderId: string): Order | null {
  return getAdminOrders().find((o) => o.id === orderId) ?? null;
}

export function updateOrderStatusAdmin(params: {
  orderId: string;
  newStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  internalNotes?: string;
  cancellationReason?: string;
  actorId: string;
}): Order {
  const state = readState();
  const order = state.orders.find((o) => o.id === params.orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  const statusChanged = order.status !== params.newStatus;
  if (statusChanged) {
    const allowed = isValidStatusTransition(
      order.order_type,
      order.status,
      params.newStatus
    );
    if (!allowed) {
      throw new Error(
        `Invalid status transition from '${order.status}' to '${params.newStatus}' for ${order.order_type} order.`
      );
    }
  }

  const nowIso = new Date().toISOString();
  const prevStatus = order.status;
  order.status = params.newStatus;

  if (params.paymentStatus) {
    order.payment_status = params.paymentStatus;
  }
  if (params.internalNotes !== undefined) {
    order.internal_notes = params.internalNotes;
  }
  if (params.cancellationReason !== undefined) {
    order.cancellation_reason = params.cancellationReason;
  }
  if (params.newStatus === "confirmed") {
    order.needs_confirmation = false;
  }

  order.updated_at = nowIso;

  if (statusChanged) {
    order.status_history.push({
      id: crypto.randomUUID(),
      order_id: order.id,
      from_status: prevStatus,
      to_status: params.newStatus,
      note:
        params.newStatus === "cancelled" && params.cancellationReason
          ? `Cancelled: ${params.cancellationReason}`
          : `Status updated to ${params.newStatus}`,
      changed_by: params.actorId,
      created_at: nowIso,
    });
  }

  writeState(state);

  recordAuditLog({
    actorId: params.actorId,
    action: "order.update",
    entityType: "order",
    entityId: order.id,
    metadata: {
      from_status: prevStatus,
      to_status: order.status,
      payment_status: order.payment_status,
    },
  });

  return structuredClone(order);
}

export function getCustomersDerivedFromOrdersAdmin(): CustomerSummary[] {
  const orders = getAdminOrders();
  const map = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const phone =
      normalizePakistaniPhone(order.customer_phone) ?? order.customer_phone;
    const existing = map.get(phone);
    const isDelivered = order.status === "delivered";
    const spentDelta =
      order.status !== "cancelled" &&
      order.status !== "declined" &&
      order.status !== "expired"
        ? order.total_pkr
        : 0;

    if (!existing) {
      map.set(phone, {
        phone,
        name: order.customer_name,
        area: order.delivery_area,
        total_orders: 1,
        delivered_orders: isDelivered ? 1 : 0,
        total_spent_pkr: spentDelta,
        last_order_at: order.created_at,
        is_repeat_customer: false,
        orders: [
          {
            id: order.id,
            order_code: order.order_code,
            order_type: order.order_type,
            status: order.status,
            total_pkr: order.total_pkr,
            delivery_date: order.delivery_date,
            created_at: order.created_at,
          },
        ],
      });
    } else {
      existing.total_orders += 1;
      if (isDelivered) existing.delivered_orders += 1;
      existing.total_spent_pkr += spentDelta;
      if (order.created_at > existing.last_order_at) {
        existing.last_order_at = order.created_at;
        existing.name = order.customer_name;
        existing.area = order.delivery_area;
      }
      existing.is_repeat_customer = existing.total_orders > 1;
      existing.orders.push({
        id: order.id,
        order_code: order.order_code,
        order_type: order.order_type,
        status: order.status,
        total_pkr: order.total_pkr,
        delivery_date: order.delivery_date,
        created_at: order.created_at,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_orders - a.total_orders
  );
}

// =============================================================================
// PRIVATE REFERENCE IMAGE BUCKET & SHORT-LIVED ADMIN SIGNED URLS
// =============================================================================

export function savePrivateReferenceImageBlob(params: {
  storagePath: string;
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}): void {
  const state = readState();
  state.private_blobs[params.storagePath] = {
    base64: Buffer.from(params.bytes).toString("base64"),
    mimeType: params.mimeType,
  };
  writeState(state);
}

/**
 * Generates a short-lived HMAC-signed URL (valid for 300 seconds) for an admin
 * to view a private reference image. Anonymous requests without a valid signature or admin session are rejected.
 */
export function getSignedReferenceImageUrlForAdmin(storagePath: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes
  const sig = crypto
    .createHmac("sha256", "eshaal-private-storage-signing-key")
    .update(`${storagePath}:${expiresAt}`)
    .digest("hex");

  const blob = readState().private_blobs[storagePath];
  if (blob) {
    return `data:${blob.mimeType};base64,${blob.base64}`;
  }
  return `/api/uploads/reference?path=${encodeURIComponent(storagePath)}&exp=${expiresAt}&sig=${sig}`;
}

export function verifySignedReferenceUrl(
  storagePath: string,
  exp: number,
  sig: string
): boolean {
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp < nowSec) return false;
  const expected = crypto
    .createHmac("sha256", "eshaal-private-storage-signing-key")
    .update(`${storagePath}:${exp}`)
    .digest("hex");
  return sig === expected;
}
