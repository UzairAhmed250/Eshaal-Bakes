import { getStoreSettings } from "@/lib/store-db";
import { StoreLayout } from "@/components/shared/layouts";

export const dynamic = "force-dynamic";

export default function CustomerStorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getStoreSettings();
  return <StoreLayout settings={settings}>{children}</StoreLayout>;
}
