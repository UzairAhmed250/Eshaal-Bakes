import type { PaymentMethod, Product } from "@/types";

export const DELIVERY_SLOTS = [
  { id: "11:00 - 14:00", label: "11:00 AM – 2:00 PM", startHour: 11 },
  { id: "14:00 - 17:00", label: "2:00 PM – 5:00 PM", startHour: 14 },
  { id: "17:00 - 20:00", label: "5:00 PM – 8:00 PM", startHour: 17 },
  { id: "20:00 - 22:30", label: "8:00 PM – 10:30 PM", startHour: 20 },
] as const;

/**
 * Returns the current date/time parts in Asia/Karachi (UTC+5).
 */
export function getKarachiDateParts(now: Date = new Date()): {
  dateStr: string; // YYYY-MM-DD
  hour: number;
  minute: number;
  totalMinutes: number;
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const rawHour = Number.parseInt(get("hour"), 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number.parseInt(get("minute"), 10);

  return {
    dateStr: `${year}-${month}-${day}`,
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

/**
 * Parses `HH:mm` into minutes since midnight.
 */
export function parseCutoffMinutes(cutoffTime: string): number {
  const [hh, mm] = cutoffTime.split(":").map((n) => Number.parseInt(n, 10));
  const h = Number.isFinite(hh) ? (hh as number) : 13;
  const m = Number.isFinite(mm) ? (mm as number) : 0;
  return h * 60 + m;
}

/**
 * Parses slot start hour from a slot string like `"17:00 - 20:00"`.
 */
export function parseSlotStartHour(slot: string): number | null {
  const match = slot.match(/^(\d{1,2}):(\d{2})/);
  if (!match || !match[1]) return null;
  const hour = Number.parseInt(match[1], 10);
  return Number.isFinite(hour) ? hour : null;
}

export interface SlotEligibilityInput {
  deliveryDate: string; // YYYY-MM-DD
  deliverySlot: string; // e.g. "17:00 - 20:00"
  minLeadTimeHours: number;
  samedayCutoffTime: string; // e.g. "13:00"
  now?: Date;
}

export interface SlotEligibilityResult {
  valid: boolean;
  isSameDay: boolean;
  sameDayDeliveryAvailable: boolean;
  reason?: string;
}

/**
 * Evaluates whether a requested delivery date + time slot satisfies the store's
 * minimum lead time and same-day cutoff in Asia/Karachi timezone.
 */
export function evaluateDeliverySlotEligibility(
  input: SlotEligibilityInput
): SlotEligibilityResult {
  const now = input.now ?? new Date();
  const karachiNow = getKarachiDateParts(now);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deliveryDate)) {
    return {
      valid: false,
      isSameDay: false,
      sameDayDeliveryAvailable: false,
      reason: "Invalid delivery date format.",
    };
  }

  const slotStartHour = parseSlotStartHour(input.deliverySlot);
  if (slotStartHour === null) {
    return {
      valid: false,
      isSameDay: false,
      sameDayDeliveryAvailable: false,
      reason: "Invalid delivery time slot.",
    };
  }

  if (input.deliveryDate < karachiNow.dateStr) {
    return {
      valid: false,
      isSameDay: false,
      sameDayDeliveryAvailable: false,
      reason: "Delivery date cannot be in the past.",
    };
  }

  const isSameDay = input.deliveryDate === karachiNow.dateStr;
  const cutoffMinutes = parseCutoffMinutes(input.samedayCutoffTime);
  const slotStartDate = new Date(
    `${input.deliveryDate}T${String(slotStartHour).padStart(2, "0")}:00:00+05:00`
  );
  const hoursUntilSlot =
    (slotStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (isSameDay) {
    if (karachiNow.totalMinutes >= cutoffMinutes) {
      return {
        valid: false,
        isSameDay: true,
        sameDayDeliveryAvailable: false,
        reason: `Same-day order cutoff (${input.samedayCutoffTime} PKT) has passed.`,
      };
    }

    if (hoursUntilSlot < input.minLeadTimeHours) {
      return {
        valid: false,
        isSameDay: true,
        sameDayDeliveryAvailable: false,
        reason: `Slot requires at least ${input.minLeadTimeHours} hours lead time.`,
      };
    }

    return {
      valid: true,
      isSameDay: true,
      sameDayDeliveryAvailable: true,
    };
  }

  // Future date: check lead time (relevant for late-night orders for tomorrow morning)
  if (hoursUntilSlot < input.minLeadTimeHours) {
    return {
      valid: false,
      isSameDay: false,
      sameDayDeliveryAvailable: false,
      reason: `This morning slot requires at least ${input.minLeadTimeHours} hours lead time.`,
    };
  }

  return {
    valid: true,
    isSameDay: false,
    sameDayDeliveryAvailable: false,
  };
}

/**
 * Generates the next `daysCount` YYYY-MM-DD dates in Asia/Karachi starting from today.
 */
export function getUpcomingKarachiDates(
  daysCount: number = 14,
  now: Date = new Date()
): string[] {
  const { dateStr } = getKarachiDateParts(now);
  const base = new Date(`${dateStr}T12:00:00+05:00`);
  const result: string[] = [];

  for (let i = 0; i < daysCount; i++) {
    const next = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const parts = getKarachiDateParts(next);
    result.push(parts.dateStr);
  }
  return result;
}

export interface RequestedLineItem {
  productId: string;
  quantity: number;
  variantLabel?: string;
  customText?: string;
}

export interface CalculatedOrderLine {
  productId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  unitPricePkr: number;
  quantity: number;
  customText: string;
  lineTotalPkr: number;
}

export interface CalculatedFixedOrderTotals {
  lines: CalculatedOrderLine[];
  subtotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  advanceRequiredPkr: number;
}

/**
 * Server-side pricing calculator for fixed-price cart items.
 * Never trusts client-supplied prices or totals.
 */
export function calculateFixedOrderPricing(params: {
  requestedItems: RequestedLineItem[];
  catalogProducts: Product[];
  deliveryFeePkr: number;
  paymentMethod: PaymentMethod;
  codAdvanceThresholdPkr: number;
  defaultAdvancePercent: number;
}): CalculatedFixedOrderTotals {
  const {
    requestedItems,
    catalogProducts,
    deliveryFeePkr,
    paymentMethod,
    codAdvanceThresholdPkr,
    defaultAdvancePercent,
  } = params;

  if (requestedItems.length === 0) {
    throw new Error("Order must contain at least one item.");
  }

  const lines: CalculatedOrderLine[] = [];
  let subtotalPkr = 0;

  for (const req of requestedItems) {
    if (!Number.isInteger(req.quantity) || req.quantity < 1 || req.quantity > 50) {
      throw new Error("Invalid item quantity.");
    }

    const product = catalogProducts.find(
      (p) => p.id === req.productId && p.is_active && !p.is_deleted
    );
    if (!product) {
      throw new Error("One or more products are unavailable.");
    }

    if (
      product.track_inventory &&
      product.stock_quantity !== null &&
      product.stock_quantity < req.quantity
    ) {
      throw new Error(
        `Insufficient stock for ${product.name} (only ${product.stock_quantity} available).`
      );
    }

    let optionDeltaPkr = 0;
    const requestedVariant = (req.variantLabel ?? "").trim();

    if (product.options.length > 0 && requestedVariant) {
      for (const opt of product.options) {
        const matchedChoice = opt.choices.find(
          (c) => c.label.toLowerCase() === requestedVariant.toLowerCase()
        );
        if (matchedChoice) {
          optionDeltaPkr += matchedChoice.priceDeltaPkr;
        }
      }
    }

    const unitPricePkr = Math.max(0, Math.round(product.price_pkr + optionDeltaPkr));
    const lineTotalPkr = unitPricePkr * req.quantity;
    subtotalPkr += lineTotalPkr;

    lines.push({
      productId: product.id,
      productNameSnapshot: product.name,
      variantLabelSnapshot: requestedVariant,
      unitPricePkr,
      quantity: req.quantity,
      customText: product.allow_custom_text
        ? (req.customText ?? "").trim().slice(0, 60)
        : "",
      lineTotalPkr,
    });
  }

  const cleanDeliveryFee = Math.max(0, Math.round(deliveryFeePkr));
  const totalPkr = subtotalPkr + cleanDeliveryFee;

  let advanceRequiredPkr = 0;
  if (paymentMethod === "cod" && totalPkr > codAdvanceThresholdPkr) {
    advanceRequiredPkr = Math.round((totalPkr * defaultAdvancePercent) / 100);
  }

  return {
    lines,
    subtotalPkr,
    deliveryFeePkr: cleanDeliveryFee,
    totalPkr,
    advanceRequiredPkr,
  };
}
