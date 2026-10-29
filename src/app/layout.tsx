import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/hooks/use-cart";
import { ToastProvider } from "@/components/shared/toast";
import { STRINGS } from "@/lib/strings";

export const metadata: Metadata = {
  title: {
    default: `${STRINGS.brand.defaultName} — Artisan Custom Cakes & Bakes in Karachi`,
    template: `%s | ${STRINGS.brand.defaultName}`,
  },
  description:
    "Order freshly baked signature cakes, fudgy brownies, cupcakes, and bespoke custom celebration cakes delivered across Karachi, Pakistan.",
  openGraph: {
    title: `${STRINGS.brand.defaultName} — Artisan Custom Cakes in Karachi`,
    description:
      "Handcrafted custom cakes, Korean bento cakes, cupcakes, and dessert boxes in Karachi.",
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
