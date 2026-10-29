"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, AlertCircle, ShieldCheck } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import {
  DELIVERY_SLOTS,
  evaluateDeliverySlotEligibility,
  getUpcomingKarachiDates,
} from "@/lib/lead-time";
import { formatPKR } from "@/lib/format";
import { STRINGS } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import {
  DatePicker,
  PhoneInput,
  SelectField,
  SubmitButton,
  TextArea,
  TextInput,
  TimeSlotPicker,
} from "@/components/shared/form-fields";
import {
  EmptyState,
  PageHeader,
  PriceText,
} from "@/components/shared/display-components";
import { Container, Section } from "@/components/shared/layouts";
import type { PaymentMethod, StoreSettings } from "@/types";

export function CheckoutClient({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { items, subtotalPkr, clearCart } = useCart();

  // Find default earliest valid date + slot
  const defaultSchedule = React.useMemo(() => {
    const dates = getUpcomingKarachiDates(14);
    for (const d of dates) {
      for (const s of DELIVERY_SLOTS) {
        if (
          evaluateDeliverySlotEligibility({
            deliveryDate: d,
            deliverySlot: s.id,
            minLeadTimeHours: settings.min_lead_time_hours,
            samedayCutoffTime: settings.sameday_cutoff_time,
          }).valid
        ) {
          return { date: d, slot: s.id };
        }
      }
    }
    return { date: dates[1] ?? dates[0] ?? "", slot: DELIVERY_SLOTS[1].id };
  }, [settings.min_lead_time_hours, settings.sameday_cutoff_time]);

  const [idempotencyKey] = React.useState(
    () => `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [deliveryArea, setDeliveryArea] = React.useState(
    settings.delivery_areas[0] ?? "Korangi"
  );
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState(defaultSchedule.date);
  const [deliverySlot, setDeliverySlot] = React.useState<string>(
    defaultSchedule.slot
  );
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("cod");
  const [honeypot, setHoneypot] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const totalPkr = subtotalPkr + settings.delivery_fee_pkr;
  const requiresCodAdvance =
    paymentMethod === "cod" && totalPkr > settings.cod_advance_threshold_pkr;
  const advanceAmountPkr = requiresCodAdvance
    ? Math.round((totalPkr * settings.default_advance_percent) / 100)
    : 0;

  if (items.length === 0) {
    return (
      <Section>
        <Container className="max-w-xl">
          <EmptyState
            title={STRINGS.cart.emptyTitle}
            description={STRINGS.cart.emptyDescription}
            action={
              <Button asChild>
                <Link href="/">Browse Menu</Link>
              </Button>
            }
          />
        </Container>
      </Section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customerName,
          customerPhone,
          deliveryArea,
          deliveryAddress,
          deliveryDate,
          deliverySlot,
          customerNotes,
          paymentMethod,
          honeypot,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantLabel: item.variantLabel,
            customText: item.customText,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: { order_code: string; tracking_token: string };
      };

      if (!response.ok || !data.order) {
        setErrorMessage(
          data.error || "Please verify your details and try again."
        );
        return;
      }

      clearCart();
      router.push(
        `/orders/confirmation/${encodeURIComponent(
          data.order.order_code
        )}?token=${encodeURIComponent(data.order.tracking_token)}`
      );
    } catch {
      setErrorMessage(STRINGS.common.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section>
      <Container className="space-y-6">
        <PageHeader
          title={STRINGS.checkout.title}
          subtitle={STRINGS.checkout.subtitle}
        />

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-12"
        >
          {/* Left column: Form sections */}
          <div className="space-y-6 lg:col-span-7">
            {/* Hidden Honeypot against automated bots */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">
                {STRINGS.checkout.customerSection}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label={STRINGS.checkout.nameLabel}
                  placeholder={STRINGS.checkout.namePlaceholder}
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <PhoneInput
                  label={STRINGS.checkout.phoneLabel}
                  placeholder={STRINGS.checkout.phonePlaceholder}
                  helperText={STRINGS.checkout.phoneHelper}
                  required
                  value={customerPhone}
                  onChange={setCustomerPhone}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">
                {STRINGS.checkout.deliverySection}
              </h2>

              <SelectField
                label={STRINGS.checkout.areaLabel}
                required
                value={deliveryArea}
                onChange={setDeliveryArea}
                options={settings.delivery_areas.map((a) => ({
                  value: a,
                  label: a,
                }))}
              />

              <TextArea
                label={STRINGS.checkout.addressLabel}
                placeholder={STRINGS.checkout.addressPlaceholder}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />

              <DatePicker
                label={STRINGS.checkout.dateLabel}
                required
                value={deliveryDate}
                onChange={setDeliveryDate}
                minLeadTimeHours={settings.min_lead_time_hours}
                samedayCutoffTime={settings.sameday_cutoff_time}
              />

              <TimeSlotPicker
                label={STRINGS.checkout.slotLabel}
                required
                deliveryDate={deliveryDate}
                value={deliverySlot}
                onChange={setDeliverySlot}
                minLeadTimeHours={settings.min_lead_time_hours}
                samedayCutoffTime={settings.sameday_cutoff_time}
              />

              <TextArea
                label={STRINGS.checkout.notesLabel}
                placeholder={STRINGS.checkout.notesPlaceholder}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">
                {STRINGS.checkout.paymentSection}
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/10"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <span>{STRINGS.checkout.codTitle}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {STRINGS.checkout.codDescription}
                  </p>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                    paymentMethod === "manual_transfer"
                      ? "border-primary bg-primary/10"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "manual_transfer"}
                      onChange={() => setPaymentMethod("manual_transfer")}
                    />
                    <span>{STRINGS.checkout.transferTitle}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {STRINGS.checkout.transferDescription}
                  </p>
                </label>
              </div>

              {(paymentMethod === "manual_transfer" || requiresCodAdvance) && (
                <div className="rounded-xl border border-primary/30 bg-secondary/60 p-4 text-xs space-y-2">
                  {requiresCodAdvance && (
                    <p className="flex items-center gap-1.5 font-semibold text-warning">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {STRINGS.checkout.advanceRequiredAlert} Advance Due:{" "}
                        {formatPKR(advanceAmountPkr)}
                      </span>
                    </p>
                  )}
                  <p className="font-semibold text-foreground">
                    Payment Transfer Instructions:
                  </p>
                  <p className="text-muted-foreground">
                    {settings.payment_instructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
              <h2 className="font-display text-lg font-semibold">
                Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} items)
              </h2>

              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {item.quantity}x {item.name}
                      </p>
                      {item.variantLabel && (
                        <p className="text-xs text-muted-foreground">
                          {item.variantLabel}
                        </p>
                      )}
                      {item.customText && (
                        <p className="text-xs italic text-primary">
                          &ldquo;{item.customText}&rdquo;
                        </p>
                      )}
                    </div>
                    <PriceText
                      amountPkr={item.unitPricePkr * item.quantity}
                      size="sm"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {STRINGS.cart.subtotal}
                  </span>
                  <PriceText amountPkr={subtotalPkr} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {STRINGS.cart.deliveryFee} ({deliveryArea})
                  </span>
                  <PriceText
                    amountPkr={settings.delivery_fee_pkr}
                    size="sm"
                  />
                </div>
                <div className="flex justify-between border-t pt-2.5 text-base font-bold">
                  <span>Total (Server Verified)</span>
                  <PriceText amountPkr={totalPkr} size="lg" />
                </div>
                {advanceAmountPkr > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Advance Required ({settings.default_advance_percent}%)</span>
                    <PriceText amountPkr={advanceAmountPkr} size="sm" />
                  </div>
                )}
              </div>

              <SubmitButton
                isLoading={isSubmitting}
                loadingText={STRINGS.checkout.submittingOrder}
                disabled={!settings.is_open}
                data-testid="place-order-submit"
                className="w-full py-6 text-base"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {STRINGS.checkout.placeOrderButton} — {formatPKR(totalPkr)}
                </span>
              </SubmitButton>

              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span>{STRINGS.checkout.firstTimeNotice}</span>
              </p>
            </div>
          </div>
        </form>
      </Container>
    </Section>
  );
}
