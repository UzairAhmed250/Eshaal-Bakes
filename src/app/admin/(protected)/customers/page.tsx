import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getCustomersDerivedFromOrdersAdmin,
  getStoreSettings,
} from "@/lib/store-db";
import { AdminCustomersClient } from "@/components/shared/admin-customers-client";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminCustomersClient
      customers={getCustomersDerivedFromOrdersAdmin()}
      settings={getStoreSettings()}
    />
  );
}
