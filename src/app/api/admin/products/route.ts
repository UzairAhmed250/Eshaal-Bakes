import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  deleteProductAdmin,
  getAllCategoriesAdmin,
  getAllProductsAdmin,
  upsertProductAdmin,
} from "@/lib/store-db";
import { productFormSchema } from "@/lib/validation";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    products: getAllProductsAdmin(),
    categories: getAllCategoriesAdmin(),
  });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = productFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid product data." },
        { status: 400 }
      );
    }

    const product = upsertProductAdmin({
      ...parsed.data,
      actorId: admin.id,
    });

    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save product." },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const result = deleteProductAdmin({
      productId: id,
      actorId: admin.id,
    });

    return NextResponse.json({ ok: true, softDeleted: result.softDeleted });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not delete product.",
      },
      { status: 400 }
    );
  }
}
