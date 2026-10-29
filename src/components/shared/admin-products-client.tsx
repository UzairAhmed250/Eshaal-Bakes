"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn, slugify } from "@/lib/utils";
import { productFormSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  NumberInput,
  PriceInput,
  SelectField,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/shared/form-fields";
import {
  FilterBar,
  PageHeader,
  PriceText,
} from "@/components/shared/display-components";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { useToast } from "@/components/shared/toast";
import type { Category, Product } from "@/types";

export interface AdminProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export function AdminProductsClient({
  initialProducts,
  categories,
}: AdminProductsClientProps) {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Create/Edit ResponsiveDialog state
  const [formOpen, setFormOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | undefined>();
  const [categoryId, setCategoryId] = React.useState(
    categories[0]?.id ?? ""
  );
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pricePkr, setPricePkr] = React.useState(2500);
  const [compareAtPricePkr, setCompareAtPricePkr] = React.useState(0);
  const [trackInventory, setTrackInventory] = React.useState(true);
  const [stockQuantity, setStockQuantity] = React.useState(10);
  const [allowCustomText, setAllowCustomText] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);
  const [imageUrls, setImageUrls] = React.useState<string[]>([
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  ]);
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [variantChoicesText, setVariantChoicesText] = React.useState(
    "1.5 lb (Standard):0, 2.5 lb (Large):1800"
  );

  // Delete ConfirmDialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Inline field validation errors (keyed by productFormSchema field name)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );
  const formRef = React.useRef<HTMLFormElement>(null);

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const openCreateModal = () => {
    setFieldErrors({});
    setEditingId(undefined);
    setCategoryId(categories[0]?.id ?? "");
    setName("");
    setSlug("");
    setDescription("");
    setPricePkr(2500);
    setCompareAtPricePkr(0);
    setTrackInventory(true);
    setStockQuantity(10);
    setAllowCustomText(true);
    setIsActive(true);
    setImageUrls([
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
    ]);
    setVariantChoicesText("");
    setFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFieldErrors({});
    setEditingId(product.id);
    setCategoryId(product.category_id);
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description);
    setPricePkr(product.price_pkr);
    setCompareAtPricePkr(product.compare_at_price_pkr ?? 0);
    setTrackInventory(product.track_inventory);
    setStockQuantity(product.stock_quantity ?? 0);
    setAllowCustomText(product.allow_custom_text);
    setIsActive(product.is_active);
    setImageUrls(
      product.images.length > 0
        ? product.images.map((i) => i.url)
        : [
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
          ]
    );
    const firstOpt = product.options[0];
    setVariantChoicesText(
      firstOpt
        ? firstOpt.choices
            .map((c) => `${c.label}:${c.priceDeltaPkr}`)
            .join(", ")
        : ""
    );
    setFormOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedChoices = variantChoicesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const [labelPart, deltaPart] = pair.split(":");
        return {
          label: (labelPart ?? "").trim(),
          priceDeltaPkr: Number.parseInt(deltaPart ?? "0", 10) || 0,
        };
      })
      .filter((c) => c.label.length > 0);

    const payload = {
      id: editingId,
      categoryId,
      name,
      slug: slug || slugify(name),
      description,
      pricePkr,
      compareAtPricePkr:
        compareAtPricePkr > pricePkr ? compareAtPricePkr : null,
      trackInventory,
      stockQuantity: trackInventory ? stockQuantity : null,
      allowCustomText,
      isActive,
      images: imageUrls.map((url, idx) => ({
        url,
        altText: name,
        sortOrder: idx,
      })),
      options:
        parsedChoices.length > 0
          ? [
              {
                name: "Option",
                required: true,
                choices: parsedChoices,
              },
            ]
          : [],
    };

    // Client-side validation with the same Zod schema the API uses
    const validation = productFormSchema.safeParse(payload);
    if (!validation.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      toast({
        title: "Please fix the highlighted fields",
        description: Object.values(nextErrors)[0],
        variant: "error",
      });
      // Scroll the first invalid field into view inside the modal body
      requestAnimationFrame(() => {
        const firstInvalid = formRef.current?.querySelector<HTMLElement>(
          '[aria-invalid="true"]'
        );
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid?.focus({ preventScroll: true });
      });
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      const refreshed = await fetch("/api/admin/products");
      const refreshedJson = (await refreshed.json()) as {
        products: Product[];
      };
      setProducts(refreshedJson.products);
      setFormOpen(false);
      toast({
        title: editingId ? "Product updated" : "Product created",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Error saving product",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/products?id=${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as {
        error?: string;
        softDeleted?: boolean;
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not delete product.");
      }

      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast({
        title: data.softDeleted
          ? "Product archived (soft-deleted because it has past orders)"
          : "Product deleted",
        variant: "info",
      });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= imageUrls.length) return;
    const copy = [...imageUrls];
    const [item] = copy.splice(from, 1);
    if (!item) return;
    copy.splice(to, 0, item);
    setImageUrls(copy);
  };

  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category_name ?? "").toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              p.images[0]?.url ||
              "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80"
            }
            alt={p.name}
            className="h-11 w-11 rounded-lg object-cover"
          />
          <div>
            <p className="font-semibold text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.category_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price (PKR)",
      sortable: true,
      sortValue: (p) => p.price_pkr,
      render: (p) => (
        <PriceText
          amountPkr={p.price_pkr}
          compareAtPkr={p.compare_at_price_pkr}
          size="sm"
        />
      ),
    },
    {
      key: "stock",
      header: "Inventory",
      render: (p) =>
        !p.track_inventory ? (
          <span className="text-xs text-muted-foreground">Unlimited</span>
        ) : (
          <span className="font-mono text-xs font-semibold">
            {p.stock_quantity ?? 0} in stock
          </span>
        ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (p) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            p.is_active
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {p.is_active ? "Active" : "Hidden"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openEditModal(p)}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Delete ${p.name}`}
            onClick={() => setDeleteTarget(p)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Menu Inventory"
        subtitle="Manage fixed-price cakes, cupcakes, brownie slabs, variants, and daily stock."
        actions={
          <Button type="button" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search products by name, slug, or category..."
      />

      <DataTable
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => p.id}
        renderMobileCard={(p) => (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category_name}</p>
              </div>
              <PriceText amountPkr={p.price_pkr} size="sm" />
            </div>
            <div className="flex items-center justify-between border-t pt-2.5">
              <span className="text-xs text-muted-foreground">
                {p.track_inventory
                  ? `${p.stock_quantity ?? 0} in stock`
                  : "Unlimited"}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(p)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(p)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      />

      {/* Product Create/Edit Modal/Drawer via ResponsiveDialog */}
      <ResponsiveDialog open={formOpen} onOpenChange={setFormOpen} size="lg">
        <ResponsiveDialogContent
          ariaLabel={editingId ? "Edit Product" : "Create Product"}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingId ? "Edit Product" : "Add New Bakery Product"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              All prices are stored in integer PKR.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form
            ref={formRef}
            noValidate
            onSubmit={handleSaveProduct}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <ResponsiveDialogBody className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Product Name"
                  required
                  value={name}
                  error={fieldErrors.name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                    if (!editingId) {
                      setSlug(slugify(e.target.value));
                      clearFieldError("slug");
                    }
                  }}
                />
                <TextInput
                  label="URL Slug"
                  required
                  value={slug}
                  error={fieldErrors.slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    clearFieldError("slug");
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SelectField
                  label="Category"
                  required
                  value={categoryId}
                  error={fieldErrors.categoryId}
                  onChange={(v) => {
                    setCategoryId(v);
                    clearFieldError("categoryId");
                  }}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
                <PriceInput
                  label="Price (PKR)"
                  required
                  value={pricePkr}
                  error={fieldErrors.pricePkr}
                  onChange={(v) => {
                    setPricePkr(v);
                    clearFieldError("pricePkr");
                  }}
                />
                <PriceInput
                  label="Compare-at Price (Optional)"
                  value={compareAtPricePkr}
                  error={fieldErrors.compareAtPricePkr}
                  onChange={(v) => {
                    setCompareAtPricePkr(v);
                    clearFieldError("compareAtPricePkr");
                  }}
                />
              </div>

              <TextArea
                label="Description"
                required
                value={description}
                error={fieldErrors.description}
                helperText="Minimum 5 characters."
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError("description");
                }}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                  />
                  <span>Track Daily Stock</span>
                </label>

                {trackInventory && (
                  <NumberInput
                    label="Available Stock"
                    value={stockQuantity}
                    error={fieldErrors.stockQuantity}
                    onChange={(v) => {
                      setStockQuantity(v);
                      clearFieldError("stockQuantity");
                    }}
                  />
                )}

                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={allowCustomText}
                    onChange={(e) => setAllowCustomText(e.target.checked)}
                  />
                  <span>Allow Cake Message</span>
                </label>

                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Visible on Storefront</span>
                </label>
              </div>

              <TextInput
                label="Variants / Options (Format: Label:PriceDeltaPKR, comma-separated)"
                helperText="Example: 1.5 lb (Standard):0, 2.5 lb (Large):1800"
                value={variantChoicesText}
                error={fieldErrors.options}
                onChange={(e) => {
                  setVariantChoicesText(e.target.value);
                  clearFieldError("options");
                }}
              />

              {/* Multiple Images Management (Add, Reorder, Delete) */}
              <div
                className={cn(
                  "space-y-2 rounded-lg border p-3",
                  fieldErrors.images && "border-destructive"
                )}
              >
                <p className="text-sm font-medium">
                  Product Gallery Images ({imageUrls.length})
                </p>
                {fieldErrors.images && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {fieldErrors.images}
                  </p>
                )}
                <div className="space-y-2">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded border bg-background p-2 text-xs"
                    >
                      <span className="truncate flex-1">{url}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move image up"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, idx - 1)}
                          className="rounded p-1 hover:bg-muted disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move image down"
                          disabled={idx === imageUrls.length - 1}
                          onClick={() => moveImage(idx, idx + 1)}
                          className="rounded p-1 hover:bg-muted disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove image"
                          disabled={imageUrls.length <= 1}
                          onClick={() =>
                            setImageUrls((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <TextInput
                    placeholder="https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setImageUrls((prev) => [...prev, newImageUrl.trim()]);
                        setNewImageUrl("");
                        clearFieldError("images");
                      }
                    }}
                  >
                    Add URL
                  </Button>
                </div>
              </div>
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton isLoading={isSaving}>
                {editingId ? "Update Product" : "Create Product"}
              </SubmitButton>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Delete Confirmation via ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        description="If this product has existing customer orders, it will be safely soft-deleted (archived) so order history remains intact."
        variant="destructive"
        confirmLabel="Confirm Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
