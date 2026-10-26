export type UserRole = "admin" | "staff" | "customer";

export type OrderType = "fixed" | "custom";

export type FixedOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type CustomOrderStatus =
  | "quote_requested"
  | "quoted"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "declined"
  | "expired";

export type OrderStatus = FixedOrderStatus | CustomOrderStatus;

export type PaymentStatus = "unpaid" | "advance_paid" | "paid";

export type PaymentMethod = "cod" | "manual_transfer";

export type QuoteStatus =
  | "sent"
  | "approved"
  | "declined"
  | "superseded"
  | "expired";

export interface StoreSettings {
  id: string;
  store_name: string;
  tagline: string;
  logo_url: string;
  whatsapp_number: string;
  delivery_fee_pkr: number;
  delivery_areas: string[];
  is_open: boolean;
  announcement_banner: string;
  payment_instructions: string;
  min_lead_time_hours: number;
  sameday_cutoff_time: string; // HH:mm in Asia/Karachi
  default_advance_percent: number;
  cod_advance_threshold_pkr: number;
  quote_validity_hours: number;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Flavour {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_modifier_pkr: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductOptionChoice {
  label: string;
  priceDeltaPkr: number;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  choices: ProductOptionChoice[];
  required: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price_pkr: number;
  compare_at_price_pkr: number | null;
  stock_quantity: number | null; // null = unlimited
  track_inventory: boolean;
  allow_custom_text: boolean;
  is_active: boolean;
  is_deleted: boolean;
  images: ProductImage[];
  options: ProductOption[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  variant_label_snapshot: string;
  unit_price_pkr: number;
  quantity: number;
  custom_text: string;
  line_total_pkr: number;
}

export interface CustomOrderDetails {
  id: string;
  order_id: string;
  flavour_id: string | null;
  flavour_name_snapshot: string;
  weight_label: string;
  design_description: string;
  theme_text: string;
  same_day_eligible: boolean;
  created_at: string;
}

export interface ReferenceImage {
  id: string;
  order_id: string;
  storage_path: string;
  signed_url?: string; // Populated for admins only via short-lived signed URL
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
  created_at: string;
}

export interface Quote {
  id: string;
  order_id: string;
  version: number;
  quote_token: string;
  price_pkr: number;
  delivery_fee_pkr: number;
  total_pkr: number;
  advance_pkr: number;
  notes: string;
  valid_until: string;
  status: QuoteStatus;
  approved_at: string | null;
  declined_at: string | null;
  is_immutable: boolean;
  created_by: string | null;
  created_at: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string;
  changed_by: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  tracking_token: string;
  idempotency_key: string;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_area: string;
  delivery_date: string; // YYYY-MM-DD
  delivery_slot: string;
  customer_notes: string;
  internal_notes: string;
  cancellation_reason: string;
  subtotal_pkr: number;
  delivery_fee_pkr: number;
  advance_required_pkr: number;
  total_pkr: number;
  is_first_time_customer: boolean;
  needs_confirmation: boolean;
  items: OrderItem[];
  custom_details?: CustomOrderDetails;
  quotes?: Quote[];
  reference_images?: ReferenceImage[];
  status_history: OrderStatusHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CustomerSummary {
  phone: string;
  name: string;
  area: string;
  total_orders: number;
  delivered_orders: number;
  total_spent_pkr: number;
  last_order_at: string;
  is_repeat_customer: boolean;
  orders: Array<{
    id: string;
    order_code: string;
    order_type: OrderType;
    status: OrderStatus;
    total_pkr: number;
    delivery_date: string;
    created_at: string;
  }>;
}

export interface CartItem {
  cartItemId: string; // productId + "::" + variantLabel + "::" + customText
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPricePkr: number;
  variantLabel: string;
  customText: string;
  quantity: number;
  maxStock: number | null;
}
