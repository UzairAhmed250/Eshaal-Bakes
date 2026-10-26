"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Calendar, MapPin, Sparkles } from "lucide-react";
import { formatDateKarachi, formatOrderCode } from "@/lib/format";
import { STRINGS } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import {
  OrderStatusTimeline,
  PageHeader,
  PriceText,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import {
  PhoneInput,
  SubmitButton,
  TextInput,
} from "@/components/shared/form-fields";
import { Container, Section } from "@/components/shared/layouts";
import type { SanitizedTrackedOrder } from "@/lib/store-db";
import type { StoreSettings } from "@/types";

export function TrackOrderClient({
  settings,
  initialOrder,
}: {
  settings: StoreSettings;
  initialOrder: SanitizedTrackedOrder | null;
}) {
  const [orderCode, setOrderCode] = React.useState(
    initialOrder?.order_code ?? ""
  );
  const [phone, setPhone] = React.useState("");
  const [order, setOrder] = React.useState<SanitizedTrackedOrder | null>(
    initialOrder
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, phone }),
      });

      const data = (await res.json()) as {
        error?: string;
        order?: SanitizedTrackedOrder;
      };
      if (!res.ok || !data.order) {
        setOrder(null);
        setErrorMessage(data.error || STRINGS.tracking.notFoundError);
        return;
      }

      setOrder(data.order);
    } catch {
      setErrorMessage(STRINGS.common.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Section>
      <Container className="max-w-3xl space-y-6">
        <PageHeader
          title={STRINGS.tracking.title}
          subtitle={STRINGS.tracking.subtitle}
        />

        {/* Lookup Form (shown when no token or when user wants to look up another code) */}
        <form
          onSubmit={handleLookup}
          className="rounded-2xl border bg-card p-5 shadow-xs space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label={STRINGS.tracking.orderCodeLabel}
              placeholder={STRINGS.tracking.orderCodePlaceholder}
              required
              value={orderCode}
              onChange={(e) => setOrderCode(formatOrderCode(e.target.value))}
            />
            <PhoneInput
              label={STRINGS.checkout.phoneLabel}
              placeholder={STRINGS.checkout.phonePlaceholder}
              required
              value={phone}
              onChange={setPhone}
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end">
            <SubmitButton
              isLoading={isLoading}
              loadingText="Searching..."
              data-testid="track-lookup-submit"
            >
              <Search className="h-4 w-4" />
              <span>{STRINGS.tracking.lookupButton}</span>
            </SubmitButton>
          </div>
        </form>

        {/* Sanitized Tracking Result (no sensitive full address or full phone) */}
        {order && (
          <div
            data-testid="tracked-order-card"
            className="space-y-6 rounded-2xl border bg-card p-6 shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-primary">
                    {order.order_code}
                  </span>
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.payment_status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customer: <strong>{order.customer_first_name}</strong>
                </p>
              </div>

              <div className="text-right">
                <PriceText amountPkr={order.total_pkr} size="lg" />
                <p className="text-xs text-muted-foreground">
                  {order.order_type === "custom"
                    ? "Custom Cake Order"
                    : "Menu Order"}
                </p>
              </div>
            </div>

            {/* If custom order has an active quote awaiting customer approval, highlight link */}
            {order.active_quote_token && order.status === "quoted" && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-5 w-5" />
                  <span>
                    Your custom cake price quote is ready for your approval!
                  </span>
                </div>
                <Button asChild size="sm">
                  <Link href={`/quotes/${order.active_quote_token}`}>
                    Review & Approve Quote
                  </Link>
                </Button>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h2 className="mb-3 font-display text-base font-semibold">
                Kitchen & Delivery Status Timeline
              </h2>
              <OrderStatusTimeline
                orderType={order.order_type}
                currentStatus={order.status}
                history={order.status_history.map((h, i) => ({
                  id: String(i),
                  order_id: order.order_code,
                  from_status: null,
                  to_status: h.to_status,
                  note: h.note,
                  changed_by: null,
                  created_at: h.created_at,
                }))}
              />
            </div>

            {/* Schedule & Items Summary */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border bg-background p-4 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  <strong>Delivery Date:</strong>{" "}
                  {formatDateKarachi(order.delivery_date)} (
                  {order.delivery_slot})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  <strong>Neighborhood:</strong> {order.delivery_area}
                </span>
              </div>
            </div>

            {order.order_type === "fixed" ? (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ordered Items
                </p>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {item.quantity}x {item.product_name_snapshot}{" "}
                      {item.variant_label_snapshot
                        ? `(${item.variant_label_snapshot})`
                        : ""}
                    </span>
                    <PriceText amountPkr={item.line_total_pkr} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              order.custom_details && (
                <div className="space-y-1 border-t pt-4 text-xs">
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Custom Cake Details
                  </p>
                  <p>
                    <strong>Flavour & Weight:</strong>{" "}
                    {order.custom_details.flavour_name_snapshot} •{" "}
                    {order.custom_details.weight_label}
                  </p>
                  <p>
                    <strong>Design:</strong>{" "}
                    {order.custom_details.design_description}
                  </p>
                </div>
              )
            )}

            <div className="flex justify-end border-t pt-4">
              <WhatsAppButton
                phone={settings.whatsapp_number}
                message={`Assalam-o-Alaikum ${settings.store_name}! Following up on my order ${order.order_code}.`}
                label="Message Baker on WhatsApp"
                size="sm"
              />
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
