"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Printer, AlertCircle } from "lucide-react";
import { formatDateKarachi, formatDateTimeKarachi } from "@/lib/format";
import { getAllowedNextStatuses, STATUS_META } from "@/lib/status-machine";
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
import { OrderCard } from "@/components/shared/cards";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import {
  FilterBar,
  PageHeader,
  PriceText,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import {
  SelectField,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/shared/form-fields";
import { useToast } from "@/components/shared/toast";
import type { Order, OrderStatus, PaymentStatus, StoreSettings } from "@/types";

export function AdminOrdersClient({
  initialOrders,
  settings,
}: {
  initialOrders: Order[];
  settings: StoreSettings;
}) {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  // Active order detail & update modal/drawer
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);
  const [nextStatus, setNextStatus] = React.useState<OrderStatus>("pending");
  const [paymentStatus, setPaymentStatus] =
    React.useState<PaymentStatus>("unpaid");
  const [internalNotes, setInternalNotes] = React.useState("");
  const [cancellationReason, setCancellationReason] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);

  // ConfirmDialog when cancelling an order
  const [confirmCancelOpen, setConfirmCancelOpen] = React.useState(false);

  const openOrderModal = (order: Order) => {
    setActiveOrder(order);
    setNextStatus(order.status);
    setPaymentStatus(order.payment_status);
    setInternalNotes(order.internal_notes);
    setCancellationReason(order.cancellation_reason);
  };

  const executeOrderUpdate = async () => {
    if (!activeOrder) return;
    setIsUpdating(true);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          status: nextStatus,
          paymentStatus,
          internalNotes,
          cancellationReason,
        }),
      });

      const data = (await res.json()) as { error?: string; order?: Order };
      if (!res.ok || !data.order) {
        throw new Error(data.error || "Could not update order.");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === data.order!.id ? data.order! : o))
      );
      setActiveOrder(data.order);
      setConfirmCancelOpen(false);
      toast({
        title: `Order ${data.order.order_code} updated`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveOrderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (
      nextStatus === "cancelled" &&
      activeOrder.status !== "cancelled" &&
      !confirmCancelOpen
    ) {
      setConfirmCancelOpen(true);
      return;
    }

    await executeOrderUpdate();
  };

  const filteredOrders = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (dateFrom && o.delivery_date < dateFrom) return false;
      if (dateTo && o.delivery_date > dateTo) return false;
      if (q) {
        return (
          o.order_code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
        );
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFrom, dateTo]);

  const allowedStatusesForActive: OrderStatus[] = React.useMemo(() => {
    if (!activeOrder) return [];
    const nextAllowed = getAllowedNextStatuses(
      activeOrder.order_type,
      activeOrder.status
    );
    return [activeOrder.status, ...nextAllowed];
  }, [activeOrder]);

  const appOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const columns: DataTableColumn<Order>[] = [
    {
      key: "code",
      header: "Order Code",
      sortable: true,
      sortValue: (o) => o.order_code,
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-primary">
            {o.order_code}
          </span>
          <p className="text-[11px] uppercase text-muted-foreground">
            {o.order_type === "custom" ? "Custom Cake" : "Menu Order"}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      sortValue: (o) => o.customer_name,
      render: (o) => (
        <div>
          <p className="font-semibold">{o.customer_name}</p>
          <p className="text-xs text-muted-foreground">
            {o.customer_phone} • {o.delivery_area}
          </p>
          {o.needs_confirmation && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
              <AlertCircle className="h-3 w-3" />
              Needs Confirmation
            </span>
          )}
        </div>
      ),
    },
    {
      key: "delivery",
      header: "Delivery Slot",
      sortable: true,
      sortValue: (o) => o.delivery_date,
      render: (o) => (
        <div className="text-xs">
          <p className="font-medium">{formatDateKarachi(o.delivery_date)}</p>
          <p className="text-muted-foreground">{o.delivery_slot}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={o.status} />
          <StatusBadge status={o.payment_status} />
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      sortValue: (o) => o.total_pkr,
      render: (o) => <PriceText amountPkr={o.total_pkr} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (o) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openOrderModal(o)}
          >
            Manage
          </Button>
          <Button asChild variant="ghost" size="sm" aria-label="Print slip">
            <Link href={`/admin/orders/${o.id}/print`}>
              <Printer className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      <SelectField
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: "all", label: "All Statuses" },
          { value: "pending", label: "Pending" },
          { value: "quote_requested", label: "Quote Requested" },
          { value: "quoted", label: "Quote Sent" },
          { value: "confirmed", label: "Confirmed" },
          { value: "preparing", label: "In Kitchen" },
          { value: "out_for_delivery", label: "Out for Delivery" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        className="h-9 text-xs"
      />
      <TextInput
        type="date"
        aria-label="Delivery from date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="h-9 w-36 text-xs"
      />
      <TextInput
        type="date"
        aria-label="Delivery to date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="h-9 w-36 text-xs"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Management"
        subtitle="Filter orders by status or date range, update kitchen progress, message customers on WhatsApp, Print slips, or export CSV."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/api/admin/orders/export" download>
              <Download className="h-4 w-4" />
              <span>Export Orders CSV</span>
            </a>
          </Button>
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by Order Code (EB-...), customer name, or 03XX phone..."
        mobileFilterSheetContent={filterControls}
      >
        {filterControls}
      </FilterBar>

      <DataTable
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        renderMobileCard={(o) => (
          <OrderCard order={o} onSelect={openOrderModal} />
        )}
      />

      {/* Order Detail & Status Update inside ResponsiveDialog */}
      <ResponsiveDialog
        open={Boolean(activeOrder)}
        onOpenChange={(open) => {
          if (!open) setActiveOrder(null);
        }}
        size="lg"
      >
        <ResponsiveDialogContent ariaLabel="Manage Order">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Order {activeOrder?.order_code} — {activeOrder?.customer_name}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Phone: {activeOrder?.customer_phone} • Area:{" "}
              {activeOrder?.delivery_area}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {activeOrder && (
            <form
              onSubmit={handleSaveOrderForm}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <ResponsiveDialogBody className="space-y-5">
                {/* Summary & WhatsApp / Print Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-secondary/40 p-3.5 text-xs">
                  <div>
                    <p>
                      <strong>Delivery:</strong>{" "}
                      {formatDateKarachi(activeOrder.delivery_date)} (
                      {activeOrder.delivery_slot})
                    </p>
                    <p>
                      <strong>Address:</strong> {activeOrder.delivery_address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <WhatsAppButton
                      phone={activeOrder.customer_phone}
                      message={buildAdminToCustomerWhatsAppMessage(
                        activeOrder,
                        settings.store_name,
                        appOrigin,
                        activeOrder.quotes?.[activeOrder.quotes.length - 1]
                      )}
                      label="WhatsApp Customer"
                      size="sm"
                    />
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${activeOrder.id}/print`}>
                        <Printer className="h-3.5 w-3.5" />
                        <span>Printable Slip</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Line Items or Custom Details */}
                {activeOrder.order_type === "fixed" ? (
                  <div className="rounded-xl border p-3.5 text-xs space-y-2">
                    <p className="font-semibold text-sm">Ordered Items</p>
                    {activeOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between border-b pb-1.5 last:border-0"
                      >
                        <span>
                          {item.quantity}x {item.product_name_snapshot}{" "}
                          {item.variant_label_snapshot
                            ? `(${item.variant_label_snapshot})`
                            : ""}
                          {item.custom_text
                            ? ` — Message: "${item.custom_text}"`
                            : ""}
                        </span>
                        <PriceText amountPkr={item.line_total_pkr} size="sm" />
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 font-bold text-sm">
                      <span>Total (incl. delivery)</span>
                      <PriceText amountPkr={activeOrder.total_pkr} size="md" />
                    </div>
                  </div>
                ) : (
                  activeOrder.custom_details && (
                    <div className="rounded-xl border p-3.5 text-xs space-y-1">
                      <p className="font-semibold text-sm">
                        Custom Cake Details
                      </p>
                      <p>
                        <strong>Flavour:</strong>{" "}
                        {activeOrder.custom_details.flavour_name_snapshot} (
                        {activeOrder.custom_details.weight_label})
                      </p>
                      <p>
                        <strong>Design:</strong>{" "}
                        {activeOrder.custom_details.design_description}
                      </p>
                    </div>
                  )
                )}

                {/* Status & Payment Controls (valid server transitions only) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Order Status (Valid Transitions Enforced)"
                    value={nextStatus}
                    onChange={(v) => setNextStatus(v as OrderStatus)}
                    options={allowedStatusesForActive.map((st) => ({
                      value: st,
                      label: STATUS_META[st]?.label ?? st,
                    }))}
                  />

                  <SelectField
                    label="Payment Status"
                    value={paymentStatus}
                    onChange={(v) => setPaymentStatus(v as PaymentStatus)}
                    options={[
                      { value: "unpaid", label: "Unpaid" },
                      { value: "advance_paid", label: "Advance Paid" },
                      { value: "paid", label: "Paid in Full" },
                    ]}
                  />
                </div>

                {nextStatus === "cancelled" && (
                  <TextInput
                    label="Cancellation Reason"
                    required
                    placeholder="e.g. Customer requested date change / slot full"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  />
                )}

                <TextArea
                  label="Internal Kitchen / Rider Notes (Private to Admin)"
                  placeholder="e.g. Verified Easypaisa screenshot #99182; rider Kamran assigned"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />

                {/* Status History with Timestamps */}
                <div className="space-y-2 rounded-xl border bg-muted/40 p-3.5 text-xs">
                  <p className="font-semibold">Status History Log</p>
                  <div className="space-y-1.5">
                    {activeOrder.status_history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-muted-foreground"
                      >
                        <span>
                          <strong className="text-foreground">
                            {STATUS_META[h.to_status]?.label ?? h.to_status}
                          </strong>{" "}
                          — {h.note}
                        </span>
                        <span>{formatDateTimeKarachi(h.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResponsiveDialogBody>

              <ResponsiveDialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveOrder(null)}
                >
                  Close
                </Button>
                <SubmitButton isLoading={isUpdating}>
                  Save Order Changes
                </SubmitButton>
              </ResponsiveDialogFooter>
            </form>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Cancel Order Confirmation via ConfirmDialog */}
      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title={`Cancel Order ${activeOrder?.order_code ?? ""}?`}
        description="Cancelling an order is a terminal status transition and cannot be undone."
        variant="destructive"
        confirmLabel="Yes, Cancel Order"
        isLoading={isUpdating}
        onConfirm={executeOrderUpdate}
      />
    </div>
  );
}
