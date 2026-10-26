import { NextResponse } from "next/server";
import {
  getQuoteByTokenForCustomer,
  respondToQuoteByCustomer,
} from "@/lib/store-db";
import { quoteCustomerDecisionSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const view = getQuoteByTokenForCustomer(token);
  if (!view) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }
  return NextResponse.json(view);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: unknown = await request.json();
    const parsed = quoteCustomerDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid action." },
        { status: 400 }
      );
    }

    const updatedView = respondToQuoteByCustomer({
      quoteToken: token,
      action: parsed.data.action,
      reason: parsed.data.reason,
    });

    return NextResponse.json(updatedView);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not process quote response.",
      },
      { status: 400 }
    );
  }
}
