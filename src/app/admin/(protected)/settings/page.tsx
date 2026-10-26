import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store-db";
import { AdminSettingsClient } from "@/components/shared/admin-settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminSettingsClient initialSettings={getStoreSettings()} />;
}
