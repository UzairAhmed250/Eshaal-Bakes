"use client";

import * as React from "react";
import {
  NumberInput,
  PriceInput,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/display-components";
import { useToast } from "@/components/shared/toast";
import type { StoreSettings } from "@/types";

export function AdminSettingsClient({
  initialSettings,
}: {
  initialSettings: StoreSettings;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<StoreSettings>(initialSettings);
  const [areasText, setAreasText] = React.useState(
    initialSettings.delivery_areas.join(", ")
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const delivery_areas = areasText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          delivery_areas,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        settings?: StoreSettings;
      };
      if (!res.ok || !data.settings) {
        throw new Error(data.error || "Could not update store settings.");
      }

      setForm(data.settings);
      toast({
        title: "Store settings saved",
        description: "All storefront rules & Karachi delivery parameters updated.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error saving settings",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <PageHeader
        title="Store Configuration & Karachi Rules"
        subtitle="Configure your bakery brand, WhatsApp number, Karachi delivery areas, lead time, cutoff, and payment rules."
        actions={
          <SubmitButton isLoading={isSaving}>Save All Settings</SubmitButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Brand & Status */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            1. Store Identity & Kitchen Status
          </h2>

          <label className="flex items-center justify-between rounded-lg border bg-secondary/40 p-3.5 text-sm font-medium">
            <div>
              <p className="font-semibold">Accepting Online Orders</p>
              <p className="text-xs text-muted-foreground">
                Turn off when your kitchen is fully booked for the day.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.is_open}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_open: e.target.checked }))
              }
              className="h-5 w-5"
            />
          </label>

          <TextInput
            label="Store Name"
            required
            value={form.store_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, store_name: e.target.value }))
            }
          />

          <TextInput
            label="Tagline"
            required
            value={form.tagline}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tagline: e.target.value }))
            }
          />

          <TextInput
            label="Logo Path or URL"
            required
            value={form.logo_url}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, logo_url: e.target.value }))
            }
          />

          <TextInput
            label="Owner WhatsApp Number (E.164 or 03XX)"
            required
            value={form.whatsapp_number}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                whatsapp_number: e.target.value,
              }))
            }
          />

          <TextArea
            label="Top Announcement Banner"
            value={form.announcement_banner}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                announcement_banner: e.target.value,
              }))
            }
          />
        </div>

        {/* Delivery, Lead Time, Cutoff & Payment Rules */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            2. Delivery, Lead Time, Cutoff & Payment Rules
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PriceInput
              label="Karachi Delivery Fee (PKR)"
              value={form.delivery_fee_pkr}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, delivery_fee_pkr: val }))
              }
            />
            <NumberInput
              label="Minimum Lead Time (Hours)"
              value={form.min_lead_time_hours}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  min_lead_time_hours: Math.max(1, val),
                }))
              }
            />
            <TextInput
              label="Same-Day Order Cutoff (PKT HH:mm)"
              placeholder="13:00"
              value={form.sameday_cutoff_time}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sameday_cutoff_time: e.target.value,
                }))
              }
            />
            <NumberInput
              label="Quote Validity (Hours)"
              value={form.quote_validity_hours}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  quote_validity_hours: Math.max(1, val),
                }))
              }
            />
            <NumberInput
              label="Default Advance Payment (%)"
              value={form.default_advance_percent}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  default_advance_percent: Math.min(100, Math.max(0, val)),
                }))
              }
            />
            <PriceInput
              label="COD Advance Required Threshold (PKR)"
              value={form.cod_advance_threshold_pkr}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  cod_advance_threshold_pkr: val,
                }))
              }
            />
          </div>

          <TextArea
            label="Karachi Delivery Areas (Comma-separated)"
            required
            value={areasText}
            onChange={(e) => setAreasText(e.target.value)}
            helperText="Customers select from these neighborhoods at checkout."
          />

          <TextArea
            label="Easypaisa / JazzCash / Bank Payment Instructions"
            required
            value={form.payment_instructions}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                payment_instructions: e.target.value,
              }))
            }
          />
        </div>
      </div>
    </form>
  );
}
