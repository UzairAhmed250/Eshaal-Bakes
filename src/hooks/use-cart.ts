"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";

const CART_STORAGE_KEY = "eshaal_bakes_cart_v1";

interface AddToCartInput {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPricePkr: number;
  variantLabel?: string;
  customText?: string;
  quantity: number;
  maxStock: number | null;
}

interface CartContextValue {
  items: CartItem[];
  totalItemsCount: number;
  subtotalPkr: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (item: AddToCartInput) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore corrupt localStorage entries
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items, hydrated]);

  const addItem = useCallback((input: AddToCartInput) => {
    const variantLabel = (input.variantLabel ?? "").trim();
    const customText = (input.customText ?? "").trim().slice(0, 60);
    const cartItemId = `${input.productId}::${variantLabel}::${customText}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex === -1) {
        const clampedQty =
          input.maxStock !== null
            ? Math.min(input.quantity, input.maxStock)
            : input.quantity;
        if (clampedQty <= 0) return prev;
        return [
          ...prev,
          {
            cartItemId,
            productId: input.productId,
            slug: input.slug,
            name: input.name,
            imageUrl: input.imageUrl,
            unitPricePkr: input.unitPricePkr,
            variantLabel,
            customText,
            quantity: clampedQty,
            maxStock: input.maxStock,
          },
        ];
      }

      return prev.map((item, idx) => {
        if (idx !== existingIndex) return item;
        const desired = item.quantity + input.quantity;
        const nextQty =
          item.maxStock !== null ? Math.min(desired, item.maxStock) : desired;
        return { ...item, quantity: nextQty };
      });
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.cartItemId !== cartItemId);
      }
      return prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const clamped =
          item.maxStock !== null ? Math.min(quantity, item.maxStock) : quantity;
        return { ...item, quantity: clamped };
      });
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItemsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalPkr = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitPricePkr * item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItemsCount,
      subtotalPkr,
      isCartOpen,
      setCartOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      totalItemsCount,
      subtotalPkr,
      isCartOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ]
  );

  return React.createElement(CartContext.Provider, { value }, children);
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
