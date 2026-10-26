"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Cake,
  ShoppingBag,
  Sparkles,
  Search,
  LayoutDashboard,
  ClipboardList,
  FileSpreadsheet,
  Package,
  Tags,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  Trash2,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STRINGS } from "@/lib/strings";
import { useCart } from "@/hooks/use-cart";
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
import { PriceText } from "@/components/shared/display-components";
import { QuantityStepper } from "@/components/shared/form-fields";
import type { StoreSettings } from "@/types";

export function Container({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("py-6 sm:py-10", className)} {...props}>
      {children}
    </section>
  );
}

export interface StoreLayoutProps {
  settings: StoreSettings;
  children: React.ReactNode;
}

/**
 * Customer-facing StoreLayout with announcement banner, mobile-first navigation,
 * and Cart review drawer powered by ResponsiveDialog.
 */
export function StoreLayout({ settings, children }: StoreLayoutProps) {
  const pathname = usePathname();
  const {
    items,
    totalItemsCount,
    subtotalPkr,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeItem,
  } = useCart();

  const estimatedTotalPkr =
    items.length > 0 ? subtotalPkr + settings.delivery_fee_pkr : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {settings.announcement_banner && (
        <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          {settings.announcement_banner}
        </div>
      )}

      {!settings.is_open && (
        <div className="bg-warning px-4 py-2 text-center text-xs font-semibold text-warning-foreground">
          {STRINGS.home.closedNoticeTitle} — {STRINGS.home.closedNoticeBody}
        </div>
      )}

      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-xs">
        <Container className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Cake className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="block font-display text-lg font-bold leading-tight text-foreground">
                {settings.store_name}
              </span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                Karachi Artisan Bakery
              </span>
            </div>
          </Link>

          <nav
            aria-label="Store navigation"
            className="hidden items-center gap-6 text-sm font-medium md:flex"
          >
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/" ? "font-semibold text-primary" : "text-foreground"
              )}
            >
              {STRINGS.nav.menu}
            </Link>
            <Link
              href="/custom-order"
              className={cn(
                "inline-flex items-center gap-1.5 transition-colors hover:text-primary",
                pathname === "/custom-order"
                  ? "font-semibold text-primary"
                  : "text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{STRINGS.nav.customCake}</span>
            </Link>
            <Link
              href="/track"
              className={cn(
                "inline-flex items-center gap-1.5 transition-colors hover:text-primary",
                pathname.startsWith("/track")
                  ? "font-semibold text-primary"
                  : "text-foreground"
              )}
            >
              <Search className="h-4 w-4" />
              <span>{STRINGS.nav.trackOrder}</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/custom-order">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Custom Cake</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Open cart"
              data-testid="open-cart-button"
              onClick={() => setCartOpen(true)}
              className="relative"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{STRINGS.nav.cart}</span>
              {totalItemsCount > 0 && (
                <span
                  data-testid="cart-badge-count"
                  className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground"
                >
                  {totalItemsCount}
                </span>
              )}
            </Button>
          </div>
        </Container>

        {/* Mobile quick sub-bar */}
        <div className="flex items-center justify-around border-t bg-secondary/40 px-2 py-1.5 text-xs font-medium md:hidden">
          <Link
            href="/"
            className={cn(
              "rounded px-2.5 py-1",
              pathname === "/" && "bg-card font-semibold text-primary shadow-2xs"
            )}
          >
            {STRINGS.nav.menu}
          </Link>
          <Link
            href="/custom-order"
            className={cn(
              "inline-flex items-center gap-1 rounded px-2.5 py-1",
              pathname === "/custom-order" &&
                "bg-card font-semibold text-primary shadow-2xs"
            )}
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Custom Cake</span>
          </Link>
          <Link
            href="/track"
            className={cn(
              "rounded px-2.5 py-1",
              pathname.startsWith("/track") &&
                "bg-card font-semibold text-primary shadow-2xs"
            )}
          >
            {STRINGS.nav.trackOrder}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t bg-card py-8 text-xs text-muted-foreground">
        <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {settings.store_name} — Karachi, Pakistan
            </p>
            <p className="mt-0.5">{settings.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/custom-order" className="hover:text-primary">
              Custom Cake Request
            </Link>
            <Link href="/track" className="hover:text-primary">
              Track Order
            </Link>
            <Link href="/admin" className="hover:text-primary">
              {STRINGS.nav.adminPanel}
            </Link>
          </div>
        </Container>
      </footer>

      {/* Cart Review Modal / Drawer built on ResponsiveDialog */}
      <ResponsiveDialog
        open={isCartOpen}
        onOpenChange={setCartOpen}
        size="md"
      >
        <ResponsiveDialogContent ariaLabel={STRINGS.cart.title}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{STRINGS.cart.title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Delivery across {settings.delivery_areas.slice(0, 4).join(", ")} &
              more in Karachi.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody>
            {items.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="font-display text-base font-semibold">
                  {STRINGS.cart.emptyTitle}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {STRINGS.cart.emptyDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      {item.variantLabel && (
                        <p className="text-xs text-muted-foreground">
                          Option: {item.variantLabel}
                        </p>
                      )}
                      {item.customText && (
                        <p className="text-xs italic text-primary">
                          Message: &ldquo;{item.customText}&rdquo;
                        </p>
                      )}
                      <PriceText
                        amountPkr={item.unitPricePkr * item.quantity}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        max={item.maxStock}
                        onChange={(qty) => updateQuantity(item.cartItemId, qty)}
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.cartItemId)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5 rounded-xl bg-secondary/50 p-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {STRINGS.cart.subtotal}
                    </span>
                    <PriceText amountPkr={subtotalPkr} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {STRINGS.cart.deliveryFee}
                    </span>
                    <PriceText
                      amountPkr={settings.delivery_fee_pkr}
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>{STRINGS.cart.total}</span>
                    <PriceText amountPkr={estimatedTotalPkr} size="md" />
                  </div>
                </div>
              </div>
            )}
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCartOpen(false)}
            >
              Continue Shopping
            </Button>
            {items.length > 0 && (
              <Button asChild onClick={() => setCartOpen(false)}>
                <Link href="/checkout">{STRINGS.cart.proceedToCheckout}</Link>
              </Button>
            )}
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: STRINGS.admin.nav.dashboard, icon: LayoutDashboard },
  { href: "/admin/orders", label: STRINGS.admin.nav.orders, icon: ClipboardList },
  {
    href: "/admin/quotes",
    label: STRINGS.admin.nav.quotes,
    icon: FileSpreadsheet,
  },
  { href: "/admin/products", label: STRINGS.admin.nav.products, icon: Package },
  { href: "/admin/catalog", label: STRINGS.admin.nav.catalog, icon: Tags },
  {
    href: "/admin/schedule",
    label: STRINGS.admin.nav.schedule,
    icon: Calendar,
  },
  { href: "/admin/customers", label: STRINGS.admin.nav.customers, icon: Users },
  {
    href: "/admin/settings",
    label: STRINGS.admin.nav.settings,
    icon: Settings,
  },
] as const;

