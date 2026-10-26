import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { AdminLayout } from "@/components/shared/layouts";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminLayout adminEmail={admin.email}>{children}</AdminLayout>;
}
