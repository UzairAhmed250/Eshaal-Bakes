import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAdminOrders } from "@/lib/store-db";

function escapeCsvCell(val: string | number | null | undefined): string {
  const str = String(val ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = getAdminOrders();
  const headers = [
    "Order Code",
    "Order Type",
    "Status",
    "Payment Status",
    "Payment Method",
    "Customer Name",
    "Customer Phone",
    "Delivery Area",
    "Delivery Date",
    "Delivery Slot",
    "Subtotal PKR",
    "Delivery Fee PKR",
    "Total PKR",
    "Advance Required PKR",
    "Created At",
  ];

  const rows = orders.map((o) =>
    [
      o.order_code,
      o.order_type,
      o.status,
      o.payment_status,
      o.payment_method,
      o.customer_name,
      o.customer_phone,
      o.delivery_area,
      o.delivery_date,
      o.delivery_slot,
      o.subtotal_pkr,
      o.delivery_fee_pkr,
      o.total_pkr,
      o.advance_required_pkr,
      o.created_at,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="eshaal-bakes-orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
