import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProductBySlug, getStoreSettings } from "@/lib/store-db";
import { ProductDetailClient } from "@/components/shared/product-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getPublicProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getPublicProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const settings = getStoreSettings();
  return <ProductDetailClient product={product} settings={settings} />;
}
