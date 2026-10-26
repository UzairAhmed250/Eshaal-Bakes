import { notFound, redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getAdminOrderById, getStoreSettings } from "@/lib/store-db";
import { PrintSlipClient } from "@/components/shared/print-slip-client";

export const dynamic = "force-dynamic";

export default async function PrintableOrderSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const order = getAdminOrderById(id);
  if (!order) {
    notFound();
  }

  const settings = getStoreSettings();
  return <PrintSlipClient order={order} settings={settings} />;
}
