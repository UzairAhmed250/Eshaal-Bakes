import { redirect } from "next/navigation";
import { Calendar, Clock, MapPin } from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAdminOrders } from "@/lib/store-db";
import { getUpcomingKarachiDates } from "@/lib/lead-time";
import { formatDateKarachi } from "@/lib/format";
import {
  EmptyState,
  PageHeader,
  PriceText,
  StatusBadge,
} from "@/components/shared/display-components";

export const dynamic = "force-dynamic";

export default async function AdminDeliverySchedulePage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const allOrders = getAdminOrders().filter(
    (o) =>
      o.status !== "cancelled" &&
      o.status !== "declined" &&
      o.status !== "expired"
  );

  const upcomingDates = getUpcomingKarachiDates(14);
  const groupedByDate = upcomingDates.map((dateStr) => {
    const dayOrders = allOrders.filter((o) => o.delivery_date === dateStr);
    return {
      dateStr,
      orders: dayOrders,
    };
  });

  const busyDaysCount = groupedByDate.filter(
    (g) => g.orders.length >= 3
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Schedule & Kitchen Capacity Calendar"
        subtitle={`14-day Karachi delivery outlook • ${busyDaysCount} high-volume days (3+ cakes) flagged.`}
      />

      {allOrders.length === 0 ? (
        <EmptyState
          title="No upcoming deliveries scheduled"
          description="Active orders and confirmed custom cakes will populate this calendar."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupedByDate.map(({ dateStr, orders }) => {
            const isBusy = orders.length >= 3;
            return (
              <div
                key={dateStr}
                className={`rounded-xl border bg-card p-4 shadow-2xs space-y-3 ${
                  isBusy ? "border-warning ring-1 ring-warning/40" : ""
                }`}
              >
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-display text-sm font-bold">
                      {formatDateKarachi(dateStr)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isBusy
                        ? "bg-warning text-warning-foreground"
                        : orders.length > 0
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {orders.length}{" "}
                    {orders.length === 1 ? "delivery" : "deliveries"}
                    {isBusy ? " • Busy Day" : ""}
                  </span>
                </div>

                {orders.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Open kitchen capacity
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border bg-background p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-primary">
                            {order.order_code}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="font-semibold text-foreground">
                          {order.customer_name} (
                          {order.order_type === "custom"
                            ? "Custom Cake"
                            : "Menu"}
                          )
                        </p>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.delivery_slot}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {order.delivery_area}
                          </span>
                        </div>
                        <div className="flex justify-end pt-0.5">
                          <PriceText amountPkr={order.total_pkr} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
