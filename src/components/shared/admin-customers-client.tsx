"use client";

import * as React from "react";
import { Repeat, Award } from "lucide-react";
import {
  formatDateKarachi,
  formatDateTimeKarachi,
  formatPakistaniPhoneDisplay,
} from "@/lib/format";
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
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import {
  FilterBar,
  PageHeader,
  PriceText,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import type { CustomerSummary, StoreSettings } from "@/types";

export function AdminCustomersClient({
  customers,
  settings,
}: {
  customers: CustomerSummary[];
  settings: StoreSettings;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<CustomerSummary | null>(null);

  const filteredCustomers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.area.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const columns: DataTableColumn<CustomerSummary>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{c.name}</span>
            {c.is_repeat_customer ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                <Repeat className="h-3 w-3" />
                Repeat Customer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                <Award className="h-3 w-3" />
                First-Time
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {formatPakistaniPhoneDisplay(c.phone)}
          </p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Neighborhood",
      render: (c) => <span className="text-xs">{c.area}</span>,
    },
    {
      key: "orders",
      header: "Orders",
      sortable: true,
      sortValue: (c) => c.total_orders,
      render: (c) => (
        <span className="font-semibold">
          {c.total_orders} ({c.delivered_orders} delivered)
        </span>
      ),
    },
    {
      key: "spent",
      header: "Total Spent",
      sortable: true,
      sortValue: (c) => c.total_spent_pkr,
      render: (c) => <PriceText amountPkr={c.total_spent_pkr} size="sm" />,
    },
    {
      key: "actions",
      header: "History",
      render: (c) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSelectedCustomer(c)}
        >
          View History
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers Directory"
        subtitle="Derived automatically from store orders with repeat customer indicators and lifetime value."
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search customers by name, 03XX phone, or Karachi area..."
      />

      <DataTable
        data={filteredCustomers}
        columns={columns}
        keyExtractor={(c) => c.phone}
        renderMobileCard={(c) => (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatPakistaniPhoneDisplay(c.phone)} • {c.area}
                </p>
              </div>
              {c.is_repeat_customer && (
                <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                  Repeat ({c.total_orders})
                </span>
              )}
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <PriceText amountPkr={c.total_spent_pkr} size="sm" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(c)}
              >
                View History
              </Button>
            </div>
          </div>
        )}
      />

      {/* Customer Detail Modal/Drawer built on ResponsiveDialog */}
      <ResponsiveDialog
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}
        size="md"
      >
        <ResponsiveDialogContent ariaLabel="Customer Order History">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {selectedCustomer?.name}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Phone:{" "}
              {selectedCustomer
                ? formatPakistaniPhoneDisplay(selectedCustomer.phone)
                : ""}{" "}
              • Area: {selectedCustomer?.area}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {selectedCustomer && (
            <ResponsiveDialogBody className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3.5 text-xs">
                <div>
                  <p>
                    <strong>Total Orders:</strong>{" "}
                    {selectedCustomer.total_orders}
                  </p>
                  <p>
                    <strong>Last Order:</strong>{" "}
                    {formatDateTimeKarachi(selectedCustomer.last_order_at)}
                  </p>
                </div>
                <PriceText
                  amountPkr={selectedCustomer.total_spent_pkr}
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Orders Placed
                </p>
                {selectedCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-primary">
                        {ord.order_code}
                      </span>{" "}
                      <span className="uppercase text-muted-foreground">
                        ({ord.order_type})
                      </span>
                      <p className="text-muted-foreground">
                        Delivery: {formatDateKarachi(ord.delivery_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ord.status} />
                      <PriceText amountPkr={ord.total_pkr} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </ResponsiveDialogBody>
          )}

          <ResponsiveDialogFooter>
            {selectedCustomer && (
              <WhatsAppButton
                phone={selectedCustomer.phone}
                message={`Assalam-o-Alaikum ${selectedCustomer.name}! This is ${settings.store_name}.`}
                label="Message on WhatsApp"
                size="sm"
              />
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedCustomer(null)}
            >
              Close
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
