import { getPublicFlavours, getStoreSettings } from "@/lib/store-db";
import { CustomOrderClient } from "@/components/shared/custom-order-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Request a Custom Cake Quote",
  description:
    "Design your bespoke birthday, Nikkah, or celebration cake in Karachi. Upload reference photos and get a personalized quote.",
};

export default function CustomOrderPage() {
  const settings = getStoreSettings();
  const flavours = getPublicFlavours();

  return <CustomOrderClient settings={settings} flavours={flavours} />;
}
