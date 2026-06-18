import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, Activity, MapPin, Target, CalendarRange, Search, Boxes } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import {
  provinceStats,
  weeklyRescueSeries,
  monthlyRescueSeries,
  rescueRateByProvince,
  rescueRateByProduct,
  rescueRateByPoint,
  supplyCapacity,
  daysBetween,
  dailyHarvestByProvince,
} from "@/lib/mock-data";

export const Route = createFileRoute("/analytics/")({
  head: () => ({ meta: [{ title: "Phân tích giải cứu – AgriConnect" }] }),
  component: AnalyticsPage,
});


function AnalyticsPage() {
  const totalSurplus = provinceStats.reduce((s, p) => s + p.rescuingKg + p.inventoryKg, 0);
  const totalRescued = provinceStats.reduce((s, p) => s + p.consumedKg, 0);
  const successRate = Math.round((totalRescued / (totalSurplus + totalRescued)) * 100);

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <BarChart3 className="h-3.5 w-3.5" /> Rescue Progress Analytics
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Báo cáo tiến độ tiêu thụ và giải cứu</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Dashboard chuyên biệt hỗ trợ cơ quan quản lý, hợp tác xã và doanh nghiệp điều tiết logistics và thị trường tiêu thụ kịp thời.
          </p>
        </div>
        </div>

        <SupplyCapacityPanel />


      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KPI icon={Activity} label="Tổng sản lượng ùn ứ" value={`${(totalSurplus / 1000).toLocaleString("vi-VN")} tấn`} tone="destructive" />
          <KPI icon={TrendingUp} label="Tổng đã giải cứu" value={`${(totalRescued / 1000).toLocaleString("vi-VN")} tấn`} tone="primary" />
          <KPI icon={Target} label="Tỷ lệ giải cứu thành công" value={`${successRate}%`} tone="accent" formula="= Sản lượng đã bán / Tổng ùn ứ" />
        </div>

        {/* Line charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Tiến độ theo tuần" subtitle="Sản lượng ùn ứ vs đã giải cứu (tấn)">
            <LineChart data={weeklyRescueSeries.map((d) => ({ label: d.w, a: d.surplus, b: d.rescued }))} />
          </ChartCard>
          <ChartCard title="Tiến độ theo tháng" subtitle="Sản lượng ùn ứ vs đã giải cứu (tấn)">
            <LineChart data={monthlyRescueSeries.map((d) => ({ label: d.m, a: d.surplus, b: d.rescued }))} />
          </ChartCard>
        </div>

        {/* Bar provinces */}
        <ChartCard title="So sánh tỷ lệ giải cứu giữa các tỉnh" subtitle="Đơn vị: %">
          <div className="mt-4 space-y-3">
            {rescueRateByProvince.map((p) => (
              <div key={p.province} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-sm font-medium">{p.province}</div>
                <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-muted">
                  <div
                    className={`h-full rounded-lg ${p.rate >= 70 ? "bg-primary" : p.rate >= 50 ? "bg-accent" : "bg-destructive"}`}
                    style={{ width: `${p.rate}%` }}
                  />
                  <span className="absolute inset-y-0 right-2 grid items-center text-xs font-bold">{p.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Heatmap + by-product + by-point */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <ChartCard title="Heatmap tỷ lệ giải cứu - Bản đồ Việt Nam" subtitle="Mức độ tỷ lệ giải cứu theo tỉnh">
            <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-b from-primary-soft/40 to-accent/10">
              <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full opacity-30">
                <path
                  d="M55 5 Q60 15 58 25 Q70 35 60 45 Q70 55 62 65 Q75 75 65 88 Q60 100 55 115 Q50 120 48 115 Q52 105 50 95 Q40 85 50 75 Q42 65 52 55 Q45 45 55 35 Q48 25 52 15 Z"
                  fill="var(--primary)"
                />
              </svg>
              {provinceStats.map((p, i) => {
                const rate = rescueRateByProvince[i]?.rate ?? 0;
                const tone = rate >= 70 ? "bg-primary" : rate >= 50 ? "bg-accent" : "bg-destructive";
                const positions = [
                  { x: 60, y: 82 }, { x: 68, y: 79 }, { x: 74, y: 70 },
                  { x: 56, y: 84 }, { x: 60, y: 58 }, { x: 66, y: 64 },
                ];
                const pos = positions[i] ?? { x: 50, y: 50 };
                return (
                  <div key={p.province} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                    <span className={`grid h-12 w-12 place-items-center rounded-full ${tone} text-xs font-bold text-white shadow-soft`}>
                      {rate}%
                    </span>
                    <div className="mt-1 whitespace-nowrap rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-medium shadow-card">
                      {p.province}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> &lt; 50%</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> 50–70%</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> &gt; 70%</span>
            </div>
          </ChartCard>

          <div className="space-y-6">
            <ChartCard title="Tỷ lệ giải cứu theo loại nông sản">
              <div className="mt-3 space-y-2">
                {rescueRateByProduct.map((p) => (
                  <RateRow key={p.name} name={p.name} rate={p.rate} />
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Tỷ lệ giải cứu theo điểm giải cứu">
              <div className="mt-3 space-y-2">
                {rescueRateByPoint.map((p) => (
                  <RateRow key={p.name} name={p.name} rate={p.rate} />
                ))}
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <MapPin className="h-3.5 w-3.5" /> Khuyến nghị điều phối
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {provinceStats
              .map((p, i) => ({ p, rate: rescueRateByProvince[i].rate }))
              .filter(({ rate }) => rate < 50)
              .map(({ p, rate }) => (
                <li key={p.province} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  <span><b>{p.province}</b> tỷ lệ giải cứu chỉ {rate}% — cần điều thêm điểm tiếp nhận hoặc tăng cường truyền thông tiêu thụ.</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

function SupplyCapacityPanel() {
  const [start, setStart] = useState("2026-06-18");
  const [end, setEnd] = useState("2026-06-30");
  const [query, setQuery] = useState("");

  const days = daysBetween(start, end);
  const rows = useMemo(() => {
    const list = provinceStats.map((p) => supplyCapacity(p, days));
    const q = query.trim().toLowerCase();
    return q ? list.filter((r) => r.province.toLowerCase().includes(q)) : list;
  }, [days, query]);

  const totalImmediate = rows.reduce((s, r) => s + r.immediateKg, 0);
  const totalIncoming = rows.reduce((s, r) => s + r.incomingHarvestKg, 0);
  const totalNet = rows.reduce((s, r) => s + r.netAvailableKg, 0);
  const maxNet = Math.max(1, ...rows.map((r) => r.netAvailableKg));

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Boxes className="h-3.5 w-3.5" /> Khả năng cung ứng theo vùng trồng
          </div>
          <h3 className="mt-1 text-lg font-semibold">Dành cho đơn vị thu mua / bán lẻ tìm kiếm theo khoảng ngày</h3>
          <p className="text-xs text-muted-foreground">
            Công thức: Cung khả dụng = (Tồn kho + Đang giải cứu) + Sản lượng dự kiến thu hoạch × số ngày − Tiêu thụ dự kiến × số ngày.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
        <DateField icon={CalendarRange} label="Từ ngày" value={start} onChange={setStart} />
        <DateField icon={CalendarRange} label="Đến ngày" value={end} onChange={setEnd} />
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Tìm theo vùng trồng</span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="VD: Long An, Đồng Nai..." className="w-full bg-transparent text-sm outline-none" />
          </div>
        </label>
        <div className="rounded-xl bg-primary-soft px-4 py-3 text-center">
          <div className="text-[11px] uppercase tracking-wider text-primary">Khoảng</div>
          <div className="text-lg font-bold text-primary">{days} ngày</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Sẵn sàng giao ngay" value={`${totalImmediate.toLocaleString("vi-VN")} kg`} />
        <MiniStat label="Thu hoạch trong kỳ" value={`${totalIncoming.toLocaleString("vi-VN")} kg`} tone="accent" />
        <MiniStat label="Cung khả dụng (net)" value={`${totalNet.toLocaleString("vi-VN")} kg`} tone="primary" />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Vùng trồng</th>
              <th className="px-3 py-2 text-right">Tốc độ thu hoạch (kg/ngày)</th>
              <th className="px-3 py-2 text-right">Sẵn sàng giao</th>
              <th className="px-3 py-2 text-right">Thu hoạch trong kỳ</th>
              <th className="px-3 py-2 text-right">Tiêu thụ dự kiến</th>
              <th className="px-3 py-2 text-left">Cung khả dụng (net)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.province} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{r.province}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{(dailyHarvestByProvince[r.province] ?? 0).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right">{r.immediateKg.toLocaleString("vi-VN")} kg</td>
                <td className="px-3 py-2 text-right">{r.incomingHarvestKg.toLocaleString("vi-VN")} kg</td>
                <td className="px-3 py-2 text-right text-muted-foreground">−{r.expectedConsumptionKg.toLocaleString("vi-VN")} kg</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="relative h-5 w-40 overflow-hidden rounded-md bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${(r.netAvailableKg / maxNet) * 100}%` }} />
                    </div>
                    <b>{r.netAvailableKg.toLocaleString("vi-VN")} kg</b>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">Không có vùng trồng nào khớp từ khóa.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DateField({ icon: Icon, label, value, onChange }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}

function MiniStat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "primary" | "accent" | "muted" }) {
  const cls = tone === "primary" ? "bg-primary-soft text-primary" : tone === "accent" ? "bg-accent/30 text-accent-foreground" : "bg-muted text-foreground";
  return (
    <div className={`rounded-xl p-3 ${cls}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-0.5 text-lg font-bold">{value}</div>
    </div>
  );
}


function KPI({ icon: Icon, label, value, tone, formula }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: "primary" | "destructive" | "accent"; formula?: string }) {
  const cls = tone === "destructive" ? "bg-destructive/10 text-destructive" : tone === "accent" ? "bg-accent/30 text-accent-foreground" : "bg-primary-soft text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${cls}`}><Icon className="h-5 w-5" /></span>
      <div className="mt-4 text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {formula && <div className="mt-1 font-mono text-[11px] text-muted-foreground/80">{formula}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

function RateRow({ name, rate }: { name: string; rate: number }) {
  const tone = rate >= 70 ? "bg-primary" : rate >= 50 ? "bg-accent" : "bg-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 truncate text-xs">{name}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${rate}%` }} />
        <span className="absolute inset-y-0 right-1.5 grid items-center text-[10px] font-bold">{rate}%</span>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { label: string; a: number; b: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]));
  const w = 100;
  const h = 50;
  const stepX = w / (data.length - 1);
  const pathFor = (key: "a" | "b") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (d[key] / max) * h}`).join(" ");
  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${w} ${h + 8}`} className="h-44 w-full">
        <path d={pathFor("a")} fill="none" stroke="var(--destructive)" strokeWidth="1.2" />
        <path d={pathFor("b")} fill="none" stroke="var(--primary)" strokeWidth="1.2" />
        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={i * stepX} cy={h - (d.a / max) * h} r="1.2" fill="var(--destructive)" />
            <circle cx={i * stepX} cy={h - (d.b / max) * h} r="1.2" fill="var(--primary)" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-destructive" /> Ùn ứ</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-primary" /> Đã giải cứu</span>
      </div>
    </div>
  );
}