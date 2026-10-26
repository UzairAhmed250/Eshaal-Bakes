import { getStoreSettings } from "@/lib/store-db";
import { TrackOrderClient } from "@/components/shared/track-order-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track Your Order",
};

export default function TrackOrderLookupPage() {
  const settings = getStoreSettings();
  return <TrackOrderClient settings={settings} initialOrder={null} />;
}
