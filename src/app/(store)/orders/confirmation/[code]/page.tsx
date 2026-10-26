import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import {
  getAdminOrders,
  getStoreSettings,
} from "@/lib/store-db";
import { getPublicEnv } from "@/lib/env";
import { formatDateKarachi } from "@/lib/format";
import { buildOrderConfirmationWhatsAppMessage } from "@/lib/whatsapp";
import { STRINGS } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  PriceText,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import { Container, Section } from "@/components/shared/layouts";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { code } = await params;
  const { token } = await searchParams;
  const settings = getStoreSettings();
  const env = getPublicEnv();

  const decodedCode = decodeURIComponent(code).toUpperCase();
  const order = getAdminOrders().find(
    (o) =>
      o.order_code.toUpperCase() === decodedCode &&
      (!token || o.tracking_token === token)
  );

  if (!order) {
    notFound();
  }

  const trackingPath = `/track/${order.tracking_token}`;
  const fullTrackingUrl = `${env.NEXT_PUBLIC_APP_URL}${trackingPath}`;
  const whatsappMessage = buildOrderConfirmationWhatsAppMessage(
    order,
    settings.store_name,
    fullTrackingUrl
  );

  return (
    <Section>
      <Container className="max-w-2xl">
        <div className="rounded-2xl border bg-card p-6 shadow-md sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {order.order_type === "custom"
                ? STRINGS.confirmation.customRequestTitle
                : STRINGS.confirmation.orderTitle}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">
              {STRINGS.confirmation.saveLinkNotice}
            </p>
          </div>

          {/* Order Code & Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-secondary/50 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {STRINGS.confirmation.orderCodeLabel}
              </p>
              <p
                data-testid="confirmation-order-code"
                className="font-mono text-2xl font-bold text-primary"
              >
                {order.order_code}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <CopyButton text={order.order_code} label="Copy Code" />
            </div>
          </div>

          {/* Delivery & Payment Details */}
          <div className="space-y-3 rounded-xl border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Schedule</span>
              <span className="font-semibold">
                {formatDateKarachi(order.delivery_date)} ({order.delivery_slot})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Karachi Area</span>
              <span className="font-semibold">{order.delivery_area}</span>
            </div>

            {order.order_type === "fixed" ? (
              <>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Order Total</span>
                  <PriceText amountPkr={order.total_pkr} size="md" />
                </div>
                {order.advance_required_pkr > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Advance Payment Required</span>
                    <PriceText amountPkr={order.advance_required_pkr} size="sm" />
                  </div>
                )}
              </>
            ) : (
              order.custom_details && (
                <div className="border-t pt-2 space-y-1 text-xs">
                  <p>
                    <strong>Flavour:</strong>{" "}
                    {order.custom_details.flavour_name_snapshot} (
                    {order.custom_details.weight_label})
                  </p>
                  <p>
                    <strong>Theme / Design:</strong>{" "}
                    {order.custom_details.design_description}
                  </p>
                </div>
              )
            )}
          </div>

          {(order.payment_method === "manual_transfer" ||
            order.advance_required_pkr > 0) && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs space-y-1">
              <p className="font-semibold text-foreground">
                Payment Instructions:
              </p>
              <p className="text-muted-foreground">
                {settings.payment_instructions}
              </p>
            </div>
          )}

          {/* Primary Actions: WhatsApp & Private Tracking Link */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton
              phone={settings.whatsapp_number}
              message={whatsappMessage}
              label={STRINGS.confirmation.sendOnWhatsApp}
              size="lg"
              className="flex-1"
            />
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href={trackingPath} data-testid="open-tracking-link">
                <ExternalLink className="h-4 w-4" />
                <span>{STRINGS.confirmation.openTrackingPage}</span>
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
            <span className="truncate font-mono text-muted-foreground">
              {fullTrackingUrl}
            </span>
            <CopyButton
              text={fullTrackingUrl}
              label={STRINGS.confirmation.copyTrackingLink}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
