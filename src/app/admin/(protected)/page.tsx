import Link from "next/link";
import {
  Calendar,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminOrders, getAllProductsAdmin } from "@/lib/store-db";
import { getKarachiDateParts } from "@/lib/lead-time";
import { formatPKR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageHeader,
  PriceText,
  StatCard,
  StatusBadge,
} from "@/components/shared/display-components";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const orders = getAdminOrders();
  const products = getAllProductsAdmin();
  const { dateStr: todayKarachi } = getKarachiDateParts(new Date());

  const nowMs = Date.now();
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  const todaysOrders = orders.filter((o) => o.delivery_date === todayKarachi);
  const quoteRequestsWaiting = orders.filter(
    (o) => o.order_type === "custom" && o.status === "quote_requested"
  );
  const pendingOrdersCount = orders.filter(
    (o) => o.status === "pending" || o.status === "quote_requested"
  ).length;

  const validRevenueOrders = orders.filter(
    (o) =>
      o.status !== "cancelled" &&
      o.status !== "declined" &&
      o.status !== "expired" &&
      o.status !== "quote_requested"
  );

  const revenueWeekPkr = validRevenueOrders
    .filter((o) => new Date(o.created_at).getTime() >= sevenDaysAgoMs)
    .reduce((sum, o) => sum + o.total_pkr, 0);

  const revenueMonthPkr = validRevenueOrders
    .filter((o) => new Date(o.created_at).getTime() >= thirtyDaysAgoMs)
    .reduce((sum, o) => sum + o.total_pkr, 0);

  const lowStockProducts = products.filter(
    (p) =>
      p.track_inventory &&
      p.stock_quantity !== null &&
      p.stock_quantity <= 5 &&
      p.is_active
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kitchen Overview"
        subtitle={`Karachi Date: ${todayKarachi} • Manage today's bakes, custom cake quotes, and inventory.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/quotes">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Quote Requests ({quoteRequestsWaiting.length})</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/orders">
                <ClipboardList className="h-4 w-4" />
                <span>All Orders</span>
              </Link>
            </Button>
          </>
        }
      />

      {/* Top KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Deliveries"
          value={todaysOrders.length}
          subtitle={`Scheduled for ${todayKarachi}`}
          icon={<Calendar className="h-4 w-4" />}
          highlight
        />
        <StatCard
          title="Quotes Waiting Reply"
          value={quoteRequestsWaiting.length}
          subtitle={`${pendingOrdersCount} total pending actions`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          title="Revenue (7 Days)"
          value={formatPKR(revenueWeekPkr)}
          subtitle={`30-Day Revenue: ${formatPKR(revenueMonthPkr)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          subtitle="Products with ≤ 5 units left"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Delivery Schedule */}
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Today&apos;s Delivery Schedule ({todayKarachi})
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/schedule">Full Calendar</Link>
            </Button>
          </div>

          {todaysOrders.length === 0 ? (
            <EmptyState
              title="No deliveries scheduled for today"
              description="Upcoming deliveries will appear here automatically."
            />
          ) : (
            <div className="space-y-2.5">
              {todaysOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {order.order_code}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-0.5 font-medium">
                      {order.customer_name} • {order.delivery_area}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {order.delivery_slot}
                    </p>
                  </div>
                  <PriceText amountPkr={order.total_pkr} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quote Requests Waiting for Reply */}
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Custom Cake Quotes Waiting ({quoteRequestsWaiting.length})
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/quotes">Manage Quotes</Link>
            </Button>
          </div>

          {quoteRequestsWaiting.length === 0 ? (
            <EmptyState
              title="All custom requests have been quoted"
              description="New custom cake requests will alert you in real time."
            />
          ) : (
            <div className="space-y-2.5">
              {quoteRequestsWaiting.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {order.order_code}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-0.5 font-medium">{order.customer_name}</p>
                    {order.custom_details && (
                      <p className="text-xs text-muted-foreground">
                        {order.custom_details.flavour_name_snapshot} •{" "}
                        {order.custom_details.weight_label}
                      </p>
                    )}
                  </div>
                  <Button asChild size="sm">
                    <Link href="/admin/quotes">Send Quote</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Inventory Alert */}
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            Low Stock Products (≤ 5 Remaining)
          </h2>
          <Button asChild variant="link" size="sm">
            <Link href="/admin/products">Manage Inventory</Link>
          </Button>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All tracked products have healthy stock levels.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {lowStockProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{prod.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {prod.category_name}
                  </p>
                </div>
                <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-warning-foreground">
                  {prod.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
