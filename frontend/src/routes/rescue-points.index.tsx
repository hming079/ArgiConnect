import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Clock, Building2, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { rescuePoints } from "@/lib/mock-data";

export const Route = createFileRoute("/rescue-points/")({
  head: () => ({ meta: [{ title: "Điểm giải cứu – AgriConnect" }] }),
  component: RescuePointsPage,
});

function RescuePointsPage() {
  const [active, setActive] = useState(rescuePoints[0].id);
  const selected = rescuePoints.find((p) => p.id === active)!;

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Điểm giải cứu</div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Mạng lưới điểm tiếp nhận nông sản</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tìm điểm tiếp nhận và phân phối nông sản giải cứu gần bạn nhất.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        {/* List */}
        <aside className="space-y-3">
          {rescuePoints.map((p) => {
            const pct = Math.round((p.soldKg / p.receivedKg) * 100);
            const sel = p.id === active;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`w-full rounded-2xl border p-4 text-left shadow-card transition ${
                  sel ? "border-primary bg-primary-soft/50" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{p.name}</div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    p.status === "active" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.status === "active" ? "Đang nhận" : "Đã đầy"}
                  </span>
                </div>
                <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {p.address}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.soldKg.toLocaleString("vi-VN")} / {p.receivedKg.toLocaleString("vi-VN")} kg</span>
                  <span className="font-semibold text-primary">{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </aside>

        {/* Map + detail */}
        <div className="space-y-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-primary-soft/40 to-accent/10 shadow-card">
            <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full opacity-25">
              <path
                d="M55 5 Q60 15 58 25 Q70 35 60 45 Q70 55 62 65 Q75 75 65 88 Q60 100 55 115 Q50 120 48 115 Q52 105 50 95 Q40 85 50 75 Q42 65 52 55 Q45 45 55 35 Q48 25 52 15 Z"
                fill="var(--primary)"
              />
            </svg>
            {rescuePoints.map((p) => {
              const sel = p.id === active;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.lat}%`, top: `${p.lng}%` }}
                >
                  <div className="relative grid place-items-center">
                    {sel && <span className="absolute h-10 w-10 animate-ping rounded-full bg-primary/40" />}
                    <span className={`grid h-8 w-8 place-items-center rounded-full shadow-soft transition ${
                      sel ? "scale-125 bg-primary text-primary-foreground" : "bg-card text-primary"
                    }`}>
                      <MapPin className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected detail */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold">{selected.name}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div><div className="text-xs text-muted-foreground">Địa chỉ</div>{selected.address}</div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="mt-0.5 h-4 w-4 text-primary" />
                <div><div className="text-xs text-muted-foreground">Đơn vị phụ trách</div>{selected.org}</div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="mt-0.5 h-4 w-4 text-primary" />
                <div><div className="text-xs text-muted-foreground">Thời gian hoạt động</div>{selected.hours}</div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Trạng thái</div>
                  {selected.status === "active" ? "Đang tiếp nhận" : "Đã đầy"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-primary-soft p-4">
                <div className="text-xs text-primary">Sản lượng tiếp nhận</div>
                <div className="text-2xl font-bold text-primary">{selected.receivedKg.toLocaleString("vi-VN")} kg</div>
              </div>
              <div className="rounded-xl bg-accent/20 p-4">
                <div className="text-xs text-accent-foreground">Đã tiêu thụ</div>
                <div className="text-2xl font-bold text-accent-foreground">{selected.soldKg.toLocaleString("vi-VN")} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
