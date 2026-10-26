import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";
import { getPublicProducts } from "@/lib/store-db";

export default function sitemap(): MetadataRoute.Sitemap {
  const env = getPublicEnv();
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const products = getPublicProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/custom-order`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
