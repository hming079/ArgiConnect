import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CreditCard } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { useCart } from "@/hooks/use-cart";
import { formatVND, products } from "@/lib/mock-data";
import { CropLockBanner } from "@/components/croplock-banner";

export const Route = createFileRoute("/cart/")({
  head: () => ({ meta: [{ title: "Giỏ hàng – AgriConnect" }] }),
  component: CartPage,
});

function CartPage() {
  const nav = useNavigate();
  const { items, update, remove, clear, total } = useCart();
  const shipping = items.length ? 30000 : 0;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-muted-foreground">Đặt nhiều lô nông sản trong một đơn duy nhất.</p>
        <div className="mt-5"><CropLockBanner /></div>


        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Giỏ hàng đang trống</h3>
            <p className="mt-1 text-sm text-muted-foreground">Khám phá nông sản đang cần giải cứu.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/products" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Xem nông sản</Link>
              <button
                onClick={() => {
                  // seed cart with samples
                  const seed = products.slice(0, 2);
                  seed.forEach((p) => {
                    window.localStorage.setItem(
                      "agriconnect-cart",
                      JSON.stringify([
                        ...JSON.parse(window.localStorage.getItem("agriconnect-cart") || "[]"),
                        { id: p.id, name: p.name, image: p.image, pricePerKg: p.pricePerKg, qty: 10, location: p.location },
                      ])
                    );
                  });
                  window.dispatchEvent(new Event("cart-changed"));
                }}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              >
                Thêm mẫu
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="text-sm font-medium">{items.length} lô nông sản</div>
                <button onClick={clear} className="text-xs text-destructive hover:underline">Xóa tất cả</button>
              </div>
              <ul className="divide-y divide-border">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-4 p-4">
                    <img src={it.image} alt={it.name} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{it.location}</div>
                      <div className="mt-1 text-sm font-bold text-primary">{formatVND(it.pricePerKg)}/kg</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => update(it.id, it.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-muted">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        value={it.qty}
                        onChange={(e) => update(it.id, Number(e.target.value) || 1)}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm"
                      />
                      <span className="text-xs text-muted-foreground">kg</span>
                      <button onClick={() => update(it.id, it.qty + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-muted">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="hidden w-28 text-right font-semibold sm:block">{formatVND(it.pricePerKg * it.qty)}</div>
                    <button onClick={() => remove(it.id)} className="grid h-8 w-8 place-items-center rounded-full text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold">Tóm tắt đơn hàng</h3>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Tạm tính" v={formatVND(total)} />
                <Row label="Phí vận chuyển" v={formatVND(shipping)} />
                <div className="my-3 border-t border-border" />
                <Row label="Tổng cộng" v={formatVND(total + shipping)} strong />
              </div>
              <button
                onClick={() => nav({ to: "/checkout" })}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                <CreditCard className="h-4 w-4" /> Thanh toán <ArrowRight className="h-4 w-4" />
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

function Row({ label, v, strong }: { label: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-lg font-bold text-primary" : "font-medium"}>{v}</span>
    </div>
  );
}
