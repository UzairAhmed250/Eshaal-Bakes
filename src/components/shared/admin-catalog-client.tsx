"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  NumberInput,
  PriceInput,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/shared/form-fields";
import { PageHeader, PriceText } from "@/components/shared/display-components";
import { useToast } from "@/components/shared/toast";
import type { Category, Flavour } from "@/types";

export interface AdminCatalogClientProps {
  initialCategories: Category[];
  initialFlavours: Flavour[];
}

export function AdminCatalogClient({
  initialCategories,
  initialFlavours,
}: AdminCatalogClientProps) {
  const { toast } = useToast();
  const [categories, setCategories] =
    React.useState<Category[]>(initialCategories);
  const [flavours, setFlavours] = React.useState<Flavour[]>(initialFlavours);

  const [dialogKind, setDialogKind] = React.useState<
    "category" | "flavour" | null
  >(null);
  const [editingId, setEditingId] = React.useState<string | undefined>();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priceModifierPkr, setPriceModifierPkr] = React.useState(0);
  const [sortOrder, setSortOrder] = React.useState(1);
  const [isActive, setIsActive] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<{
    kind: "category" | "flavour";
    id: string;
    name: string;
  } | null>(null);

  const openCategoryDialog = (cat?: Category) => {
    setDialogKind("category");
    setEditingId(cat?.id);
    setName(cat?.name ?? "");
    setSlug(cat?.slug ?? "");
    setDescription(cat?.description ?? "");
    setSortOrder(cat?.sort_order ?? categories.length + 1);
    setIsActive(cat?.is_active ?? true);
  };

  const openFlavourDialog = (flav?: Flavour) => {
    setDialogKind("flavour");
    setEditingId(flav?.id);
    setName(flav?.name ?? "");
    setSlug(flav?.slug ?? "");
    setDescription(flav?.description ?? "");
    setPriceModifierPkr(flav?.price_modifier_pkr ?? 0);
    setSortOrder(flav?.sort_order ?? flavours.length + 1);
    setIsActive(flav?.is_active ?? true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogKind) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: dialogKind,
          data: {
            id: editingId,
            name,
            slug: slug || slugify(name),
            description,
            priceModifierPkr,
            sortOrder,
            isActive,
          },
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || "Could not save item.");
      }

      const refreshed = await fetch("/api/admin/catalog");
      const refreshedData = (await refreshed.json()) as {
        categories: Category[];
        flavours: Flavour[];
      };
      setCategories(refreshedData.categories);
      setFlavours(refreshedData.flavours);
      setDialogKind(null);
      toast({ title: "Catalog updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Save failed",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/admin/catalog?kind=${deleteTarget.kind}&id=${encodeURIComponent(
          deleteTarget.id
        )}`,
        { method: "DELETE" }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || "Delete failed");
      }

      if (deleteTarget.kind === "category") {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      } else {
        setFlavours((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      toast({ title: "Deleted successfully", variant: "info" });
    } catch (err) {
      toast({
        title: "Cannot delete",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories & Custom Cake Flavours"
        subtitle="Organize storefront menu categories and manage cake flavours selectable on the custom cake request form."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categories */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Store Categories ({categories.length})
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={() => openCategoryDialog()}
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </Button>
          </div>

          <div className="divide-y rounded-lg border">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {cat.name}{" "}
                    {!cat.is_active && (
                      <span className="text-xs text-muted-foreground">
                        (Hidden)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openCategoryDialog(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDeleteTarget({
                        kind: "category",
                        id: cat.id,
                        name: cat.name,
                      })
                    }
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Cake Flavours */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Custom Cake Flavours ({flavours.length})
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={() => openFlavourDialog()}
            >
              <Plus className="h-4 w-4" />
              <span>Add Flavour</span>
            </Button>
          </div>

          <div className="divide-y rounded-lg border">
            {flavours.map((flav) => (
              <div
                key={flav.id}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{flav.name}</p>
                    {flav.price_modifier_pkr > 0 && (
                      <span className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        +<PriceText amountPkr={flav.price_modifier_pkr} size="sm" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {flav.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openFlavourDialog(flav)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDeleteTarget({
                        kind: "flavour",
                        id: flav.id,
                        name: flav.name,
                      })
                    }
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create/Edit Category or Flavour via ResponsiveDialog */}
      <ResponsiveDialog
        open={Boolean(dialogKind)}
        onOpenChange={(open) => {
          if (!open) setDialogKind(null);
        }}
        size="md"
      >
        <ResponsiveDialogContent
          ariaLabel={
            dialogKind === "category" ? "Category Form" : "Flavour Form"
          }
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingId ? "Edit" : "Create"}{" "}
              {dialogKind === "category" ? "Category" : "Cake Flavour"}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <form onSubmit={handleSave}>
            <ResponsiveDialogBody className="space-y-4">
              <TextInput
                label="Name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) setSlug(slugify(e.target.value));
                }}
              />
              <TextInput
                label="Slug"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
              <TextArea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {dialogKind === "flavour" && (
                <PriceInput
                  label="Premium Flavour Surcharge (PKR)"
                  value={priceModifierPkr}
                  onChange={setPriceModifierPkr}
                />
              )}
              <NumberInput
                label="Display Sort Order"
                value={sortOrder}
                onChange={setSortOrder}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active on Storefront</span>
              </label>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogKind(null)}
              >
                Cancel
              </Button>
              <SubmitButton isLoading={isSaving}>Save</SubmitButton>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        description="This item will be permanently removed if no active products depend on it."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
