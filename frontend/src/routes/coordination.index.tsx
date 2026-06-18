import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, TrendingUp, MapPin, Activity, Truck, Radio, Package, BarChart3, ArrowRight, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import {
  rescueZones,
  shipments,
  shipmentStatusLabels,
  provinceStats,
  daysToConsume,
  congestionRisk,
  forecastInventoryWeekly,
} from "@/lib/mock-data";

export const Route = createFileRoute("/coordination/")({
  head: () => ({
    meta: [
      { title: "Dashboard điều phối – AgriConnect" },
      { name: "description", content: "Phân tích dữ liệu và hỗ trợ ra quyết định điều phối nông sản." },
    ],
  }),
  component: CoordinationPage,
});

const urgencyColor = (u: string) =>
  u === "rescue" ? "bg-destructive" : u === "high" ? "bg-accent" : "bg-primary";

function CoordinationPage() {
  const totals = provinceStats.reduce(
    (acc, p) => ({
      total: acc.total + p.totalKg,
      inventory: acc.inventory + p.inventoryKg,
      rescuing: acc.rescuing + p.rescuingKg,
      consumed: acc.consumed + p.consumedKg,
      inTransit: acc.inTransit + p.inTransitKg,
    }),
    { total: 0, inventory: 0, rescuing: 0, consumed: 0, inTransit: 0 },
  );

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Activity className="h-3.5 w-3.5" /> Supply Chain Control Tower
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard điều phối nông sản</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Phân tích dữ liệu sản lượng, dự báo cung cầu và hỗ trợ ra quyết định điều phối theo thời gian thực.
          </p>
          <div className="mt-4">
            <Link to="/analytics" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90">
              <BarChart3 className="h-4 w-4" /> Mở báo cáo Analytics chi tiết <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* 1. Thống kê sản lượng */}
        <section>
          <SectionTitle>Thống kê sản lượng</SectionTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SumCard icon={Package} label="Tổng sản lượng" value={`${(totals.total / 1000).toLocaleString("vi-VN")}t`} />
            <SumCard icon={Package} label="Tồn kho" value={`${(totals.inventory / 1000).toLocaleString("vi-VN")}t`} tone="accent" />
            <SumCard icon={AlertTriangle} label="Đang giải cứu" value={`${(totals.rescuing / 1000).toLocaleString("vi-VN")}t`} tone="destructive" />
            <SumCard icon={TrendingUp} label="Đã tiêu thụ" value={`${(totals.consumed / 1000).toLocaleString("vi-VN")}t`} tone="primary" />
            <SumCard icon={Truck} label="Đang vận chuyển" value={`${(totals.inTransit / 1000).toLocaleString("vi-VN")}t`} />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Tỉnh</th>
                  <th className="px-4 py-3 text-right">Tổng</th>
                  <th className="px-4 py-3 text-right">Tồn kho</th>
                  <th className="px-4 py-3 text-right">Giải cứu</th>
                  <th className="px-4 py-3 text-right">Đã tiêu thụ</th>
                  <th className="px-4 py-3 text-right">Vận chuyển</th>
                </tr>
              </thead>
              <tbody>
                {provinceStats.map((p) => (
                  <tr key={p.province} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.province}</td>
                    <td className="px-4 py-3 text-right">{p.totalKg.toLocaleString("vi-VN")} kg</td>
                    <td className="px-4 py-3 text-right">{p.inventoryKg.toLocaleString("vi-VN")} kg</td>
                    <td className="px-4 py-3 text-right text-destructive">{p.rescuingKg.toLocaleString("vi-VN")} kg</td>
                    <td className="px-4 py-3 text-right text-primary">{p.consumedKg.toLocaleString("vi-VN")} kg</td>
                    <td className="px-4 py-3 text-right">{p.inTransitKg.toLocaleString("vi-VN")} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Phân tích khả năng cung ứng */}
        <section>
          <SectionTitle>Phân tích khả năng cung ứng</SectionTitle>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {provinceStats.map((p) => {
              const days = daysToConsume(p);
              const risk = congestionRisk(p);
              const riskTone = risk === "high" ? "bg-destructive/10 text-destructive" : risk === "medium" ? "bg-accent/30 text-accent-foreground" : "bg-primary-soft text-primary";
              const riskLabel = risk === "high" ? "Nguy cơ ùn ứ cao" : risk === "medium" ? "Cần theo dõi" : "Ổn định";
              return (
                <div key={p.province} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{p.province}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskTone}`}>{riskLabel}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div><div className="text-muted-foreground">Hiện có</div><div className="text-base font-bold">{((p.inventoryKg + p.rescuingKg) / 1000).toFixed(1)}t</div></div>
                    <div><div className="text-muted-foreground">Tốc độ TB</div><div className="text-base font-bold">{p.consumptionRateKgPerDay.toLocaleString("vi-VN")} kg/ngày</div></div>
                    <div><div className="text-muted-foreground">Dự báo tiêu thụ hết</div><div className="text-base font-bold">{days} ngày</div></div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${risk === "high" ? "bg-destructive" : risk === "medium" ? "bg-accent" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (days / 30) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Dự báo */}
        <section>
          <SectionTitle>Dự báo cung cầu</SectionTitle>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-base font-semibold">Dự báo tồn kho theo tuần</h3>
              <p className="text-xs text-muted-foreground">Sản lượng tồn (tấn) - thực tế và dự báo</p>
              <div className="mt-4 flex h-44 items-end gap-3">
                {forecastInventoryWeekly.map((d) => {
                  const v = d.actual ?? d.forecast ?? 0;
                  const max = 1300;
                  return (
                    <div key={d.w} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-[10px] font-semibold">{v}t</div>
                      <div
                        className={`w-full rounded-t-lg ${d.actual !== null ? "bg-primary" : "bg-primary/30 border border-dashed border-primary"}`}
                        style={{ height: `${(v / max) * 100}%` }}
                      />
                      <div className="text-xs text-muted-foreground">{d.w}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-primary" /> Thực tế</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded border border-dashed border-primary bg-primary/30" /> Dự báo</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-card">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> Vùng có nguy cơ dư thừa
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {rescueZones.filter((z) => z.urgency !== "normal").map((z) => (
                    <li key={z.id} className="flex items-center justify-between">
                      <span><b>{z.name}</b> · {z.product}</span>
                      <span className="font-mono text-xs">{(z.surplusKg / 1000).toLocaleString("vi-VN")}t</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Dự báo nhu cầu tuần tới</div>
                <div className="mt-2 text-2xl font-bold">~ 1.450 tấn</div>
                <div className="text-xs text-muted-foreground">Dựa trên 12 tuần dữ liệu lịch sử</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-wider text-destructive">Dự báo sản lượng cần giải cứu</div>
                <div className="mt-2 text-2xl font-bold">~ 320 tấn</div>
                <div className="text-xs text-muted-foreground">Tăng 12% so với tuần trước</div>
              </div>
            </div>
          </div>
        </section>

        {/* Map + live shipments (rút gọn) */}
        <section>
          <SectionTitle>Bản đồ vùng dư thừa & shipment</SectionTitle>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-primary-soft/40 to-accent/10">
                <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full opacity-30">
                  <path d="M55 5 Q60 15 58 25 Q70 35 60 45 Q70 55 62 65 Q75 75 65 88 Q60 100 55 115 Q50 120 48 115 Q52 105 50 95 Q40 85 50 75 Q42 65 52 55 Q45 45 55 35 Q48 25 52 15 Z" fill="var(--primary)" />
                </svg>
                {rescueZones.map((z) => {
                  const size = Math.max(28, Math.min(72, Math.sqrt(z.surplusKg) / 30));
                  return (
                    <div key={z.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${z.lat}%`, top: `${z.lng}%` }}>
                      <div className="relative">
                        <span className={`block animate-ping rounded-full opacity-40 ${urgencyColor(z.urgency)}`} style={{ width: size, height: size }} />
                        <span className={`absolute inset-0 grid place-items-center rounded-full ${urgencyColor(z.urgency)} text-[10px] font-bold text-white shadow-soft`}>
                          {(z.surplusKg / 1000).toFixed(0)}t
                        </span>
                      </div>
                      <div className="mt-1 whitespace-nowrap rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium shadow-card">
                        {z.name} • {z.product}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Radio className="h-3.5 w-3.5 animate-pulse" /> Live shipment
                </div>
                <Link to="/shipments" className="text-xs font-semibold text-primary hover:underline">Xem tất cả →</Link>
              </div>
              <div className="mt-3 space-y-2">
                {shipments.filter((s) => s.status !== "delivered").slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary"><Truck className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px]">{s.id}</span>
                        <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">{shipmentStatusLabels[s.status]}</span>
                      </div>
                      <div className="truncate text-xs">{s.productName} · {s.quantityKg}kg</div>
                      <div className="truncate text-[10px] text-muted-foreground">{s.from} → {s.to}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Khẩn cấp</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Cần bán nhanh</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Bình thường</span>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold">{children}</h2>;
}

function SumCard({ icon: Icon, label, value, tone = "muted" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "primary" | "destructive" | "accent" | "muted" }) {
  const cls = tone === "primary" ? "bg-primary-soft text-primary" : tone === "destructive" ? "bg-destructive/10 text-destructive" : tone === "accent" ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${cls}`}><Icon className="h-5 w-5" /></span>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
