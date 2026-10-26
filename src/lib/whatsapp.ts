import { formatDateKarachi, formatPKR, toWhatsAppPhone } from "@/lib/format";
import type { Order, Quote } from "@/types";

/**
 * Single centralized WhatsApp wa.me URL builder.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = toWhatsAppPhone(phone);
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function buildOrderConfirmationWhatsAppMessage(
  order: Order,
  storeName: string,
  trackingUrl: string
): string {
  if (order.order_type === "custom" && order.custom_details) {
    return [
      `Assalam-o-Alaikum ${storeName}!`,
      `I just submitted a *Custom Cake Request*`,
      `Order Code: *${order.order_code}*`,
      `Name: ${order.customer_name}`,
      `Flavour: ${order.custom_details.flavour_name_snapshot}`,
      `Weight: ${order.custom_details.weight_label}`,
      `Delivery: ${formatDateKarachi(order.delivery_date)} (${order.delivery_slot})`,
      `Area: ${order.delivery_area}`,
      `Tracking Link: ${trackingUrl}`,
    ].join("\n");
  }

  const lines = order.items.map(
    (item) =>
      `• ${item.quantity}x ${item.product_name_snapshot}${
        item.variant_label_snapshot ? ` (${item.variant_label_snapshot})` : ""
      } — ${formatPKR(item.line_total_pkr)}`
  );

  return [
    `Assalam-o-Alaikum ${storeName}!`,
    `I just placed an order *${order.order_code}*`,
    `Name: ${order.customer_name}`,
    ...lines,
    `Total: *${formatPKR(order.total_pkr)}* (incl. delivery)`,
    order.advance_required_pkr > 0
      ? `Advance Required: ${formatPKR(order.advance_required_pkr)}`
      : `Payment: ${order.payment_method === "cod" ? "Cash on Delivery" : "Bank / Wallet Transfer"}`,
    `Delivery: ${formatDateKarachi(order.delivery_date)} (${order.delivery_slot}) — ${order.delivery_area}`,
    `Tracking Link: ${trackingUrl}`,
  ].join("\n");
}

export function buildQuoteQuestionWhatsAppMessage(
  orderCode: string,
  quote: Quote,
  storeName: string
): string {
  return [
    `Assalam-o-Alaikum ${storeName}!`,
    `I have a question regarding Quote v${quote.version} (${formatPKR(quote.total_pkr)}) for my custom cake order *${orderCode}*.`,
  ].join("\n");
}

export function buildAdminToCustomerWhatsAppMessage(
  order: Order,
  storeName: string,
  appUrl: string,
  latestQuote?: Quote
): string {
  const trackingUrl = `${appUrl}/track/${order.tracking_token}`;
  if (order.order_type === "custom" && latestQuote && order.status === "quoted") {
    const quoteUrl = `${appUrl}/quotes/${latestQuote.quote_token}`;
    return [
      `Assalam-o-Alaikum ${order.customer_name}! This is *${storeName}*.`,
      `Your custom cake quote for order *${order.order_code}* is ready:`,
      `Total Price: *${formatPKR(latestQuote.total_pkr)}*`,
      `Required Advance: *${formatPKR(latestQuote.advance_pkr)}*`,
      `Review & Approve Here: ${quoteUrl}`,
    ].join("\n");
  }

  return [
    `Assalam-o-Alaikum ${order.customer_name}! This is *${storeName}*.`,
    `Update on your order *${order.order_code}*:`,
    `Current Status: *${order.status.replace(/_/g, " ").toUpperCase()}*`,
    `Delivery: ${formatDateKarachi(order.delivery_date)} (${order.delivery_slot})`,
    `Live Tracking: ${trackingUrl}`,
  ].join("\n");
}
