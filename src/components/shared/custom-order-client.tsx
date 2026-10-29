"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import {
  DELIVERY_SLOTS,
  evaluateDeliverySlotEligibility,
  getUpcomingKarachiDates,
} from "@/lib/lead-time";
import { formatPKR } from "@/lib/format";
import { STRINGS } from "@/lib/strings";
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
  ImageUploader,
  type UploadedImageItem,
} from "@/components/shared/image-uploader";
import { PageHeader } from "@/components/shared/display-components";
import { Container, Section } from "@/components/shared/layouts";
import type { Flavour, StoreSettings } from "@/types";

export function CustomOrderClient({
  settings,
  flavours,
}: {
  settings: StoreSettings;
  flavours: Flavour[];
}) {
  const router = useRouter();

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
    () => `cust-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
  const [flavourId, setFlavourId] = React.useState(flavours[0]?.id ?? "");
  const [weightLabel, setWeightLabel] = React.useState<string>(
    STRINGS.customOrder.weightOptions[1].value
  );
  const [themeText, setThemeText] = React.useState("");
  const [designDescription, setDesignDescription] = React.useState("");
  const [uploadedPhotos, setUploadedPhotos] = React.useState<
    UploadedImageItem[]
  >([]);
  const [deliveryDate, setDeliveryDate] = React.useState(defaultSchedule.date);
  const [deliverySlot, setDeliverySlot] = React.useState<string>(
    defaultSchedule.slot
  );
  const [deliveryArea, setDeliveryArea] = React.useState(
    settings.delivery_areas[0] ?? "Korangi"
  );
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customerName,
          customerPhone,
          flavourId,
          weightLabel,
          themeText,
          designDescription,
          deliveryArea,
          deliveryAddress,
          deliveryDate,
          deliverySlot,
          customerNotes,
          honeypot,
          referenceImagePaths: uploadedPhotos.map((p) => ({
            storagePath: p.storagePath,
            mimeType: p.mimeType,
            sizeBytes: p.sizeBytes,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: { order_code: string; tracking_token: string };
      };

      if (!response.ok || !data.order) {
        setErrorMessage(
          data.error || "Please check your custom cake form and try again."
        );
        return;
      }

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
      <Container className="max-w-3xl space-y-6">
        <PageHeader
          title={STRINGS.customOrder.title}
          subtitle={STRINGS.customOrder.subtitle}
        />

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden Honeypot */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* 1. Cake Specifications */}
          <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">
              1. Cake Flavour, Weight & Design
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label={STRINGS.customOrder.flavourLabel}
                required
                value={flavourId}
                onChange={setFlavourId}
                options={flavours.map((f) => ({
                  value: f.id,
                  label:
                    f.price_modifier_pkr > 0
                      ? `${f.name} (+${formatPKR(f.price_modifier_pkr)}/lb)`
                      : f.name,
                }))}
              />

              <SelectField
                label={STRINGS.customOrder.weightLabel}
                required
                value={weightLabel}
                onChange={setWeightLabel}
                options={STRINGS.customOrder.weightOptions.map((w) => ({
                  value: w.value,
                  label: w.label,
                }))}
              />
            </div>

            <TextInput
              label={STRINGS.customOrder.themeTextLabel}
              placeholder={STRINGS.customOrder.themeTextPlaceholder}
              maxLength={80}
              value={themeText}
              onChange={(e) => setThemeText(e.target.value)}
            />

            <TextArea
              label={STRINGS.customOrder.designLabel}
              placeholder={STRINGS.customOrder.designPlaceholder}
              required
              value={designDescription}
              onChange={(e) => setDesignDescription(e.target.value)}
            />

            <ImageUploader
              label={STRINGS.customOrder.photosLabel}
              helperText={STRINGS.customOrder.photosHelper}
              maxFiles={4}
              maxSizeMB={5}
              value={uploadedPhotos}
              onChange={setUploadedPhotos}
            />
          </div>

          {/* 2. Delivery Date, Time & Karachi Location */}
          <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">
              2. Delivery Schedule & Karachi Location
            </h2>

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
              showSameDayBadge={true}
            />

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

            <TextArea
              label={STRINGS.checkout.notesLabel}
              placeholder={STRINGS.checkout.notesPlaceholder}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
          </div>

          {/* 3. Customer Contact */}
          <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">
              3. Your Contact Information
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

            <SubmitButton
              isLoading={isSubmitting}
              loadingText="Submitting Request..."
              disabled={!settings.is_open}
              data-testid="submit-custom-cake-request"
              className="w-full py-6 text-base"
            >
              <Sparkles className="h-4 w-4" />
              <span>{STRINGS.customOrder.submitRequestButton}</span>
            </SubmitButton>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>
                Reference photos are stored in a private bucket and never shared
                publicly.
              </span>
            </p>
          </div>
        </form>
      </Container>
    </Section>
  );
}
