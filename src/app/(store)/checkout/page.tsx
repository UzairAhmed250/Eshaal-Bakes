import { getStoreSettings } from "@/lib/store-db";
import { CheckoutClient } from "@/components/shared/checkout-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guest Checkout",
};

export default function CheckoutPage() {
  const settings = getStoreSettings();
  return <CheckoutClient settings={settings} />;
}
