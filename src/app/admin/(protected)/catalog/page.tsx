import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getAllCategoriesAdmin,
  getAllFlavoursAdmin,
} from "@/lib/store-db";
import { AdminCatalogClient } from "@/components/shared/admin-catalog-client";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminCatalogClient
      initialCategories={getAllCategoriesAdmin()}
      initialFlavours={getAllFlavoursAdmin()}
    />
  );
}
