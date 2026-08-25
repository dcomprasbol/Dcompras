"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(storeSlug: string) {
  return `cart:${storeSlug}`;
}

export function CartProvider({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug));
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage no disponible o dato corrupto: arrancamos con carrito vacío
    }
    setHydrated(true);
  }, [storeSlug]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey(storeSlug), JSON.stringify(items));
  }, [items, storeSlug, hydrated]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      );
      if (idx >= 0) {
        const copy = [...prev];
        const nextQty = copy[idx].quantity + newItem.quantity;
        copy[idx] = {
          ...copy[idx],
          quantity: newItem.maxStock ? Math.min(nextQty, newItem.maxStock) : nextQty,
        };
        return copy;
      }
      return [...prev, newItem];
    });
  }

  function updateQuantity(productId: string, variantId: string | null, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: Math.max(0, quantity) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId: string, variantId: string | null) {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  }

  function clear() {
    setItems([]);
  }

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de un CartProvider");
  return ctx;
}
