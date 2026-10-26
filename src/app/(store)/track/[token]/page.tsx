import { notFound } from "next/navigation";
import {
  getStoreSettings,
  lookupOrderByTrackingToken,
} from "@/lib/store-db";
import { TrackOrderClient } from "@/components/shared/track-order-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Order Status Tracking",
};

export default async function TrackOrderByTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tracked = lookupOrderByTrackingToken(token);
  if (!tracked) {
    notFound();
  }

  const settings = getStoreSettings();
  return <TrackOrderClient settings={settings} initialOrder={tracked} />;
}
