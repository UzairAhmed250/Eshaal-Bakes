import { z } from "zod";
import { normalizePakistaniPhone } from "@/lib/format";
import { sanitizeUserText } from "@/lib/utils";

export const pakistaniPhoneSchema = z
  .string()
  .min(10, "Enter a valid Pakistani mobile number (03XX-XXXXXXX)")
  .refine((val) => normalizePakistaniPhone(val) !== null, {
    message: "Invalid Pakistani phone format. Use 03XX-XXXXXXX",
  })
  .transform((val) => normalizePakistaniPhone(val) ?? val);

export const safeStringSchema = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .transform(sanitizeUserText);

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  variantLabel: z.string().max(80).optional().default(""),
  customText: z.string().max(60).optional().default(""),
});

export const fixedCheckoutSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  customerName: safeStringSchema(2, 80, "Full name"),
  customerPhone: pakistaniPhoneSchema,
  deliveryArea: safeStringSchema(2, 80, "Delivery area"),
  deliveryAddress: safeStringSchema(8, 280, "Street address"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
  deliverySlot: safeStringSchema(5, 40, "Delivery slot"),
  customerNotes: z
    .string()
    .max(400)
    .optional()
    .default("")
    .transform(sanitizeUserText),
  paymentMethod: z.enum(["cod", "manual_transfer"]),
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
  honeypot: z.string().max(0, "Bot detected").optional().default(""),
  turnstileToken: z.string().optional().default(""),
});

export const customOrderRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  customerName: safeStringSchema(2, 80, "Full name"),
  customerPhone: pakistaniPhoneSchema,
  flavourId: z.string().min(1, "Please choose a cake flavour"),
  weightLabel: safeStringSchema(2, 80, "Cake weight"),
  themeText: z
    .string()
    .max(80)
    .optional()
    .default("")
    .transform(sanitizeUserText),
  designDescription: safeStringSchema(10, 1000, "Design & theme description"),
  deliveryArea: safeStringSchema(2, 80, "Delivery area"),
  deliveryAddress: safeStringSchema(8, 280, "Street address"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
  deliverySlot: safeStringSchema(5, 40, "Delivery slot"),
  customerNotes: z
    .string()
    .max(400)
    .optional()
    .default("")
    .transform(sanitizeUserText),
  referenceImagePaths: z
    .array(
      z.object({
        storagePath: z.string().min(3).max(255),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        sizeBytes: z.number().int().min(1).max(5242880),
      })
    )
    .max(4, "Maximum 4 reference photos allowed")
    .optional()
    .default([]),
  honeypot: z.string().max(0, "Bot detected").optional().default(""),
  turnstileToken: z.string().optional().default(""),
});

export const sendOrReviseQuoteSchema = z.object({
  orderId: z.string().min(1),
  pricePkr: z.number().int().min(500, "Price must be at least PKR 500").max(500000),
  advancePkr: z.number().int().min(0).max(500000),
  validityHours: z.number().int().min(1).max(168),
  notes: z.string().max(500).optional().default("").transform(sanitizeUserText),
});

export const quoteCustomerDecisionSchema = z.object({
  action: z.enum(["approve", "decline"]),
  reason: z.string().max(300).optional().default("").transform(sanitizeUserText),
});

export const trackingLookupSchema = z.object({
  orderCode: z
    .string()
    .trim()
    .min(4, "Enter your Order Code")
    .max(20)
    .transform((v) => v.toUpperCase()),
  phone: pakistaniPhoneSchema,
});

export const productOptionChoiceSchema = z.object({
  label: safeStringSchema(1, 60, "Variant label"),
  priceDeltaPkr: z.number().int().min(-50000).max(100000),
});

export const productFormSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  name: safeStringSchema(2, 120, "Product name"),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens"),
  description: safeStringSchema(5, 1000, "Description"),
  pricePkr: z.number().int().min(100, "Price must be at least PKR 100").max(500000),
  compareAtPricePkr: z.number().int().min(0).max(500000).nullable().optional(),
  trackInventory: z.boolean(),
  stockQuantity: z.number().int().min(0).max(10000).nullable().optional(),
  allowCustomText: z.boolean(),
  isActive: z.boolean(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        altText: z.string().max(120).optional().default(""),
        sortOrder: z.number().int().min(0),
      })
    )
    .min(1, "At least one product image is required")
    .max(8),
  options: z
    .array(
      z.object({
        name: safeStringSchema(1, 60, "Option name"),
        required: z.boolean(),
        choices: z.array(productOptionChoiceSchema).min(1),
      })
    )
    .optional()
    .default([]),
});

export const categoryFormSchema = z.object({
  id: z.string().optional(),
  name: safeStringSchema(2, 80, "Category name"),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional().default("").transform(sanitizeUserText),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const flavourFormSchema = z.object({
  id: z.string().optional(),
  name: safeStringSchema(2, 80, "Flavour name"),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional().default("").transform(sanitizeUserText),
  priceModifierPkr: z.number().int().min(0).max(50000).default(0),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const storeSettingsFormSchema = z.object({
  store_name: safeStringSchema(2, 80, "Store name"),
  tagline: safeStringSchema(2, 140, "Tagline"),
  logo_url: z.string().min(1).max(300),
  whatsapp_number: z.string().min(10).max(20),
  delivery_fee_pkr: z.number().int().min(0).max(10000),
  delivery_areas: z.array(safeStringSchema(2, 80, "Area")).min(1),
  is_open: z.boolean(),
  announcement_banner: z
    .string()
    .max(300)
    .optional()
    .default("")
    .transform(sanitizeUserText),
  payment_instructions: safeStringSchema(10, 600, "Payment instructions"),
  min_lead_time_hours: z.number().int().min(1).max(168),
  sameday_cutoff_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm format"),
  default_advance_percent: z.number().int().min(0).max(100),
  cod_advance_threshold_pkr: z.number().int().min(0).max(500000),
  quote_validity_hours: z.number().int().min(1).max(168),
});

export const adminOrderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "pending",
    "quote_requested",
    "quoted",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "declined",
    "expired",
  ]),
  paymentStatus: z.enum(["unpaid", "advance_paid", "paid"]).optional(),
  internalNotes: z.string().max(1000).optional().transform((v) => (v ? sanitizeUserText(v) : undefined)),
  cancellationReason: z.string().max(400).optional().transform((v) => (v ? sanitizeUserText(v) : undefined)),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid admin email"),
  password: z.string().min(6, "Password is required"),
  totpCode: z.string().max(10).optional().default(""),
});
