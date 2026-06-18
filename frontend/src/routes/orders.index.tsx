import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, HeartHandshake, Clock, CheckCircle2, X } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { buyerOrders, buyerRescueHistory, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Lịch sử đơn hàng – AgriConnect" }] }),
  component: OrdersPage,
});

const tabs = ["Đơn hàng", "Chiến dịch giải cứu"] as const;

function OrdersPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Đơn hàng");

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Lịch sử mua hàng</h1>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn hàng và các chiến dịch giải cứu bạn đã tham gia.</p>

        <div className="mt-6 flex gap-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm font-medium transition ${
                tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {tab === "Đơn hàng" ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Nông sản</th>
                    <th className="px-5 py-3">Số lượng</th>
                    <th className="px-5 py-3">Ngày</th>
                    <th className="px-5 py-3 text-right">Tổng</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-4 font-mono text-xs">{o.id}</td>
                      <td className="px-5 py-4 font-medium">{o.product}</td>
                      <td className="px-5 py-4">{o.qty} kg</td>
                      <td className="px-5 py-4 text-muted-foreground">{o.date}</td>
                      <td className="px-5 py-4 text-right font-semibold text-primary">{formatVND(o.total)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge s={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {buyerRescueHistory.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <StatusBadge s={r.status} />
                </div>
                <h3 className="mt-3 font-semibold">{r.campaign}</h3>
                <div className="mt-1 text-xs text-muted-foreground">#{r.id} • {r.date}</div>
                <div className="mt-3 rounded-xl bg-primary-soft p-3">
                  <div className="text-xs text-primary">Cam kết tiêu thụ</div>
                  <div className="text-xl font-bold text-primary">{r.qty} kg</div>
                </div>
              </div>
            ))}
            <Link
              to="/coordination"
              className="grid place-items-center rounded-2xl border-2 border-dashed border-border bg-card p-5 text-center text-sm font-semibold text-primary hover:border-primary"
            >
              + Tham gia chiến dịch mới
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { c: string; i: React.ElementType }> = {
    "Đã giao": { c: "bg-primary-soft text-primary", i: CheckCircle2 },
    "Hoàn thành": { c: "bg-primary-soft text-primary", i: CheckCircle2 },
    "Đang giao": { c: "bg-accent/30 text-accent-foreground", i: ShoppingBag },
    "Đã hủy": { c: "bg-destructive/10 text-destructive", i: X },
  };
  const cur = map[s] ?? { c: "bg-muted text-muted-foreground", i: Clock };
  const Icon = cur.i;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cur.c}`}>
      <Icon className="h-3 w-3" /> {s}
    </span>
  );
}
