"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { formatDateKarachi, formatDateTimeKarachi } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PriceText, StatusBadge } from "@/components/shared/display-components";
import type { Order, StoreSettings } from "@/types";

export function PrintSlipClient({
  order,
  settings,
}: {
  order: Order;
  settings: StoreSettings;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="no-print flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </Link>
        </Button>
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          <span>Print Kitchen & Rider Slip</span>
        </Button>
      </div>

      <div className="rounded-xl border-2 border-foreground/20 bg-card p-6 text-foreground shadow-xs space-y-5">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {settings.store_name} — Order Dispatch Slip
            </h1>
            <p className="text-xs text-muted-foreground">
              Karachi, Pakistan • WhatsApp: +{settings.whatsapp_number}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-primary">
              {order.order_code}
            </p>
            <p className="text-xs text-muted-foreground">
              Created: {formatDateTimeKarachi(order.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Customer & Delivery
            </p>
            <p className="font-bold">{order.customer_name}</p>
            <p className="font-mono">{order.customer_phone}</p>
            <p className="font-semibold text-primary">{order.delivery_area}</p>
            <p className="text-xs">{order.delivery_address}</p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Schedule & Payment
            </p>
            <p className="font-bold">{formatDateKarachi(order.delivery_date)}</p>
            <p className="font-semibold">{order.delivery_slot} PKT</p>
            <div className="flex justify-end gap-2 pt-1">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.payment_status} />
            </div>
            <p className="text-xs uppercase">
              Method:{" "}
              {order.payment_method === "cod"
                ? "Cash on Delivery"
                : "Bank / Wallet Transfer"}
            </p>
          </div>
        </div>

        {order.order_type === "fixed" ? (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Kitchen Items Checklist
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5">Qty</th>
                  <th className="py-1.5">Item & Variant</th>
                  <th className="py-1.5">Plaque / Message</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 font-bold">{item.quantity}x</td>
                    <td className="py-2">
                      {item.product_name_snapshot}
                      {item.variant_label_snapshot
                        ? ` (${item.variant_label_snapshot})`
                        : ""}
                    </td>
                    <td className="py-2 italic">
                      {item.custom_text || "—"}
                    </td>
                    <td className="py-2 text-right">
                      <PriceText amountPkr={item.line_total_pkr} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          order.custom_details && (
            <div className="space-y-1.5 border-t pt-4 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Custom Cake Specification
              </p>
              <p>
                <strong>Flavour:</strong>{" "}
                {order.custom_details.flavour_name_snapshot}
              </p>
              <p>
                <strong>Weight:</strong> {order.custom_details.weight_label}
              </p>
              <p>
                <strong>Cake Message:</strong>{" "}
                {order.custom_details.theme_text || "None"}
              </p>
              <p>
                <strong>Design Instructions:</strong>{" "}
                {order.custom_details.design_description}
              </p>
            </div>
          )
        )}

        {order.customer_notes && (
          <div className="rounded border bg-muted/50 p-3 text-xs">
            <strong>Customer Delivery Note:</strong> {order.customer_notes}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4 text-base font-bold">
          <span>Total Amount (incl. Delivery)</span>
          <PriceText amountPkr={order.total_pkr} size="lg" />
        </div>
      </div>
    </div>
  );
}
