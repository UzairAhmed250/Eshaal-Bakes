import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getAdminOrders,
  updateOrderStatusAdmin,
} from "@/lib/store-db";
import { adminOrderStatusUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = getAdminOrders();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("summary") === "1") {
    return NextResponse.json({
      totalCount: orders.length,
      pendingCount: orders.filter(
        (o) => o.status === "pending" || o.status === "quote_requested"
      ).length,
    });
  }

  return NextResponse.json({ orders });
}

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = adminOrderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Invalid order status update payload.",
        },
        { status: 400 }
      );
    }

    const updated = updateOrderStatusAdmin({
      orderId: parsed.data.orderId,
      newStatus: parsed.data.status,
      paymentStatus: parsed.data.paymentStatus,
      internalNotes: parsed.data.internalNotes,
      cancellationReason: parsed.data.cancellationReason,
      actorId: admin.id,
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update order status.",
      },
      { status: 400 }
    );
  }
}
