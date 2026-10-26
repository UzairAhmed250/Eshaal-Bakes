import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  deleteCategoryAdmin,
  deleteFlavourAdmin,
  getAllCategoriesAdmin,
  getAllFlavoursAdmin,
  upsertCategoryAdmin,
  upsertFlavourAdmin,
} from "@/lib/store-db";
import { categoryFormSchema, flavourFormSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    categories: getAllCategoriesAdmin(),
    flavours: getAllFlavoursAdmin(),
  });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      kind?: "category" | "flavour";
      data?: unknown;
    };

    if (body.kind === "category") {
      const parsed = categoryFormSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid category." },
          { status: 400 }
        );
      }
      const category = upsertCategoryAdmin({
        ...parsed.data,
        actorId: admin.id,
      });
      return NextResponse.json({ category });
    }

    if (body.kind === "flavour") {
      const parsed = flavourFormSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid flavour." },
          { status: 400 }
        );
      }
      const flavour = upsertFlavourAdmin({
        ...parsed.data,
        actorId: admin.id,
      });
      return NextResponse.json({ flavour });
    }

    return NextResponse.json(
      { error: "Specify kind: 'category' or 'flavour'." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save item." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");
    if (!id || (kind !== "category" && kind !== "flavour")) {
      return NextResponse.json(
        { error: "Valid kind and id parameters are required." },
        { status: 400 }
      );
    }

    if (kind === "category") {
      deleteCategoryAdmin({ categoryId: id, actorId: admin.id });
    } else {
      deleteFlavourAdmin({ flavourId: id, actorId: admin.id });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete item." },
      { status: 400 }
    );
  }
}
