"use client";

import * as React from "react";
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
import {
  DatePicker,
  PhoneInput,
  PriceInput,
  QuantityStepper,
  SelectField,
  SubmitButton,
  TextArea,
  TextInput,
  TimeSlotPicker,
} from "@/components/shared/form-fields";
import {
  CopyButton,
  EmptyState,
  ErrorState,
  OrderStatusTimeline,
  PageHeader,
  PriceText,
  SkeletonLoader,
  StatCard,
  StatusBadge,
  WhatsAppButton,
} from "@/components/shared/display-components";
import { Container, Section } from "@/components/shared/layouts";

export function DevComponentsShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [phone, setPhone] = React.useState("0300-1234567");
  const [price, setPrice] = React.useState(3800);
  const [qty, setQty] = React.useState(2);
  const [area, setArea] = React.useState("DHA Phase 1-8");
  const [date, setDate] = React.useState("2026-10-28");
  const [slot, setSlot] = React.useState("14:00 - 17:00");

  return (
    <Section>
      <Container className="space-y-10">
        <PageHeader
          title="Shared UI & Component Library (/dev/components)"
          subtitle="Interactive catalog of all reusable primitives and composed components (disabled in production)."
        />

        {/* 1. Buttons */}
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">1. Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="whatsapp">WhatsApp</Button>
            <SubmitButton isLoading loadingText="Submitting...">
              Submit
            </SubmitButton>
          </div>
        </div>

        {/* 2. ResponsiveDialog & ConfirmDialog */}
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            2. ResponsiveDialog & ConfirmDialog
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setDialogOpen(true)}>
              Open ResponsiveDialog (Modal on Desktop / Drawer on Mobile)
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Open ConfirmDialog
            </Button>
          </div>

          <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <ResponsiveDialogContent ariaLabel="Demo ResponsiveDialog">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>
                  Unified ResponsiveDialog
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  Automatically switches between Radix Dialog (&ge;768px) and
                  Vaul Drawer (&lt;768px).
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <ResponsiveDialogBody>
                <p className="text-sm text-muted-foreground">
                  Includes focus trapping, Escape to close, drag handle on
                  mobile, and sticky footer actions.
                </p>
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete Demo Item?"
            description="This action uses ConfirmDialog built on top of ResponsiveDialog."
            variant="destructive"
            confirmLabel="Yes, Delete"
            onConfirm={() => setConfirmOpen(false)}
          />
        </div>

        {/* 3. Shared Form Controls */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            3. Shared Form Controls
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label="Customer Name"
              placeholder="e.g. Ayesha Khan"
              defaultValue="Ayesha Khan"
            />
            <PhoneInput
              label="Pakistani Mobile Number"
              value={phone}
              onChange={setPhone}
              helperText="Format: 03XX-XXXXXXX"
            />
            <PriceInput
              label="Cake Price (Integer PKR)"
              value={price}
              onChange={setPrice}
            />
            <SelectField
              label="Karachi Delivery Area"
              value={area}
              onChange={setArea}
              options={[
                { value: "DHA Phase 1-8", label: "DHA Phase 1-8" },
                { value: "Clifton", label: "Clifton" },
                { value: "PECHS / Tariq Road", label: "PECHS / Tariq Road" },
              ]}
            />
            <DatePicker
              value={date}
              onChange={setDate}
              minLeadTimeHours={5}
              samedayCutoffTime="13:00"
            />
            <div>
              <p className="mb-1.5 text-sm font-medium">Quantity Stepper</p>
              <QuantityStepper value={qty} onChange={setQty} max={10} />
            </div>
          </div>
          <TimeSlotPicker
            deliveryDate={date}
            value={slot}
            onChange={setSlot}
            minLeadTimeHours={5}
            samedayCutoffTime="13:00"
          />
          <TextArea
            label="Cake Design Notes"
            placeholder="Pastel pink buttercream with gold leaf..."
          />
        </div>

        {/* 4. Status Badges & Price Formatting */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            4. StatusBadges, PriceText, Timeline & Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="pending" />
            <StatusBadge status="quote_requested" />
            <StatusBadge status="quoted" />
            <StatusBadge status="confirmed" />
            <StatusBadge status="preparing" />
            <StatusBadge status="out_for_delivery" />
            <StatusBadge status="delivered" />
            <StatusBadge status="cancelled" />
            <StatusBadge status="declined" />
            <StatusBadge status="expired" />
            <StatusBadge status="unpaid" />
            <StatusBadge status="advance_paid" />
            <StatusBadge status="paid" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <PriceText amountPkr={3800} compareAtPkr={4200} size="lg" />
            <WhatsAppButton
              phone="923001234567"
              message="Hello Eshaal Bakes!"
              label="Chat on WhatsApp"
            />
            <CopyButton text="EB-9K2M4P" label="Copy Order Code" />
          </div>
          <OrderStatusTimeline
            orderType="custom"
            currentStatus="confirmed"
            history={[
              {
                id: "1",
                order_id: "o1",
                from_status: null,
                to_status: "quote_requested",
                note: "Submitted",
                changed_by: null,
                created_at: new Date().toISOString(),
              },
              {
                id: "2",
                order_id: "o1",
                from_status: "quote_requested",
                to_status: "quoted",
                note: "Quote sent",
                changed_by: null,
                created_at: new Date().toISOString(),
              },
              {
                id: "3",
                order_id: "o1",
                from_status: "quoted",
                to_status: "confirmed",
                note: "Customer approved",
                changed_by: null,
                created_at: new Date().toISOString(),
              },
            ]}
          />
        </div>

        {/* 5. StatCard, EmptyState, ErrorState, SkeletonLoader */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Today's Orders"
            value={14}
            subtitle="4 custom cakes, 10 menu boxes"
            highlight
          />
          <StatCard
            title="Revenue This Week"
            value="PKR 68,500"
            subtitle="+18% vs last week"
          />
          <StatCard
            title="Pending Quotes"
            value={3}
            subtitle="Awaiting baker reply"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EmptyState
            title="No Custom Requests Waiting"
            description="All customer cake inquiries have been quoted."
          />
          <ErrorState message="Sample error state preview for network retry." />
        </div>

        <SkeletonLoader rows={2} />
      </Container>
    </Section>
  );
}
