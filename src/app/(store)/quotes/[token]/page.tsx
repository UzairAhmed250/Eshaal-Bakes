import { notFound } from "next/navigation";
import { getQuoteByTokenForCustomer } from "@/lib/store-db";
import { QuoteApprovalClient } from "@/components/shared/quote-approval-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Custom Cake Quote Review & Approval",
};

export default async function QuoteApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const initialView = getQuoteByTokenForCustomer(token);

  if (!initialView) {
    notFound();
  }

  return <QuoteApprovalClient initialView={initialView} token={token} />;
}
