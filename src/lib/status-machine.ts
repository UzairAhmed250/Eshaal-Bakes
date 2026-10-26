import type {
  CustomOrderStatus,
  FixedOrderStatus,
  OrderStatus,
  OrderType,
  PaymentStatus,
  QuoteStatus,
} from "@/types";

const FIXED_TRANSITIONS: Record<FixedOrderStatus, FixedOrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const CUSTOM_TRANSITIONS: Record<CustomOrderStatus, CustomOrderStatus[]> = {
  quote_requested: ["quoted", "cancelled", "expired"],
  quoted: ["confirmed", "declined", "expired", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  declined: ["quoted", "cancelled"],
  expired: ["quoted", "cancelled"],
};

export function getAllowedNextStatuses(
  orderType: OrderType,
  currentStatus: OrderStatus
): OrderStatus[] {
  if (orderType === "fixed") {
    return FIXED_TRANSITIONS[currentStatus as FixedOrderStatus] ?? [];
  }
  return CUSTOM_TRANSITIONS[currentStatus as CustomOrderStatus] ?? [];
}

export function isValidStatusTransition(
  orderType: OrderType,
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  if (fromStatus === toStatus) return false;
  const allowed = getAllowedNextStatuses(orderType, fromStatus);
  return allowed.includes(toStatus);
}

export type BadgeTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "primary";

export interface StatusDisplayMeta {
  label: string;
  tone: BadgeTone;
}

/**
 * Single source of truth for all order, quote, and payment status labels and visual tones.
 */
export const STATUS_META: Record<
  OrderStatus | PaymentStatus | QuoteStatus,
  StatusDisplayMeta
> = {
  // Order statuses
  pending: { label: "Pending Review", tone: "warning" },
  quote_requested: { label: "Quote Requested", tone: "warning" },
  quoted: { label: "Quote Sent", tone: "info" },
  confirmed: { label: "Confirmed", tone: "primary" },
  preparing: { label: "In Kitchen", tone: "info" },
  out_for_delivery: { label: "Out for Delivery", tone: "primary" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  declined: { label: "Quote Declined", tone: "danger" },
  expired: { label: "Quote Expired", tone: "neutral" },

  // Payment statuses
  unpaid: { label: "Unpaid", tone: "warning" },
  advance_paid: { label: "Advance Paid", tone: "info" },
  paid: { label: "Paid in Full", tone: "success" },

  // Quote-specific statuses
  sent: { label: "Awaiting Customer", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  superseded: { label: "Superseded", tone: "neutral" },
};
