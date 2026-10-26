"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Sparkles, CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { STRINGS } from "@/lib/strings";
import { formatPKR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ImageGallery, PriceText } from "@/components/shared/display-components";
import {
  QuantityStepper,
  SelectField,
  TextInput,
} from "@/components/shared/form-fields";
import { Container, Section } from "@/components/shared/layouts";
import { useToast } from "@/components/shared/toast";
import type { Product, StoreSettings } from "@/types";

export function ProductDetailClient({
  product,
  settings,
}: {
  product: Product;
  settings: StoreSettings;
}) {
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();

  const firstOption = product.options[0];
  const [selectedChoiceLabel, setSelectedChoiceLabel] = React.useState<string>(
    firstOption?.choices[0]?.label ?? ""
  );
  const [customText, setCustomText] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);

  const selectedChoice = firstOption?.choices.find(
    (c) => c.label === selectedChoiceLabel
  );
  const unitPricePkr =
    product.price_pkr + (selectedChoice?.priceDeltaPkr ?? 0);

  const isOutOfStock =
    product.track_inventory &&
    product.stock_quantity !== null &&
    product.stock_quantity <= 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl:
        product.images[0]?.url ||
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
      unitPricePkr,
      variantLabel: selectedChoiceLabel,
      customText: product.allow_custom_text ? customText : "",
      quantity,
      maxStock: product.track_inventory ? product.stock_quantity : null,
    });

    toast({
      title: STRINGS.product.addedToCart,
      description: `${quantity}x ${product.name}`,
      variant: "success",
    });
    setCartOpen(true);
  };

  return (
    <Section>
      <Container className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span>{STRINGS.product.backToMenu}</span>
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ImageGallery images={product.images} productName={product.name} />

          <div className="space-y-6">
            <div className="space-y-2 border-b pb-4">
              {product.category_name && (
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {product.category_name}
                </p>
              )}
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 pt-1">
                <PriceText
                  amountPkr={unitPricePkr}
                  compareAtPkr={product.compare_at_price_pkr}
                  size="xl"
                />
                {isOutOfStock ? (
                  <span className="rounded-full bg-destructive/15 px-3 py-0.5 text-xs font-semibold text-destructive">
                    {STRINGS.product.outOfStock}
                  </span>
                ) : product.track_inventory && product.stock_quantity !== null ? (
                  <span className="rounded-full bg-success/15 px-3 py-0.5 text-xs font-semibold text-success">
                    {product.stock_quantity} {STRINGS.product.lowStockSuffix}
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
                    {STRINGS.product.unlimitedStock}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="space-y-4 rounded-2xl border bg-card p-5">
              {firstOption && firstOption.choices.length > 0 && (
                <SelectField
                  label={firstOption.name || STRINGS.product.selectOption}
                  value={selectedChoiceLabel}
                  onChange={setSelectedChoiceLabel}
                  options={firstOption.choices.map((c) => ({
                    value: c.label,
                    label:
                      c.priceDeltaPkr > 0
                        ? `${c.label} (+${formatPKR(c.priceDeltaPkr)})`
                        : c.label,
                  }))}
                />
              )}

              {product.allow_custom_text && (
                <TextInput
                  label={STRINGS.product.customTextLabel}
                  placeholder={STRINGS.product.customTextPlaceholder}
                  maxLength={60}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
              )}

              <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">
                    {STRINGS.product.quantityLabel}
                  </p>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    max={product.track_inventory ? product.stock_quantity : 20}
                    disabled={isOutOfStock}
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  disabled={isOutOfStock || !settings.is_open}
                  data-testid="add-to-cart-button"
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-initial"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>
                    {!settings.is_open
                      ? "Store Currently Closed"
                      : isOutOfStock
                        ? STRINGS.product.outOfStock
                        : `${STRINGS.product.addToCart} — ${formatPKR(
                            unitPricePkr * quantity
                          )}`}
                  </span>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-secondary/40 p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  Karachi-wide delivery ({formatPKR(settings.delivery_fee_pkr)})
                </span>
              </p>
              <p>
                Want a custom theme, fondant character, or multi-tier cake
                instead?{" "}
                <Link
                  href="/custom-order"
                  className="inline-flex items-center gap-1 font-semibold text-primary underline"
                >
                  <Sparkles className="h-3 w-3" />
                  Request a Custom Cake Quote
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
