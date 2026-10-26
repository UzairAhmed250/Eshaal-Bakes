"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, Clock, Truck } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useCart } from "@/hooks/use-cart";
import { STRINGS } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/cards";
import { EmptyState, FilterBar } from "@/components/shared/display-components";
import { SelectField } from "@/components/shared/form-fields";
import { Container, Section } from "@/components/shared/layouts";
import { useToast } from "@/components/shared/toast";
import type { Category, Product, StoreSettings } from "@/types";

export interface StorefrontHomeClientProps {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
}

export function StorefrontHomeClient({
  settings,
  categories,
  products,
}: StorefrontHomeClientProps) {
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("featured");

  const debouncedQuery = useDebounce(searchQuery, 200);

  const filteredProducts = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
        return false;
      }
      if (inStockOnly) {
        const outOfStock =
          p.track_inventory &&
          p.stock_quantity !== null &&
          p.stock_quantity <= 0;
        if (outOfStock) return false;
      }
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price_pkr - b.price_pkr);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price_pkr - a.price_pkr);
    }
    return list;
  }, [products, selectedCategory, inStockOnly, debouncedQuery, sortBy]);

  const handleQuickAdd = (product: Product) => {
    const defaultVariant = product.options[0]?.choices[0]?.label ?? "";
    const delta = product.options[0]?.choices[0]?.priceDeltaPkr ?? 0;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl:
        product.images[0]?.url ||
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
      unitPricePkr: product.price_pkr + delta,
      variantLabel: defaultVariant,
      customText: "",
      quantity: 1,
      maxStock: product.track_inventory ? product.stock_quantity : null,
    });

    toast({
      title: `${product.name} added to cart`,
      description: "Open cart to review or proceed to guest checkout.",
      variant: "success",
    });
    setCartOpen(true);
  };

  const filterControls = (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
        />
        <span>{STRINGS.home.inStockOnly}</span>
      </label>

      <SelectField
        value={sortBy}
        onChange={setSortBy}
        options={[
          { value: "featured", label: "Sort: Featured" },
          { value: "price-asc", label: "Price: Low to High" },
          { value: "price-desc", label: "Price: High to Low" },
        ]}
        className="h-9 text-xs"
      />
    </div>
  );

  return (
    <div>
      {/* Hero Banner */}
      <div className="border-b bg-gradient-to-b from-secondary/70 via-background to-background py-10 sm:py-14">
        <Container className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{STRINGS.brand.cityBadge}</span>
            </span>

            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {STRINGS.home.heroTitle}
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {STRINGS.home.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild size="lg" className="shadow-md">
                <Link href="/custom-order" data-testid="hero-custom-cake-cta">
                  <Sparkles className="h-4 w-4" />
                  <span>{STRINGS.home.requestCustomCta}</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#menu-section">{STRINGS.home.browseMenuCta}</a>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  Same-day cutoff: {settings.sameday_cutoff_time} PKT
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" />
                <span>
                  Karachi delivery: PKR {settings.delivery_fee_pkr}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>100% Halal & Belgian Couverture</span>
              </div>
            </div>
          </div>

          {/* Highlight Card for Custom Cake Request */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-primary/25 bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  Most Popular in Karachi
                </span>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-foreground">
                Planning a Birthday, Nikkah, or Aqeeqah Cake?
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Upload up to 4 reference photos, choose your favourite sponge
                flavour & weight, and receive an itemized quote link you can
                approve with one tap.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Choose from Lotus Biscoff, Belgian Fudge & more</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Private reference photo upload (up to 4 photos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Instant WhatsApp summary & live status tracking</span>
                </li>
              </ul>
              <Button asChild className="mt-5 w-full">
                <Link href="/custom-order">
                  {STRINGS.home.requestCustomCta}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Menu Section */}
      <Section id="menu-section">
        <Container className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {STRINGS.home.featuredHeading}
              </h2>
              <p className="text-sm text-muted-foreground">
                Fixed-price cakes, bento boxes, cupcakes, and brownies ready for
                online checkout.
              </p>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                selectedCategory === "all"
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "bg-card text-foreground hover:bg-accent"
              )}
            >
              {STRINGS.home.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                  selectedCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "bg-card text-foreground hover:bg-accent"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search & FilterBar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={STRINGS.home.searchPlaceholder}
            mobileFilterSheetContent={filterControls}
          >
            {filterControls}
          </FilterBar>

          {filteredProducts.length === 0 ? (
            <EmptyState
              title={STRINGS.home.emptyProductsTitle}
              description={STRINGS.home.emptyProductsDescription}
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                    setInStockOnly(false);
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickAdd={settings.is_open ? handleQuickAdd : undefined}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
