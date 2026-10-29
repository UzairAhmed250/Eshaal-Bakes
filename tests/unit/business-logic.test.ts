import { describe, it, expect } from "vitest";
import {
  calculateFixedOrderPricing,
  evaluateDeliverySlotEligibility,
} from "@/lib/lead-time";
import {
  getAllowedNextStatuses,
  isValidStatusTransition,
} from "@/lib/status-machine";
import {
  formatPKR,
  normalizePakistaniPhone,
  formatPakistaniPhoneDisplay,
} from "@/lib/format";
import {
  fixedCheckoutSchema,
  pakistaniPhoneSchema,
} from "@/lib/validation";
import type { Product } from "@/types";

const mockProducts: Product[] = [
  {
    id: "prod-1",
    category_id: "cat-1",
    name: "Belgian Chocolate Cake",
    slug: "belgian-chocolate-cake",
    description: "Rich chocolate cake",
    price_pkr: 3800,
    compare_at_price_pkr: 4200,
    stock_quantity: 5,
    track_inventory: true,
    allow_custom_text: true,
    is_active: true,
    is_deleted: false,
    images: [],
    options: [
      {
        id: "opt-1",
        product_id: "prod-1",
        name: "Weight",
        required: true,
        choices: [
          { label: "1.5 lb", priceDeltaPkr: 0 },
          { label: "2.5 lb", priceDeltaPkr: 1800 },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("Server-side Pricing, Lead-Time & Cutoff, Status Machine, and Validation", () => {
  it("calculates integer PKR totals, variant deltas, delivery fee, and COD advance threshold on the server", () => {
    const result = calculateFixedOrderPricing({
      requestedItems: [
        {
          productId: "prod-1",
          quantity: 1,
          variantLabel: "2.5 lb",
          customText: "Happy Birthday Sara!",
        },
      ],
      catalogProducts: mockProducts,
      deliveryFeePkr: 350,
      paymentMethod: "cod",
      codAdvanceThresholdPkr: 5000,
      defaultAdvancePercent: 50,
    });

    // 3800 base + 1800 variant delta = 5600 subtotal + 350 delivery = 5950 total
    expect(result.subtotalPkr).toBe(5600);
    expect(result.deliveryFeePkr).toBe(350);
    expect(result.totalPkr).toBe(5950);
    // Because COD total (5950) > 5000 threshold, 50% advance is required
    expect(result.advanceRequiredPkr).toBe(2975);
    expect(formatPKR(result.totalPkr)).toBe("PKR 5,950");
  });

  it("rejects orders exceeding available stock", () => {
    expect(() =>
      calculateFixedOrderPricing({
        requestedItems: [{ productId: "prod-1", quantity: 6 }],
        catalogProducts: mockProducts,
        deliveryFeePkr: 350,
        paymentMethod: "cod",
        codAdvanceThresholdPkr: 5000,
        defaultAdvancePercent: 50,
      })
    ).toThrow(/Insufficient stock/i);
  });

  it("evaluates Karachi same-day cutoff (13:00 PKT) and minimum lead time (5 hours) accurately", () => {
    // 10:00 AM Karachi time on 2026-10-27 (before 13:00 cutoff)
    const morningKarachi = new Date("2026-10-27T10:00:00+05:00");

    // 17:00 - 20:00 slot is 7 hours away (>= 5h lead time) -> same-day eligible!
    const validEveningSlot = evaluateDeliverySlotEligibility({
      deliveryDate: "2026-10-27",
      deliverySlot: "17:00 - 20:00",
      minLeadTimeHours: 5,
      samedayCutoffTime: "13:00",
      now: morningKarachi,
    });
    expect(validEveningSlot.valid).toBe(true);
    expect(validEveningSlot.sameDayDeliveryAvailable).toBe(true);

    // 11:00 - 14:00 slot is only 1 hour away (< 5h lead time) -> rejected!
    const tooSoonSlot = evaluateDeliverySlotEligibility({
      deliveryDate: "2026-10-27",
      deliverySlot: "11:00 - 14:00",
      minLeadTimeHours: 5,
      samedayCutoffTime: "13:00",
      now: morningKarachi,
    });
    expect(tooSoonSlot.valid).toBe(false);
    expect(tooSoonSlot.sameDayDeliveryAvailable).toBe(false);

    // 2:00 PM (14:00) Karachi time -> after 13:00 cutoff -> same-day rejected even for 20:00 slot
    const afternoonKarachi = new Date("2026-10-27T14:00:00+05:00");
    const afterCutoffSlot = evaluateDeliverySlotEligibility({
      deliveryDate: "2026-10-27",
      deliverySlot: "20:00 - 22:30",
      minLeadTimeHours: 5,
      samedayCutoffTime: "13:00",
      now: afternoonKarachi,
    });
    expect(afterCutoffSlot.valid).toBe(false);
    expect(afterCutoffSlot.reason).toMatch(/cutoff/i);
  });

  it("enforces valid status transitions for both fixed and custom orders", () => {
    // Fixed order valid transitions
    expect(isValidStatusTransition("fixed", "pending", "confirmed")).toBe(true);
    expect(isValidStatusTransition("fixed", "confirmed", "preparing")).toBe(true);
    expect(
      isValidStatusTransition("fixed", "preparing", "out_for_delivery")
    ).toBe(true);
    expect(
      isValidStatusTransition("fixed", "out_for_delivery", "delivered")
    ).toBe(true);

    // Invalid jump: pending -> delivered directly is forbidden
    expect(isValidStatusTransition("fixed", "pending", "delivered")).toBe(false);
    // Terminal state: delivered -> cancelled is forbidden
    expect(isValidStatusTransition("fixed", "delivered", "cancelled")).toBe(
      false
    );

    // Custom order valid transitions
    expect(
      isValidStatusTransition("custom", "quote_requested", "quoted")
    ).toBe(true);
    expect(isValidStatusTransition("custom", "quoted", "confirmed")).toBe(true);
    expect(isValidStatusTransition("custom", "quoted", "declined")).toBe(true);
    expect(getAllowedNextStatuses("custom", "delivered")).toEqual([]);
  });

  it("validates Pakistani mobile phone numbers (03XX-XXXXXXX) and sanitizes XSS characters", () => {
    expect(normalizePakistaniPhone("0300-1234567")).toBe("03001234567");
    expect(normalizePakistaniPhone("+92 321 9876543")).toBe("03219876543");
    expect(normalizePakistaniPhone("042-111222333")).toBeNull();
    expect(formatPakistaniPhoneDisplay("03331234567")).toBe("0333-1234567");

    expect(pakistaniPhoneSchema.safeParse("0300-1234567").success).toBe(true);
    expect(pakistaniPhoneSchema.safeParse("12345").success).toBe(false);

    const checkoutParse = fixedCheckoutSchema.safeParse({
      idempotencyKey: "idem-test-12345",
      customerName: "<script>alert(1)</script>Ayesha",
      customerPhone: "0300-1234567",
      deliveryArea: "Korangi",
      deliveryAddress: "House R-10, Sector 35-B, Korangi Karachi",
      deliveryDate: "2026-10-29",
      deliverySlot: "17:00 - 20:00",
      customerNotes: "Ring bell",
      paymentMethod: "cod",
      items: [{ productId: "prod-1", quantity: 1 }],
      honeypot: "",
    });

    expect(checkoutParse.success).toBe(true);
    if (checkoutParse.success) {
      expect(checkoutParse.data.customerName).not.toContain("<script>");
      expect(checkoutParse.data.customerPhone).toBe("03001234567");
    }
  });
});
