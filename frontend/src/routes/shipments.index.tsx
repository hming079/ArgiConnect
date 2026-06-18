import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, MapPin, Package, CheckCircle2, Clock, Search } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/site-layout";
import { shipments, shipmentStatusLabels, shipmentStatusOrder, type ShipmentStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/shipments/")({
  head: () => ({ meta: [{ title: "Theo dõi vận chuyển – AgriConnect" }] }),
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const filtered = shipments.filter((s) =>
    [s.id, s.orderId, s.productName, s.from, s.to].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Truck className="h-3.5 w-3.5" /> Shipment Tracking
          </div>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Theo dõi vận chuyển</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Giám sát trạng thái giao nhận theo thời gian thực từ nông trại đến tay người mua.</p>
          <div className="mt-5 flex max-w-md items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã vận đơn, mã đơn, sản phẩm…" className="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shipmentStatusOrder.map((st) => {
            const c = shipments.filter((s) => s.status === st).length;
            return (
              <div key={st} className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
                <div className="text-2xl font-bold text-primary">{c}</div>
                <div className="mt-1 text-xs text-muted-foreground">{shipmentStatusLabels[st]}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {filtered.map((s) => (
            <article key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm font-semibold">{s.id}</span>
                    <span className="text-xs text-muted-foreground">· Đơn: {s.orderId}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold">{s.productName}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.quantityKg} kg · Người mua: {s.buyer} · Đơn vị: {s.carrier}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ETA {s.eta}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Nơi gửi</div>
                  <div className="mt-0.5 inline-flex items-center gap-1 font-medium"><MapPin className="h-4 w-4 text-primary" /> {s.from}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Nơi nhận</div>
                  <div className="mt-0.5 inline-flex items-center gap-1 font-medium"><MapPin className="h-4 w-4 text-destructive" /> {s.to}</div>
                </div>
              </div>

              <Timeline status={s.status} />
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function Timeline({ status }: { status: ShipmentStatus }) {
  const idx = shipmentStatusOrder.indexOf(status);
  return (
    <div className="mt-5">
      <div className="relative flex items-center">
        {shipmentStatusOrder.map((st, i) => {
          const done = i <= idx;
          const isLast = i === shipmentStatusOrder.length - 1;
          return (
            <div key={st} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`grid h-8 w-8 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <div className={`mt-1 max-w-20 text-center text-[10px] leading-tight ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {shipmentStatusLabels[st]}
                </div>
              </div>
              {!isLast && <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < idx ? "bg-primary" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
