import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const env = getPublicEnv();
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products/", "/custom-order", "/track"],
        disallow: ["/admin/", "/api/", "/quotes/", "/orders/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
