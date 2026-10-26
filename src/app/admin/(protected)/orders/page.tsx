import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAdminOrders, getStoreSettings } from "@/lib/store-db";
import { AdminOrdersClient } from "@/components/shared/admin-orders-client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminOrdersClient
      initialOrders={getAdminOrders()}
      settings={getStoreSettings()}
    />
  );
}
