"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import {
  Check,
  Copy,
  MessageCircle,
  AlertOctagon,
  PackageOpen,
  Search,
  SlidersHorizontal,
  ZoomIn,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeKarachi, formatPKR } from "@/lib/format";
import { STATUS_META, type BadgeTone } from "@/lib/status-machine";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { STRINGS } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type {
  OrderStatus,
  OrderStatusHistoryEntry,
  OrderType,
  PaymentStatus,
  ProductImage,
  QuoteStatus,
} from "@/types";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        info: "border-info/30 bg-info/15 text-info",
        warning: "border-warning/30 bg-warning/15 text-warning",
        success: "border-success/30 bg-success/15 text-success",
        danger: "border-destructive/30 bg-destructive/15 text-destructive",
        primary: "border-primary/30 bg-primary/15 text-primary",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | QuoteStatus;
  className?: string;
}

/**
 * Single centralized badge mapping for all Order, Quote, and Payment statuses.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? {
    label: String(status),
    tone: "neutral" as BadgeTone,
  };
  return (
    <span
      data-status={status}
      className={cn(statusBadgeVariants({ tone: meta.tone }), className)}
    >
      {meta.label}
    </span>
  );
}

export interface PriceTextProps {
  amountPkr: number;
  compareAtPkr?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const priceSizeVariants = cva("font-semibold tracking-tight text-foreground", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-2xl font-bold",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export function PriceText({
  amountPkr,
  compareAtPkr,
  size = "md",
  className,
}: PriceTextProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={priceSizeVariants({ size })}>{formatPKR(amountPkr)}</span>
      {compareAtPkr && compareAtPkr > amountPkr ? (
        <span className="text-xs font-normal text-muted-foreground line-through">
          {formatPKR(compareAtPkr)}
        </span>
      ) : null}
    </span>
  );
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 text-card-foreground shadow-xs",
        highlight && "border-primary/40 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        {icon ?? <PackageOpen className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to load content",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-8 text-center",
        className
      )}
    >
      <AlertOctagon className="mb-2 h-8 w-8 text-destructive" aria-hidden="true" />
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export function SkeletonLoader({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 w-full animate-pulse rounded-xl bg-muted"
        />
      ))}
    </div>
  );
}

export interface WhatsAppButtonProps {
  phone: string;
  message: string;
  label?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function WhatsAppButton({
  phone,
  message,
  label = STRINGS.confirmation.sendOnWhatsApp,
  size = "default",
  className,
}: WhatsAppButtonProps) {
  const href = buildWhatsAppLink(phone, message);
  return (
    <Button
      asChild
      variant="whatsapp"
      size={size}
      className={cn("font-semibold", className)}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </a>
    </Button>
  );
}

export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  label = STRINGS.common.copy,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures in restricted environments
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-success" />
          <span>{STRINGS.common.copied}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}

export interface OrderStatusTimelineProps {
  orderType: OrderType;
  currentStatus: OrderStatus;
  history: OrderStatusHistoryEntry[];
}

const FIXED_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const CUSTOM_STEPS: OrderStatus[] = [
  "quote_requested",
  "quoted",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function OrderStatusTimeline({
  orderType,
  currentStatus,
  history,
}: OrderStatusTimelineProps) {
  const steps = orderType === "fixed" ? FIXED_STEPS : CUSTOM_STEPS;
  const currentIdx = steps.indexOf(currentStatus);
  const isTerminalNegative =
    currentStatus === "cancelled" ||
    currentStatus === "declined" ||
    currentStatus === "expired";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const isCompleted = !isTerminalNegative && currentIdx >= index;
          const isCurrent = !isTerminalNegative && currentIdx === index;
          const meta = STATUS_META[step];
          const historyEntry = history.find((h) => h.to_status === step);

          return (
            <div
              key={step}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-xs",
                isCurrent && "border-primary bg-primary/10",
                isCompleted && !isCurrent && "border-success/30 bg-success/5",
                !isCompleted && "bg-card text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">{meta.label}</p>
                {historyEntry && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateTimeKarachi(historyEntry.created_at)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isTerminalNegative && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>
            Order status: <strong>{STATUS_META[currentStatus].label}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

export interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Product image gallery with thumbnail selector and ResponsiveDialog zoom preview.
 */
export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [zoomOpen, setZoomOpen] = React.useState(false);

  const safeImages =
    images.length > 0
      ? images
      : [
          {
            id: "placeholder",
            product_id: "",
            url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
            alt_text: productName,
            sort_order: 0,
          },
        ];

  const activeImage = safeImages[activeIndex] ?? safeImages[0]!;

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label="Zoom image"
          onClick={() => setZoomOpen(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-xs hover:bg-card"
        >
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Zoom</span>
        </button>
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                idx === activeIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt_text || `${productName} ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <ResponsiveDialog open={zoomOpen} onOpenChange={setZoomOpen} size="lg">
        <ResponsiveDialogContent ariaLabel={productName}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{productName}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.alt_text || productName}
              className="max-h-[70dvh] w-full rounded-lg object-contain"
            />
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between border-t pt-4"
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="font-semibold text-foreground">{currentPage}</span>{" "}
        of <span className="font-semibold text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  mobileFilterSheetContent?: React.ReactNode;
}

/**
 * Unified search & filter bar that uses ResponsiveDialog for mobile filters.
 */
export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  mobileFilterSheetContent,
}: FilterBarProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {children && (
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {children}
        </div>
      )}

      {mobileFilterSheetContent && (
        <div className="sm:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          <ResponsiveDialog
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
            size="sm"
          >
            <ResponsiveDialogContent ariaLabel="Filters">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Filter Options</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <ResponsiveDialogBody className="space-y-4">
                {mobileFilterSheetContent}
              </ResponsiveDialogBody>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      )}
    </div>
  );
}
