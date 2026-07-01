import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CreditCard, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import type { CropBatch } from "@/api/cropApi";
import { CropLockBanner } from "@/components/croplock-banner";
import { PageShell } from "@/components/site-layout";
import { useCart } from "@/hooks/use-cart";
import { useCropBatches } from "@/hooks/use-crops";

export const Route = createFileRoute("/cart/")({
  head: () => ({ meta: [{ title: "Giỏ hàng - AgriConnect" }] }),
  component: CartPage,
});

function CartPage() {
  const nav = useNavigate();
  const { items, update, remove, clear } = useCart();
  const batchesQuery = useCropBatches();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const batchById = useMemo(() => new Map((batchesQuery.data ?? []).map((batch) => [batch.id, batch])), [batchesQuery.data]);

  useEffect(() => {
    setSelectedIds((current) => {
      const valid = current.filter((id) => items.some((item) => item.id === id));
      return valid.length > 0 || items.length === 0 ? valid : items.map((item) => item.id);
    });
  }, [items]);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.pricePerKg * item.qty, 0);
  const shipping = selectedItems.length ? 30000 : 0;

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((itemId) => itemId !== id));
  }

  function paySelected() {
    window.localStorage.setItem("agriconnect-checkout-selection", JSON.stringify(selectedIds));
    nav({ to: "/checkout" });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn từng lô nông sản để thanh toán.</p>
        <div className="mt-5"><CropLockBanner /></div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Giỏ hàng đang trống</h3>
            <p className="mt-1 text-sm text-muted-foreground">Khám phá nông sản đang bán từ các lô thực tế.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/products" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Xem nông sản</Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="text-sm font-medium">{selectedItems.length} / {items.length} lô được chọn</div>
                <button onClick={clear} className="text-xs text-destructive hover:underline">Xóa tất cả</button>
              </div>
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const batch = getBatchForCartItem(item.id, batchById);
                  const batchId = getBatchIdFromCartId(item.id);
                  const unit = batch?.unit ?? "kg";
                  return (
                    <li key={item.id} className="flex items-center gap-4 p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(event) => toggleSelected(item.id, event.target.checked)}
                        className="h-4 w-4 accent-[oklch(0.52_0.16_145)]"
                      />
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                      ) : (
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-semibold text-primary">
                          {batchId ? `#${batchId}` : "Lô"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.location}</div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>Crop batch: <strong className="text-foreground">#{batchId ?? "?"}</strong></span>
                          <span>Farmer: <strong className="text-foreground">{batch?.farmerName ?? "Đang tải"}</strong></span>
                        </div>
                        <div className="mt-1 text-sm font-bold text-primary">{formatVND(item.pricePerKg)}/{unit}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => update(item.id, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-muted">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(event) => update(item.id, Number(event.target.value) || 1)}
                          className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm"
                        />
                        <span className="text-xs text-muted-foreground">{unit}</span>
                        <button onClick={() => update(item.id, item.qty + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-muted">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="hidden w-28 text-right font-semibold sm:block">{formatVND(item.pricePerKg * item.qty)}</div>
                      <button onClick={() => remove(item.id)} className="grid h-8 w-8 place-items-center rounded-full text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold">Tóm tắt đơn hàng</h3>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Tạm tính" v={formatVND(subtotal)} />
                <Row label="Phí vận chuyển" v={formatVND(shipping)} />
                <div className="my-3 border-t border-border" />
                <Row label="Tổng cộng" v={formatVND(subtotal + shipping)} strong />
              </div>
              <button
                onClick={paySelected}
                disabled={selectedItems.length === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" /> Thanh toán lô đã chọn <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/products" className="mt-3 block text-center text-xs text-muted-foreground hover:underline">
                Tiếp tục mua sắm
              </Link>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function getBatchIdFromCartId(id: string) {
  const match = id.match(/^batch-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getBatchForCartItem(id: string, batchById: Map<number, CropBatch>) {
  const batchId = getBatchIdFromCartId(id);
  return batchId == null ? undefined : batchById.get(batchId);
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function Row({ label, v, strong }: { label: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-lg font-bold text-primary" : "font-medium"}>{v}</span>
    </div>
  );
}