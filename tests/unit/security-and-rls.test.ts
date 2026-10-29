// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    set: () => {},
    delete: () => {},
  }),
}));

import {
  createCustomOrderRequest,
  createFixedPriceOrder,
  createOrReviseQuoteAdmin,
  deleteProductAdmin,
  getAuditLogsAdmin,
  getPublicProducts,
  resetDatabaseForTests,
  respondToQuoteByCustomer,
  simulatePublicAnonTableSelect,
  upsertProductAdmin,
  verifySignedReferenceUrl,
} from "@/lib/store-db";
import {
  detectImageMimeFromMagicBytes,
  stripImageMetadata,
} from "@/lib/image-validation";
import { GET as getReferenceUploadRoute } from "@/app/api/uploads/reference/route";

describe("Security, RLS Access Control, Quote Immutability & Upload Verification", () => {
  beforeEach(() => {
    resetDatabaseForTests();
  });

  it("proves RLS is enabled on all 14 tables in the SQL migration and anonymous users cannot read orders, quotes, or reference_images", () => {
    const sqlPath = path.join(
      process.cwd(),
      "supabase/migrations/0001_initial_schema_and_rls.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    const requiredTables = [
      "profiles",
      "store_settings",
      "categories",
      "flavours",
      "products",
      "product_images",
      "product_options",
      "orders",
      "order_items",
      "custom_order_details",
      "quotes",
      "reference_images",
      "order_status_history",
      "audit_log",
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(
        `alter table public.${table} enable row level security;`
      );
    }

    // Verify public anon access is blocked for orders, quotes, reference_images, and audit_log
    expect(simulatePublicAnonTableSelect("orders").allowed).toBe(false);
    expect(simulatePublicAnonTableSelect("quotes").allowed).toBe(false);
    expect(simulatePublicAnonTableSelect("reference_images").allowed).toBe(
      false
    );
    expect(simulatePublicAnonTableSelect("audit_log").allowed).toBe(false);

    // Public can read active products, categories, flavours, and store_settings
    expect(simulatePublicAnonTableSelect("products").allowed).toBe(true);
    expect(simulatePublicAnonTableSelect("categories").allowed).toBe(true);
    expect(simulatePublicAnonTableSelect("flavours").allowed).toBe(true);
    expect(simulatePublicAnonTableSelect("store_settings").allowed).toBe(true);
  });

  it("blocks anonymous users from reading private reference image URLs (403 Forbidden)", async () => {
    const req = new Request(
      "http://localhost:3000/api/uploads/reference?path=reference-images/ref-test.jpg&exp=9999999999&sig=invalid"
    );
    const res = await getReferenceUploadRoute(req);
    expect(res.status).toBe(403);

    expect(
      verifySignedReferenceUrl("reference-images/ref-test.jpg", 100, "bad-sig")
    ).toBe(false);
  });

  it("enforces quote immutability once approved and creates a new version when revising an unapproved quote", () => {
    const customOrder = createCustomOrderRequest({
      idempotencyKey: "idem-custom-sec-1",
      customerName: "Sana Ahmed",
      customerPhone: "03001112233",
      flavourId: "20000000-0000-0000-0000-000000000001",
      weightLabel: "2 lb (Serves 8-12)",
      themeText: "Eid Mubarak",
      designDescription: "White & gold crescent design with pistachio crumb",
      deliveryArea: "Clifton",
      deliveryAddress: "Block 5 Clifton Karachi",
      deliveryDate: "2026-11-02",
      deliverySlot: "17:00 - 20:00",
      customerNotes: "",
      referenceImagePaths: [],
      now: new Date("2026-10-27T09:00:00+05:00"),
    });

    const quoteV1 = createOrReviseQuoteAdmin({
      orderId: customOrder.id,
      pricePkr: 5000,
      advancePkr: 2500,
      validityHours: 24,
      notes: "Initial quote",
      actorId: "admin-1",
    });
    expect(quoteV1.version).toBe(1);
    expect(quoteV1.status).toBe("sent");

    // Revise quote before approval -> creates v2 and supersedes v1
    const quoteV2 = createOrReviseQuoteAdmin({
      orderId: customOrder.id,
      pricePkr: 6200,
      advancePkr: 3100,
      validityHours: 24,
      notes: "Revised for 3D topper",
      actorId: "admin-1",
    });
    expect(quoteV2.version).toBe(2);
    expect(quoteV2.quote_token).not.toBe(quoteV1.quote_token);

    // Old v1 token cannot be approved anymore because it was superseded
    expect(() =>
      respondToQuoteByCustomer({
        quoteToken: quoteV1.quote_token,
        action: "approve",
      })
    ).toThrow(/superseded/i);

    // Approve v2
    const approvedView = respondToQuoteByCustomer({
      quoteToken: quoteV2.quote_token,
      action: "approve",
    });
    expect(approvedView.quote.status).toBe("approved");
    expect(approvedView.quote.is_immutable).toBe(true);
    expect(approvedView.order.status).toBe("confirmed");

    // Once approved, admin cannot revise or mutate the quote
    expect(() =>
      createOrReviseQuoteAdmin({
        orderId: customOrder.id,
        pricePkr: 7000,
        actorId: "admin-1",
      })
    ).toThrow(/immutable/i);
  });

  it("prevents duplicate orders via idempotencyKey and atomically decrements product stock", () => {
    const productBefore = getPublicProducts().find(
      (p) => p.id === "30000000-0000-0000-0000-000000000005"
    )!;
    expect(productBefore.stock_quantity).toBe(3);

    const payload = {
      idempotencyKey: "idem-fixed-sec-99",
      customerName: "Bilal Raza",
      customerPhone: "03451234567",
      deliveryArea: "Korangi",
      deliveryAddress: "Sector 35-B Korangi No. 4 Karachi",
      deliveryDate: "2026-11-03",
      deliverySlot: "14:00 - 17:00",
      customerNotes: "",
      paymentMethod: "cod" as const,
      items: [
        {
          productId: "30000000-0000-0000-0000-000000000005",
          quantity: 2,
        },
      ],
      now: new Date("2026-10-27T09:00:00+05:00"),
    };

    const firstOrder = createFixedPriceOrder(payload);
    // Repeat submission with same idempotencyKey returns the exact same order without double-decrementing stock
    const duplicateSubmission = createFixedPriceOrder(payload);
    expect(duplicateSubmission.id).toBe(firstOrder.id);

    const productAfter = getPublicProducts().find(
      (p) => p.id === "30000000-0000-0000-0000-000000000005"
    )!;
    expect(productAfter.stock_quantity).toBe(1);
  });

  it("soft-deletes products that have orders and hard-deletes products without orders, and scrubs PII from audit logs", () => {
    // Product 30000000-0000-0000-0000-000000000001 has a seeded order
    const softRes = deleteProductAdmin({
      productId: "30000000-0000-0000-0000-000000000001",
      actorId: "admin-1",
    });
    expect(softRes.softDeleted).toBe(true);

    // Create a brand new product with no orders, then delete it -> hard deleted
    const freshProduct = upsertProductAdmin({
      categoryId: "10000000-0000-0000-0000-000000000001",
      name: "Temporary Eid Special Cake",
      slug: "temp-eid-special-cake",
      description: "Limited edition",
      pricePkr: 4000,
      trackInventory: false,
      allowCustomText: false,
      isActive: true,
      images: [{ url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587", sortOrder: 0 }],
      options: [],
      actorId: "admin-1",
    });

    const hardRes = deleteProductAdmin({
      productId: freshProduct.id,
      actorId: "admin-1",
    });
    expect(hardRes.softDeleted).toBe(false);

    const logs = getAuditLogsAdmin();
    expect(logs.length).toBeGreaterThan(0);
    for (const log of logs) {
      const serialized = JSON.stringify(log.metadata);
      expect(serialized).not.toContain("customer_phone");
      expect(serialized).not.toContain("delivery_address");
    }
  });

  it("validates image magic bytes and strips JPEG EXIF/APP1 metadata segments", () => {
    // Fake text file pretending to be JPEG -> rejected
    const fakeBytes = new Uint8Array(Buffer.from("<html>not an image</html>"));
    expect(detectImageMimeFromMagicBytes(fakeBytes)).toBeNull();

    // Valid JPEG with an APP1 (0xFFE1) EXIF segment followed by SOS (0xFFDA)
    const jpegWithExif = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // APP1 EXIF segment (length 8)
      0xff, 0xdb, 0x00, 0x04, 0x00, 0x01, // DQT segment (kept)
      0xff, 0xda, 0x01, 0x02, 0x03, // SOS + image scan data
      0xff, 0xd9, // EOI
    ]);

    const mime = detectImageMimeFromMagicBytes(jpegWithExif);
    expect(mime).toBe("image/jpeg");

    const stripped = stripImageMetadata(jpegWithExif, "image/jpeg");
    // Stripped buffer must still be a valid JPEG but with the 10-byte APP1 segment removed
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
    expect(stripped.length).toBe(jpegWithExif.length - 10);
  });
});
