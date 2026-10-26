"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Sparkles, Calendar, MapPin, AlertCircle } from "lucide-react";
import { formatDateKarachi } from "@/lib/format";
import { STRINGS } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import {
  PriceText,
  StatusBadge,
} from "@/components/shared/display-components";
import type { Order, Product, Quote } from "@/types";

export interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
}

export function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const coverImage =
    product.images[0]?.url ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80";

  const isOutOfStock =
    product.track_inventory &&
    product.stock_quantity !== null &&
    product.stock_quantity <= 0;

  const isLowStock =
    product.track_inventory &&
    product.stock_quantity !== null &&
    product.stock_quantity > 0 &&
    product.stock_quantity <= 4;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs transition-all hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-4/3 overflow-hidden bg-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isOutOfStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
            {STRINGS.product.outOfStock}
          </span>
        ) : isLowStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-warning px-2.5 py-1 text-xs font-semibold text-warning-foreground">
            Only {product.stock_quantity} {STRINGS.product.lowStockSuffix}
          </span>
        ) : product.compare_at_price_pkr &&
          product.compare_at_price_pkr > product.price_pkr ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            Special Offer
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-1.5">
          {product.category_name && (
            <p className="text-xs font-medium text-primary">
              {product.category_name}
            </p>
          )}
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-1 font-display text-base font-semibold text-foreground hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
          <PriceText
            amountPkr={product.price_pkr}
            compareAtPkr={product.compare_at_price_pkr}
            size="md"
          />
          {onQuickAdd ? (
            <Button
              type="button"
              size="sm"
              disabled={isOutOfStock}
              onClick={() => onQuickAdd(product)}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{isOutOfStock ? "Sold Out" : "Add"}</span>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/products/${product.slug}`}>View</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface OrderCardProps {
  order: Order;
  onSelect?: (order: Order) => void;
}

export function OrderCard({ order, onSelect }: OrderCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary">
              {order.order_code}
            </span>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment_status} />
          </div>
          <p className="mt-1 text-sm font-semibold">{order.customer_name}</p>
          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
        </div>
        <div className="text-right">
          <PriceText amountPkr={order.total_pkr} size="md" />
          <p className="text-xs text-muted-foreground uppercase">
            {order.order_type === "custom" ? "Custom Cake" : "Menu Order"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateKarachi(order.delivery_date)} ({order.delivery_slot})
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {order.delivery_area}
        </span>
        {order.needs_confirmation && (
          <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
            <AlertCircle className="h-3 w-3" />
            First-time customer (Needs confirmation)
          </span>
        )}
      </div>

      {onSelect && (
        <div className="mt-3 flex justify-end border-t pt-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(order)}
          >
            Manage Order
          </Button>
        </div>
      )}
    </div>
  );
}

export interface QuoteCardProps {
  order: Order;
  latestQuote?: Quote;
  onManageQuote?: (order: Order) => void;
}

export function QuoteCard({
  order,
  latestQuote,
  onManageQuote,
}: QuoteCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-bold">
              {order.order_code}
            </span>
            <StatusBadge status={order.status} />
            {latestQuote && <StatusBadge status={latestQuote.status} />}
          </div>
          <p className="mt-1 text-sm font-semibold">{order.customer_name}</p>
          {order.custom_details && (
            <p className="text-xs text-muted-foreground">
              {order.custom_details.flavour_name_snapshot} •{" "}
              {order.custom_details.weight_label}
            </p>
          )}
        </div>
        {latestQuote ? (
          <div className="text-right">
            <PriceText amountPkr={latestQuote.total_pkr} size="md" />
            <p className="text-xs text-muted-foreground">
              Quote v{latestQuote.version} (Adv:{" "}
              <PriceText amountPkr={latestQuote.advance_pkr} size="sm" />)
            </p>
          </div>
        ) : (
          <span className="text-xs font-medium text-warning">
            Awaiting Baker Quote
          </span>
        )}
      </div>

      {order.custom_details && (
        <p className="mt-2 line-clamp-2 rounded-md bg-muted/60 p-2 text-xs text-foreground">
          {order.custom_details.design_description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
        <span>
          Delivery: {formatDateKarachi(order.delivery_date)} (
          {order.delivery_slot})
        </span>
        {onManageQuote && (
          <Button
            type="button"
            size="sm"
            onClick={() => onManageQuote(order)}
          >
            {latestQuote ? "View / Revise Quote" : "Send Quote"}
          </Button>
        )}
      </div>
    </div>
  );
}
