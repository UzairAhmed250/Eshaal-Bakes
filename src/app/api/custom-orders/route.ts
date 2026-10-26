import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { createCustomOrderRequest } from "@/lib/store-db";
import { customOrderRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers);
  const rate = checkRateLimit({
    key: `custom-order:${ip}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Please wait ${rate.retryAfterSeconds}s and try again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = customOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Please check your custom cake form details.",
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

    const order = createCustomOrderRequest({
      idempotencyKey: parsed.data.idempotencyKey,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      flavourId: parsed.data.flavourId,
      weightLabel: parsed.data.weightLabel,
      themeText: parsed.data.themeText,
      designDescription: parsed.data.designDescription,
      deliveryArea: parsed.data.deliveryArea,
      deliveryAddress: parsed.data.deliveryAddress,
      deliveryDate: parsed.data.deliveryDate,
      deliverySlot: parsed.data.deliverySlot,
      customerNotes: parsed.data.customerNotes,
      referenceImagePaths: parsed.data.referenceImagePaths,
    });

    return NextResponse.json({
      order: {
        order_code: order.order_code,
        tracking_token: order.tracking_token,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not submit your custom cake request.",
      },
      { status: 400 }
    );
  }
}
