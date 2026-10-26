"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatDateKarachi, formatDateTimeKarachi } from "@/lib/format";
import { buildQuoteQuestionWhatsAppMessage } from "@/lib/whatsapp";
import { STRINGS } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  PriceText,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import { Container, Section } from "@/components/shared/layouts";
import { useToast } from "@/components/shared/toast";
import type { CustomerQuoteLookupView } from "@/lib/store-db";

export function QuoteApprovalClient({
  initialView,
  token,
}: {
  initialView: CustomerQuoteLookupView;
  token: string;
}) {
  const { toast } = useToast();
  const [view, setView] = React.useState<CustomerQuoteLookupView>(initialView);
  const [remainingText, setRemainingText] = React.useState<string>("");
  const [isExpiredByClock, setIsExpiredByClock] = React.useState<boolean>(
    () => new Date(initialView.quote.valid_until).getTime() <= Date.now()
  );

  const [confirmAction, setConfirmAction] = React.useState<
    "approve" | "decline" | null
  >(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Live countdown timer
  React.useEffect(() => {
    const updateCountdown = () => {
      const diffMs =
        new Date(view.quote.valid_until).getTime() - Date.now();
      if (diffMs <= 0) {
        setIsExpiredByClock(true);
        setRemainingText("Expired");
        return;
      }

      setIsExpiredByClock(false);
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setRemainingText(`${hours}h ${minutes}m ${seconds}s remaining`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [view.quote.valid_until]);

  const canRespond =
    view.quote.status === "sent" &&
    !view.quote.is_immutable &&
    !isExpiredByClock;

  const handleConfirmDecision = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmAction }),
      });

      const data = (await res.json()) as CustomerQuoteLookupView & {
        error?: string;
      };
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not process quote response.");
      }

      setView(data);
      setConfirmAction(null);
      toast({
        title:
          confirmAction === "approve"
            ? STRINGS.quoteApproval.approvedTitle
            : STRINGS.quoteApproval.declinedTitle,
        variant: confirmAction === "approve" ? "success" : "info",
      });
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Failed",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const questionWhatsAppMessage = buildQuoteQuestionWhatsAppMessage(
    view.order.order_code,
    view.quote,
    view.store.store_name
  );

  return (
    <Section>
      <Container className="max-w-2xl">
        <div className="rounded-2xl border bg-card p-6 shadow-md sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-mono text-sm font-bold text-primary">
                  {view.order.order_code} • Quote v{view.quote.version}
                </span>
                <StatusBadge status={view.quote.status} />
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
                {STRINGS.quoteApproval.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Prepared for {view.order.customer_first_name}
              </p>
            </div>

            <div className="rounded-xl border bg-secondary/60 px-3.5 py-2 text-right text-xs">
              <p className="text-muted-foreground">
                {STRINGS.quoteApproval.validUntilLabel}
              </p>
              <p className="font-semibold text-foreground">
                {formatDateTimeKarachi(view.quote.valid_until)}
              </p>
              <p
                data-testid="quote-countdown"
                className="mt-0.5 inline-flex items-center gap-1 font-mono font-semibold text-primary"
              >
                <Clock className="h-3 w-3" />
                <span>{remainingText}</span>
              </p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 rounded-xl border bg-background p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {STRINGS.quoteApproval.priceLabel}
              </span>
              <PriceText amountPkr={view.quote.price_pkr} size="md" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {STRINGS.quoteApproval.deliveryFeeLabel} (
                {view.order.delivery_area})
              </span>
              <PriceText amountPkr={view.quote.delivery_fee_pkr} size="sm" />
            </div>
            <div className="flex justify-between border-t pt-2.5 text-base font-bold">
              <span>{STRINGS.quoteApproval.totalLabel}</span>
              <PriceText
                amountPkr={view.quote.total_pkr}
                size="lg"
                className="text-primary"
              />
            </div>
            <div className="flex justify-between rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              <span>{STRINGS.quoteApproval.advanceLabel}</span>
              <PriceText amountPkr={view.quote.advance_pkr} size="sm" />
            </div>
          </div>

          {/* Cake & Delivery Details */}
          <div className="space-y-2 rounded-xl border p-4 text-xs">
            <p className="font-semibold text-sm text-foreground">
              Delivery & Cake Specifications
            </p>
            <p>
              <strong>Delivery Date & Slot:</strong>{" "}
              {formatDateKarachi(view.order.delivery_date)} (
              {view.order.delivery_slot}) — {view.order.delivery_area}
            </p>
            {view.order.custom_details && (
              <>
                <p>
                  <strong>Flavour & Weight:</strong>{" "}
                  {view.order.custom_details.flavour_name_snapshot} •{" "}
                  {view.order.custom_details.weight_label}
                </p>
                {view.order.custom_details.theme_text && (
                  <p>
                    <strong>Message on Cake:</strong> &ldquo;
                    {view.order.custom_details.theme_text}&rdquo;
                  </p>
                )}
                <p>
                  <strong>Design Notes:</strong>{" "}
                  {view.order.custom_details.design_description}
                </p>
              </>
            )}
            {view.quote.notes && (
              <p className="mt-2 rounded bg-secondary/50 p-2.5 text-foreground">
                <strong>Baker&apos;s Note:</strong> {view.quote.notes}
              </p>
            )}
          </div>

          {/* Status or Action Buttons */}
          {view.quote.status === "approved" ? (
            <div className="space-y-3 rounded-xl border border-success/40 bg-success/10 p-4 text-xs">
              <p className="flex items-center gap-2 text-sm font-bold text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  Quote Approved! Your order is confirmed in our schedule.
                </span>
              </p>
              <p className="text-foreground">
                <strong>Payment Instructions for Advance:</strong>{" "}
                {view.store.payment_instructions}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="sm">
                  <Link
                    href={`/track/${view.order.tracking_token}`}
                    data-testid="quote-to-tracking-link"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open Live Order Tracking</span>
                  </Link>
                </Button>
                <WhatsAppButton
                  phone={view.store.whatsapp_number}
                  message={`Assalam-o-Alaikum! I have approved Quote v${view.quote.version} for order ${view.order.order_code}.`}
                  label="Share Payment Screenshot on WhatsApp"
                  size="sm"
                />
              </div>
            </div>
          ) : view.quote.status === "declined" ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>
                You declined this quote. If you&apos;d like to adjust the weight
                or design, message us on WhatsApp below.
              </span>
            </div>
          ) : !canRespond ? (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-xs font-medium text-warning">
              {STRINGS.quoteApproval.expiredBanner}
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                data-testid="approve-quote-button"
                onClick={() => setConfirmAction("approve")}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{STRINGS.quoteApproval.approveButton}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                data-testid="decline-quote-button"
                onClick={() => setConfirmAction("decline")}
              >
                <XCircle className="h-4 w-4 text-destructive" />
                <span>{STRINGS.quoteApproval.declineButton}</span>
              </Button>
            </div>
          )}

          <div className="border-t pt-4 flex justify-center">
            <WhatsAppButton
              phone={view.store.whatsapp_number}
              message={questionWhatsAppMessage}
              label={STRINGS.quoteApproval.askQuestionButton}
              size="sm"
            />
          </div>
        </div>

        {/* Approve / Decline Confirmation via ConfirmDialog (built on ResponsiveDialog) */}
        <ConfirmDialog
          open={Boolean(confirmAction)}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
          title={
            confirmAction === "approve"
              ? "Approve Quote & Confirm Order?"
              : "Decline This Quote?"
          }
          description={
            confirmAction === "approve"
              ? `By approving, your custom cake order ${view.order.order_code} will be confirmed at PKR ${view.quote.total_pkr.toLocaleString("en-PK")}.`
              : "The baker will be notified that you declined this quote."
          }
          variant={confirmAction === "decline" ? "destructive" : "default"}
          confirmLabel={
            confirmAction === "approve"
              ? "Yes, Approve Quote"
              : "Yes, Decline Quote"
          }
          isLoading={isProcessing}
          onConfirm={handleConfirmDecision}
        />
      </Container>
    </Section>
  );
}
