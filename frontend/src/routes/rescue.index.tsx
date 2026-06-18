import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, MapPin, Clock, ShoppingCart, ArrowRight, Building2 } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { productBatches, categoryRich, rescuePoints, campaigns, formatVND } from "@/lib/mock-data";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/rescue/")({
  head: () => ({ meta: [{ title: "Giải cứu nông sản – AgriConnect" }] }),
  component: RescueHubPage,
});

function findCategoryByProduct(productId: string) {
  return Object.values(categoryRich).find((c) => c.productIds.includes(productId));
}

function RescueHubPage() {
  const rescuingBatches = productBatches.filter((b) => b.rescueStatus === "rescuing");
  const { add } = useCart();

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Giải cứu nông sản
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Cùng giải cứu nông sản Việt</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Các lô nông sản và chiến dịch đang cần cộng đồng chung tay tiêu thụ.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {/* Rescuing batches */}
        <section>
          <h2 className="text-xl font-bold">Lô nông sản đang giải cứu</h2>
          <p className="text-sm text-muted-foreground">Mỗi đơn hàng là một sự hỗ trợ thiết thực cho bà con</p>

          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rescuingBatches.map((b) => {
              const cat = findCategoryByProduct(b.productId);
              const point = rescuePoints.find((p) => p.id === b.rescuePointId);
              const remaining = b.quantityKg - b.soldKg;
              const pct = Math.round((b.soldKg / b.quantityKg) * 100);
              return (
                <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {cat && <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground">
                      <AlertTriangle className="h-3 w-3" /> Đang giải cứu
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-xs text-muted-foreground">{b.id}</div>
                    <h3 className="mt-0.5 font-semibold">{cat?.name} · {b.farmer}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {b.location}
                    </div>
                    {point && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {point.name}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-bold text-primary">{formatVND(b.pricePerKg)}/kg</span>
                      <span className="text-xs text-muted-foreground">Còn {remaining.toLocaleString("vi-VN")} kg</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <button
                      onClick={() => cat && add({ id: b.id, name: `Lô ${b.id} · ${cat.name}`, image: cat.image, pricePerKg: b.pricePerKg, location: b.location, qty: 20 })}
                      className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ giải cứu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Campaigns */}
        <section>
          <h2 className="text-xl font-bold">Chiến dịch giải cứu</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => {
              const pct = Math.round((c.committedKg / c.needKg) * 100);
              return (
                <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={c.image} alt={c.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{c.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.location} · {c.farmers} hộ
                    </div>
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-muted-foreground">{(c.committedKg / 1000).toFixed(0)}t / {(c.needKg / 1000).toFixed(0)}t</span>
                      <span className="font-semibold text-primary">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rescue points */}
        <section>
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold">Điểm giải cứu</h2>
            <Link to="/rescue-points" className="text-sm font-medium text-primary hover:underline">Xem tất cả →</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rescuePoints.slice(0, 6).map((p) => (
              <Link key={p.id} to="/rescue-points/$id" params={{ id: p.id }} className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="font-semibold">{p.name}</div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3" /> {p.address}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {p.hours}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
