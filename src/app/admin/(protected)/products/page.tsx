import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getAllCategoriesAdmin,
  getAllProductsAdmin,
} from "@/lib/store-db";
import { AdminProductsClient } from "@/components/shared/admin-products-client";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const products = getAllProductsAdmin();
  const categories = getAllCategoriesAdmin();

  return (
    <AdminProductsClient
      initialProducts={products}
      categories={categories}
    />
  );
}
