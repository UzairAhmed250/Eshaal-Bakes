import { NextResponse } from "next/server";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import {
  lookupOrderByCodeAndPhone,
  lookupOrderByTrackingToken,
} from "@/lib/store-db";
import { trackingLookupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers);
  const rate = checkRateLimit({
    key: `track-lookup:${ip}`,
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many lookup attempts. Please wait ${rate.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      token?: string;
      orderCode?: string;
      phone?: string;
    };

    if (body.token) {
      const tracked = lookupOrderByTrackingToken(body.token);
      if (!tracked) {
        return NextResponse.json(
          { error: "Order not found for this tracking link." },
          { status: 404 }
        );
      }
      return NextResponse.json({ order: tracked });
    }

    const parsed = trackingLookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Enter a valid Order Code and Pakistani mobile number.",
        },
        { status: 400 }
      );
    }

    const tracked = lookupOrderByCodeAndPhone(
      parsed.data.orderCode,
      parsed.data.phone
    );
    if (!tracked) {
      return NextResponse.json(
        {
          error:
            "No matching order found. Please check your Order Code and phone number.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: tracked });
  } catch {
    return NextResponse.json(
      { error: "Unable to look up order status." },
      { status: 500 }
    );
  }
}