export interface AdminLayoutProps {
  children: React.ReactNode;
  adminEmail?: string;
}

/**
 * AdminLayout with desktop sidebar, mobile bottom nav + ResponsiveDialog menu drawer,
 * and real-time order/quote notification banner.
 */
export function AdminLayout({ children, adminEmail }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [realtimeAlert, setRealtimeAlert] = React.useState<string | null>(null);
  const lastKnownCountRef = React.useRef<number | null>(null);

  // Poll / subscribe for new incoming orders or custom cake requests
  React.useEffect(() => {
    let active = true;
    const checkIncoming = async () => {
      try {
        const res = await fetch("/api/admin/orders?summary=1", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { totalCount?: number };
        if (typeof data.totalCount === "number") {
          if (
            lastKnownCountRef.current !== null &&
            data.totalCount > lastKnownCountRef.current
          ) {
            if (active) {
              setRealtimeAlert(STRINGS.admin.realtimeNewOrder);
            }
          }
          lastKnownCountRef.current = data.totalCount;
        }
      } catch {
        // Ignore transient network errors
      }
    };

    checkIncoming();
    const interval = setInterval(checkIncoming, 12000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Cake className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-base font-bold leading-none">
              Eshaal Bakes
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Kitchen Admin Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Admin sidebar">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          {adminEmail && (
            <p className="mb-2 truncate px-2 text-xs text-muted-foreground">
              Signed in: <strong>{adminEmail}</strong>
            </p>
          )}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/">View Store</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              aria-label={STRINGS.admin.signOutButton}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          <span className="font-display text-base font-bold">
            Baker Admin
          </span>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {realtimeAlert && (
          <div
            role="status"
            className="no-print flex items-center justify-between bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <span className="flex items-center gap-2">
              <BellRing className="h-4 w-4 animate-bounce" />
              <span>{realtimeAlert}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setRealtimeAlert(null);
                router.refresh();
              }}
              className="underline"
            >
              Refresh View
            </button>
          </div>
        )}
        <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-8">{children}</main>
      </div>

      {/* Mobile Navigation Drawer via ResponsiveDialog */}
      <ResponsiveDialog
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        size="sm"
      >
        <ResponsiveDialogContent ariaLabel="Admin Navigation">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Baker Admin Menu</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>{STRINGS.admin.signOutButton}</span>
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
