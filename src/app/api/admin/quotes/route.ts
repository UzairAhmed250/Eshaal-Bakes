import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  createOrReviseQuoteAdmin,
  getAdminOrders,
  markQuoteExpiredAdmin,
} from "@/lib/store-db";
import { sendOrReviseQuoteSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customOrders = getAdminOrders().filter(
    (o) => o.order_type === "custom"
  );
  return NextResponse.json({ orders: customOrders });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "send_or_revise" | "mark_expired";
      orderId?: string;
      pricePkr?: number;
      advancePkr?: number;
      validityHours?: number;
      notes?: string;
    };

    if (body.action === "mark_expired") {
      if (!body.orderId) {
        return NextResponse.json(
          { error: "orderId is required." },
          { status: 400 }
        );
      }
      const updated = markQuoteExpiredAdmin({
        orderId: body.orderId,
        actorId: admin.id,
      });
      return NextResponse.json({ order: updated });
    }

    const parsed = sendOrReviseQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid quote details." },
        { status: 400 }
      );
    }

    const quote = createOrReviseQuoteAdmin({
      ...parsed.data,
      actorId: admin.id,
    });

    return NextResponse.json({ quote });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not process quote." },
      { status: 400 }
    );
  }
}
