import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Clock, CheckCircle2, Heart, Search, HeartHandshake, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { buyerOrders, products, buyerRescueHistory, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/buyer/")({
  head: () => ({ meta: [{ title: "Tài khoản người mua – AgriConnect" }] }),
  component: BuyerDashboard,
});

function BuyerDashboard() {
  const saved = products.slice(0, 3);
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Tài khoản người mua</div>
            <h1 className="mt-1 text-3xl font-bold">Xin chào, chị Lan 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn hàng và nông sản bạn quan tâm.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/shipments" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted">Vận chuyển</Link>
            <Link to="/orders" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted">
              <Clock className="h-4 w-4" /> Lịch sử
            </Link>
            <Link to="/cart" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted">
              <ShoppingBag className="h-4 w-4" /> Giỏ hàng
            </Link>
            <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
              <Search className="h-4 w-4" /> Tìm nông sản
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: ShoppingBag, l: "Tổng đơn hàng", v: buyerOrders.length, sub: "Tháng này" },
            { i: Clock, l: "Đang giao", v: buyerOrders.filter((o) => o.status === "Đang giao").length, sub: "Cập nhật realtime" },
            { i: CheckCircle2, l: "Đã hoàn thành", v: buyerOrders.filter((o) => o.status === "Đã giao").length, sub: "100% hài lòng" },
            { i: Heart, l: "Nông sản đã lưu", v: saved.length, sub: "Yêu thích" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-bold">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-xs font-medium text-primary">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Orders */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
              <button className="text-sm font-medium text-primary hover:underline">Xem tất cả</button>
            </div>
            <div className="divide-y divide-border">
              {buyerOrders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-3 p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{o.product}</span>
                      <span className="font-mono text-xs text-muted-foreground">#{o.id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{o.qty}kg • {o.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{formatVND(o.total)}</div>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      o.status === "Đã giao" ? "bg-primary-soft text-primary" :
                      o.status === "Đang giao" ? "bg-accent/30 text-accent-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Đã lưu</h2>
              <Heart className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-3">
              {saved.map((p) => (
                <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted">
                  <img src={p.image} alt="" loading="lazy" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.location}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatVND(p.pricePerKg)}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Rescue history */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                <HeartHandshake className="h-3.5 w-3.5" /> Chiến dịch giải cứu
              </div>
              <h2 className="mt-1 text-lg font-semibold">Bạn đã tham gia</h2>
            </div>
            <Link to="/coordination" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Tham gia thêm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {buyerRescueHistory.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">#{r.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.status === "Hoàn thành" ? "bg-primary-soft text-primary" : "bg-accent/30 text-accent-foreground"
                  }`}>{r.status}</span>
                </div>
                <div className="mt-2 font-semibold">{r.campaign}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.date}</div>
                <div className="mt-3 text-sm">Cam kết: <span className="font-bold text-primary">{r.qty} kg</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
