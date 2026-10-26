"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { formatDateKarachi, formatDateTimeKarachi } from "@/lib/format";
import { buildAdminToCustomerWhatsAppMessage } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { QuoteCard } from "@/components/shared/cards";
import {
  CopyButton,
  EmptyState,
  FilterBar,
  PageHeader,
  PriceText,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import {
  NumberInput,
  PriceInput,
  SubmitButton,
  TextArea,
} from "@/components/shared/form-fields";
import { useToast } from "@/components/shared/toast";
import type { Order, StoreSettings } from "@/types";

export function AdminQuotesClient({
  initialCustomOrders,
  settings,
}: {
  initialCustomOrders: Order[];
  settings: StoreSettings;
}) {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<Order[]>(initialCustomOrders);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Selected custom order for quote modal/drawer
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);
  const [pricePkr, setPricePkr] = React.useState(5500);
  const [advancePkr, setAdvancePkr] = React.useState(2925);
  const [validityHours, setValidityHours] = React.useState(
    settings.quote_validity_hours
  );
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Expire confirmation dialog
  const [expireTarget, setExpireTarget] = React.useState<Order | null>(null);

  const openQuoteModal = (order: Order) => {
    setActiveOrder(order);
    const latestQuote = order.quotes?.[order.quotes.length - 1];
    const initialPrice = latestQuote?.price_pkr ?? 5500;
    const totalWithDelivery = initialPrice + settings.delivery_fee_pkr;
    const defaultAdv = Math.round(
      (totalWithDelivery * settings.default_advance_percent) / 100
    );

    setPricePkr(initialPrice);
    setAdvancePkr(latestQuote?.advance_pkr ?? defaultAdv);
    setValidityHours(settings.quote_validity_hours);
    setNotes(latestQuote?.notes ?? "");
  };

  const handlePriceChange = (nextPricePkr: number) => {
    setPricePkr(nextPricePkr);
    const total = nextPricePkr + settings.delivery_fee_pkr;
    setAdvancePkr(
      Math.round((total * settings.default_advance_percent) / 100)
    );
  };

  const refreshCustomOrders = async () => {
    const res = await fetch("/api/admin/quotes");
    const data = (await res.json()) as { orders: Order[] };
    if (res.ok && data.orders) {
      setOrders(data.orders);
      if (activeOrder) {
        const updated = data.orders.find((o) => o.id === activeOrder.id);
        if (updated) setActiveOrder(updated);
      }
    }
  };

  const handleSendOrReviseQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_or_revise",
          orderId: activeOrder.id,
          pricePkr,
          advancePkr,
          validityHours,
          notes,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not send quote.");
      }

      await refreshCustomOrders();
      toast({
        title: "Quote saved & ready to share",
        description: "Copy the tokenized quote link or send via WhatsApp.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to save quote",
        description: err instanceof Error ? err.message : "Error",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkExpired = async () => {
    if (!expireTarget) return;
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_expired",
          orderId: expireTarget.id,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not expire quote.");
      }

      await refreshCustomOrders();
      setExpireTarget(null);
      setActiveOrder(null);
      toast({ title: "Quote marked as expired", variant: "info" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed",
        variant: "error",
      });
    }
  };

  const filteredOrders = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
    );
  }, [orders, searchQuery]);

  const activeLatestQuote =
    activeOrder?.quotes?.[activeOrder.quotes.length - 1];
  const isApprovedImmutable = Boolean(
    activeLatestQuote?.is_immutable || activeLatestQuote?.status === "approved"
  );
  const appOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Cake Quote Requests"
        subtitle="Review reference photos, send itemized PKR quotes, or issue a new quote version."
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by Order Code, customer name, or phone..."
      />

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No custom cake requests found"
          description="Incoming custom cake inquiries will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredOrders.map((order) => {
            const latestQuote = order.quotes?.[order.quotes.length - 1];
            return (
              <QuoteCard
                key={order.id}
                order={order}
                latestQuote={latestQuote}
                onManageQuote={openQuoteModal}
              />
            );
          })}
        </div>
      )}

      {/* Quote Detail + Send/Revise Form inside ResponsiveDialog */}
      <ResponsiveDialog
        open={Boolean(activeOrder)}
        onOpenChange={(open) => {
          if (!open) setActiveOrder(null);
        }}
        size="lg"
      >
        <ResponsiveDialogContent ariaLabel="Manage Custom Cake Quote">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Custom Cake Request {activeOrder?.order_code}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Customer: {activeOrder?.customer_name} (
              {activeOrder?.customer_phone}) • Delivery:{" "}
              {activeOrder ? formatDateKarachi(activeOrder.delivery_date) : ""}{" "}
              ({activeOrder?.delivery_slot})
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {activeOrder && (
            <form
              onSubmit={handleSendOrReviseQuote}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <ResponsiveDialogBody className="space-y-5">
                {/* Request Specs */}
                {activeOrder.custom_details && (
                  <div className="rounded-xl border bg-secondary/40 p-4 text-xs space-y-1.5">
                    <div className="flex flex-wrap gap-3">
                      <span>
                        <strong>Flavour:</strong>{" "}
                        {activeOrder.custom_details.flavour_name_snapshot}
                      </span>
                      <span>
                        <strong>Weight:</strong>{" "}
                        {activeOrder.custom_details.weight_label}
                      </span>
                      {activeOrder.custom_details.theme_text && (
                        <span>
                          <strong>Plaque Message:</strong> &ldquo;
                          {activeOrder.custom_details.theme_text}&rdquo;
                        </span>
                      )}
                    </div>
                    <p className="pt-1 text-foreground">
                      <strong>Design & Theme:</strong>{" "}
                      {activeOrder.custom_details.design_description}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Delivery Address:</strong>{" "}
                      {activeOrder.delivery_address} ({activeOrder.delivery_area}
                      )
                    </p>
                  </div>
                )}

                {/* Private Reference Photos (Signed Admin URLs) */}
                {activeOrder.reference_images &&
                  activeOrder.reference_images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer Reference Photos (Private Signed URLs)
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {activeOrder.reference_images.map((img, i) => (
                          <div
                            key={img.id}
                            className="overflow-hidden rounded-lg border bg-muted"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.signed_url || "/logo.svg"}
                              alt={`Reference ${i + 1}`}
                              className="h-24 w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Existing Quote Versions & Tokenized Link */}
                {activeLatestQuote && (
                  <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          Active Quote v{activeLatestQuote.version}
                        </span>
                        <StatusBadge status={activeLatestQuote.status} />
                      </div>
                      <span className="text-muted-foreground">
                        Valid until:{" "}
                        {formatDateTimeKarachi(activeLatestQuote.valid_until)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <code className="truncate rounded bg-card px-2 py-1 text-[11px]">
                        {`${appOrigin}/quotes/${activeLatestQuote.quote_token}`}
                      </code>
                      <div className="flex items-center gap-2">
                        <CopyButton
                          text={`${appOrigin}/quotes/${activeLatestQuote.quote_token}`}
                          label="Copy Quote Link"
                        />
                        <WhatsAppButton
                          phone={activeOrder.customer_phone}
                          message={buildAdminToCustomerWhatsAppMessage(
                            activeOrder,
                            settings.store_name,
                            appOrigin,
                            activeLatestQuote
                          )}
                          label="WhatsApp Quote to Customer"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isApprovedImmutable ? (
                  <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-xs font-medium text-success">
                    This quote was approved by the customer and is permanently
                    locked (immutable). Manage preparation and delivery on the
                    Orders page.
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl border p-4">
                    <p className="text-sm font-semibold">
                      {activeLatestQuote
                        ? `Issue Revised Quote (Creates v${
                            activeLatestQuote.version + 1
                          } & Supersedes v${activeLatestQuote.version})`
                        : "Send Initial Price Quote"}
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <PriceInput
                        label="Custom Cake Price (PKR)"
                        required
                        value={pricePkr}
                        onChange={handlePriceChange}
                      />
                      <PriceInput
                        label="Required Advance (PKR)"
                        required
                        value={advancePkr}
                        onChange={setAdvancePkr}
                      />
                      <NumberInput
                        label="Validity (Hours)"
                        required
                        value={validityHours}
                        onChange={setValidityHours}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Total with Karachi delivery (
                      <PriceText
                        amountPkr={settings.delivery_fee_pkr}
                        size="sm"
                      />
                      ):{" "}
                      <PriceText
                        amountPkr={pricePkr + settings.delivery_fee_pkr}
                        size="md"
                      />
                    </p>

                    <TextArea
                      label="Baker Note to Customer (Optional)"
                      placeholder="e.g. Includes 3D fondant crown & Belgian couverture filling..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                )}
              </ResponsiveDialogBody>

              <ResponsiveDialogFooter>
                {activeLatestQuote && !isApprovedImmutable && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setExpireTarget(activeOrder)}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Mark Expired</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveOrder(null)}
                >
                  Close
                </Button>
                {!isApprovedImmutable && (
                  <SubmitButton
                    isLoading={isSubmitting}
                    data-testid="send-quote-submit"
                  >
                    {activeLatestQuote
                      ? `Send Revised Quote (v${
                          activeLatestQuote.version + 1
                        })`
                      : "Generate & Save Quote"}
                  </SubmitButton>
                )}
              </ResponsiveDialogFooter>
            </form>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Mark Expired Confirmation via ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(expireTarget)}
        onOpenChange={(open) => {
          if (!open) setExpireTarget(null);
        }}
        title="Mark Quote Expired?"
        description="The customer will no longer be able to approve this quote link."
        variant="destructive"
        confirmLabel="Mark Expired"
        onConfirm={handleMarkExpired}
      />
    </div>
  );
}
