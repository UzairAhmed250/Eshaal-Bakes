import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAdminOrders, getStoreSettings } from "@/lib/store-db";
import { AdminQuotesClient } from "@/components/shared/admin-quotes-client";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const customOrders = getAdminOrders().filter(
    (o) => o.order_type === "custom"
  );
  const settings = getStoreSettings();

  return (
    <AdminQuotesClient
      initialCustomOrders={customOrders}
      settings={settings}
    />
  );
}
