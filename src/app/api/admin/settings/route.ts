import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getStoreSettings, updateStoreSettingsAdmin } from "@/lib/store-db";
import { storeSettingsFormSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ settings: getStoreSettings() });
}

export async function PUT(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = storeSettingsFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Invalid store settings input.",
        },
        { status: 400 }
      );
    }

    const updated = updateStoreSettingsAdmin({
      settings: parsed.data,
      actorId: admin.id,
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update store settings.",
      },
      { status: 400 }
    );
  }
}
