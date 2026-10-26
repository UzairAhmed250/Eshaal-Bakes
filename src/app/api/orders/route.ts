import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { createFixedPriceOrder } from "@/lib/store-db";
import { fixedCheckoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers);
  const rate = checkRateLimit({
    key: `create-order:${ip}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many order requests. Please wait ${rate.retryAfterSeconds}s and try again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = fixedCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Please check your checkout fields and try again.",
        },
        { status: 400 }
      );
    }

    if (parsed.data.honeypot && parsed.data.honeypot.length > 0) {
      return NextResponse.json(
        { error: "Bot submission rejected." },
        { status: 400 }
      );
    }

    const order = createFixedPriceOrder({
      idempotencyKey: parsed.data.idempotencyKey,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      deliveryArea: parsed.data.deliveryArea,
      deliveryAddress: parsed.data.deliveryAddress,
      deliveryDate: parsed.data.deliveryDate,
      deliverySlot: parsed.data.deliverySlot,
      customerNotes: parsed.data.customerNotes,
      paymentMethod: parsed.data.paymentMethod,
      items: parsed.data.items,
    });

    return NextResponse.json({
      order: {
        order_code: order.order_code,
        tracking_token: order.tracking_token,
        total_pkr: order.total_pkr,
        advance_required_pkr: order.advance_required_pkr,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to place your order right now.",
      },
      { status: 400 }
    );
  }
}
