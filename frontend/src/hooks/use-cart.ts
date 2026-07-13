import { useEffect, useState, useCallback } from "react";
import { getCropImage } from "@/lib/crop-images";

export interface CartItem {
  id: string;
  name: string;
  image: string;
  pricePerKg: number;
  qty: number;
  location: string;
}

const KEY = "agriconnect-cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
    return stored.map((item) => ({
      ...item,
      image: getCropImage(item.name) ?? item.image,
    }));
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-changed"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const on = () => setItems(read());
    window.addEventListener("cart-changed", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("cart-changed", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const add = useCallback((it: Omit<CartItem, "qty"> & { qty?: number }) => {
    const cur = read();
    const ex = cur.find((c) => c.id === it.id);
    const qty = it.qty ?? 1;
    const next = ex
      ? cur.map((c) => (c.id === it.id ? { ...c, qty: c.qty + qty } : c))
      : [...cur, { ...it, qty }];
    write(next);
  }, []);

  const update = useCallback((id: string, qty: number) => {
    const next = read().map((c) => (c.id === id ? { ...c, qty: Math.max(1, qty) } : c));
    write(next);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  const total = items.reduce((s, i) => s + i.pricePerKg * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, add, update, remove, clear, total, count };
}
