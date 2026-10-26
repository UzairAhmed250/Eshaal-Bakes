import {
  getPublicCategories,
  getPublicProducts,
  getStoreSettings,
} from "@/lib/store-db";
import { StorefrontHomeClient } from "@/components/shared/storefront-home-client";

export const dynamic = "force-dynamic";

export default function StorefrontHomePage() {
  const settings = getStoreSettings();
  const categories = getPublicCategories();
  const products = getPublicProducts();

  return (
    <StorefrontHomeClient
      settings={settings}
      categories={categories}
      products={products}
    />
  );
}
