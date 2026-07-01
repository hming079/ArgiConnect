import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  CalendarRange,
  MapPin,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";

import { PageShell } from "@/components/site-layout";
import {
  useAnalyticsOverview,
  useProvinceStats,
  useRescueRates,
  useSupplyCapacity,
} from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { getVietnamProvinces, type VietnamProvince } from "@/services/addressApi";

export const Route = createFileRoute("/analytics/")({
  head: () => ({ meta: [{ title: "Phân tích giải cứu - AgriConnect" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { ready, role } = useAuth();
  const isBuyer = role === "BUYER";
  const canLoadDeepAnalytics = ready && !isBuyer;
  const overviewQuery = useAnalyticsOverview();
  const provinceQuery = useProvinceStats();
  const provinceRatesQuery = useRescueRates("province");
  const cropRatesQuery = useRescueRates("crop", canLoadDeepAnalytics);
  const pointRatesQuery = useRescueRates("rescuePoint", canLoadDeepAnalytics);

  const overview = overviewQuery.data;
  const provinceStats = provinceQuery.data ?? [];
  const provinceRates = provinceRatesQuery.data ?? [];
  const cropRates = cropRatesQuery.data ?? [];
  const pointRates = pointRatesQuery.data ?? [];
  const isLoading =
    overviewQuery.isLoading ||
    provinceQuery.isLoading ||
    provinceRatesQuery.isLoading ||
    (canLoadDeepAnalytics && (cropRatesQuery.isLoading || pointRatesQuery.isLoading));
  const isError =
    overviewQuery.isError ||
    provinceQuery.isError ||
    provinceRatesQuery.isError ||
    (canLoadDeepAnalytics && (cropRatesQuery.isError || pointRatesQuery.isError));

  const forecastSeries =
    overview?.forecastInventory.map((point) => ({
      label: `${point.days}d`,
      a: point.currentInventory / 1000,
      b: point.forecastInventory / 1000,
    })) ?? [];
  const provinceSeries = provinceStats.slice(0, 6).map((p) => ({
    label: shortProvince(p.province),
    a: p.inventoryKg / 1000,
    b: p.consumedKg / 1000,
  }));

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <BarChart3 className="h-3.5 w-3.5" /> Rescue Progress Analytics
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Báo cáo tiến độ tiêu thụ và giải cứu
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Dashboard hỗ trợ cơ quan quản lý, hợp tác xã và doanh nghiệp điều tiết logistics và thị
            trường tiêu thụ kịp thời.
          </p>
        </div>
      </div>

      <SupplyCapacityPanel />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {isError && <StateBox tone="error">Không tải được dữ liệu analytics từ backend.</StateBox>}
        {isLoading && <StateBox>Đang tải dữ liệu analytics...</StateBox>}
        {!isLoading && !isError && provinceStats.length === 0 && (
          <StateBox>Chưa có dữ liệu analytics.</StateBox>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <KPI
            icon={Activity}
            label="Tổng sản lượng"
            value={`${formatTons(overview?.totalProductionQuantity ?? 0)} tan`}
            tone="destructive"
          />
          <KPI
            icon={TrendingUp}
            label="Tổng đã tiêu thụ"
            value={`${formatTons(overview?.soldQuantity ?? 0)} tan`}
            tone="primary"
          />
          <KPI
            icon={Target}
            label="Tỷ lệ giải cứu thành công"
            value={`${formatPercent(overview?.rescueSuccessRate ?? 0)}%`}
            tone="accent"
            formula="= San luong da ban / tong dang ky giai cuu"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Dự báo tồn kho" subtitle="Tồn kho hiện tại vs dự báo (tấn)">
            <LineChart data={forecastSeries} aLabel="Hiện tại" bLabel="Dự báo" />
          </ChartCard>
          <ChartCard title="Tồn kho vs đã tiêu thụ theo tỉnh" subtitle="Đơn vị: tấn">
            <LineChart data={provinceSeries} aLabel="Tồn kho" bLabel="Đã tiêu thụ" />
          </ChartCard>
        </div>

        <ChartCard title="So sánh tỷ lệ giải cứu giữa các tỉnh" subtitle="Don vi: %">
          <div className="mt-4 space-y-3">
            {provinceRates.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-sm font-medium">{p.name}</div>
                <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-muted">
                  <div
                    className={`h-full rounded-lg ${rateTone(p.rate)}`}
                    style={{ width: `${p.rate}%` }}
                  />
                  <span className="absolute inset-y-0 right-2 grid items-center text-xs font-bold">
                    {formatPercent(p.rate)}%
                  </span>
                </div>
              </div>
            ))}
            {!isLoading && provinceRates.length === 0 && (
              <EmptyText>Chưa có tỷ lệ giải cứu</EmptyText>
            )}
          </div>
        </ChartCard>

        {canLoadDeepAnalytics && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <ChartCard title="Heatmap tỷ lệ giải cứu" subtitle="Mức độ tỷ lệ giải cứu theo tỉnh">
                <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-b from-primary-soft/40 to-accent/10">
                  <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full opacity-30">
                    <path
                      d="M55 5 Q60 15 58 25 Q70 35 60 45 Q70 55 62 65 Q75 75 65 88 Q60 100 55 115 Q50 120 48 115 Q52 105 50 95 Q40 85 50 75 Q42 65 52 55 Q45 45 55 35 Q48 25 52 15 Z"
                      fill="var(--primary)"
                    />
                  </svg>
                  {provinceStats.map((p, i) => {
                    const rate = provinceRates.find((row) => row.name === p.province)?.rate ?? 0;
                    const pos = provincePosition(i);
                    return (
                      <div
                        key={p.province}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <span
                          className={`grid h-12 w-12 place-items-center rounded-full ${rateTone(rate)} text-xs font-bold text-white shadow-soft`}
                        >
                          {formatPercent(rate)}%
                        </span>
                        <div className="mt-1 whitespace-nowrap rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-medium shadow-card">
                          {p.province}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-3 text-xs">
                  <Legend color="bg-destructive" label="< 50%" />
                  <Legend color="bg-accent" label="50-70%" />
                  <Legend color="bg-primary" label="> 70%" />
                </div>
              </ChartCard>

              <div className="space-y-6">
                <ChartCard title="Tỷ lệ giải cứu theo nông sản">
                  <div className="mt-3 space-y-2">
                    {cropRates.map((p) => (
                      <RateRow key={p.name} name={p.name} rate={p.rate} />
                    ))}
                    {!isLoading && cropRates.length === 0 && (
                      <EmptyText>Chưa có dữ liệu theo nông sản.</EmptyText>
                    )}
                  </div>
                </ChartCard>
                <ChartCard title="Ty le giai cuu theo diem giai cuu">
                  <div className="mt-3 space-y-2">
                    {pointRates.map((p) => (
                      <RateRow key={p.name} name={p.name} rate={p.rate} />
                    ))}
                    {!isLoading && pointRates.length === 0 && (
                      <EmptyText>Chưa có dữ liệu theo điểm.</EmptyText>
                    )}
                  </div>
                </ChartCard>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <MapPin className="h-3.5 w-3.5" /> Khuyến nghị điều phối
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {provinceStats
                  .map((p) => ({
                    p,
                    rate: provinceRates.find((row) => row.name === p.province)?.rate ?? 0,
                  }))
                  .filter(({ rate }) => rate < 50)
                  .map(({ p, rate }) => (
                    <li key={p.province} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      <span>
                        <b>{p.province}</b> tỷ lệ giải cứu chỉ {formatPercent(rate)}% - cần điều
                        thêm điểm tiếp nhận hoặc kêu gọi thêm để tiêu thụ.
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

function SupplyCapacityPanel() {
  const [start, setStart] = useState(toDateInput(new Date()));
  const [end, setEnd] = useState(toDateInput(addDays(new Date(), 7)));
  const [query, setQuery] = useState("");
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [provinceError, setProvinceError] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const params = useMemo(
    () => ({ startDate: start, endDate: end, province: query.trim() || undefined }),
    [end, query, start],
  );
  const supplyQuery = useSupplyCapacity(params);
  const rows = supplyQuery.data ?? [];
  const days = rows[0]?.days ?? daysBetween(start, end);
  const totalImmediate = rows.reduce((s, r) => s + r.immediateKg, 0);
  const totalIncoming = rows.reduce((s, r) => s + r.incomingHarvestKg, 0);
  const totalNet = rows.reduce((s, r) => s + r.netAvailableKg, 0);
  const maxNet = Math.max(1, ...rows.map((r) => r.netAvailableKg));

  useEffect(() => {
    let alive = true;
    setLoadingProvinces(true);
    setProvinceError("");
    getVietnamProvinces()
      .then((items) => {
        if (alive) setProvinces(items);
      })
      .catch(() => {
        if (alive) setProvinceError("Khong tai duoc danh sach tinh/thanh.");
      })
      .finally(() => {
        if (alive) setLoadingProvinces(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-2xl border border-border bg-card p-6 shadow-card sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Boxes className="h-3.5 w-3.5" /> Khả năng cung ứng theo vùng trồng
          </div>
          <h3 className="mt-1 text-lg font-semibold">
            Dành cho đơn vị thu mua / bán lẻ tìm kiếm theo khoảng ngày
          </h3>
          <p className="text-xs text-muted-foreground">
            Công thức: Cung khả dụng = tồn kho + đang giải cứu + thu hoạch dự kiến + tiêu thụ dự
            kiến.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1.2fr_auto] sm:items-end">
        <DateField icon={CalendarRange} label="Từ ngày" value={start} onChange={setStart} />
        <DateField icon={CalendarRange} label="Đến ngày" value={end} onChange={setEnd} />
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Chọn tỉnh/thành
          </span>
          <select
            value={provinces.some((province) => province.name === query) ? query : ""}
            disabled={loadingProvinces}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="">{loadingProvinces ? "Đang tải..." : "Tất cả"}</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Tìm theo vùng trồng
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="VD: Long An..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </label>
        <div className="rounded-xl bg-primary-soft px-4 py-3 text-center">
          <div className="text-[11px] uppercase tracking-wider text-primary">Khoảng</div>
          <div className="text-lg font-bold text-primary">{days} ngày</div>
        </div>
      </div>

      {provinceError && <StateBox tone="error">{provinceError}</StateBox>}
      {supplyQuery.isError && <StateBox tone="error">Không tải được khả năng cung ứng</StateBox>}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Sẵn sàng giao ngay" value={`${formatKg(totalImmediate)} kg`} />
        <MiniStat
          label="Thu hoạch trong kỳ"
          value={`${formatKg(totalIncoming)} kg`}
          tone="accent"
        />
        <MiniStat label="Cung khả dụng (net)" value={`${formatKg(totalNet)} kg`} tone="primary" />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Vùng trồng</th>
              <th className="px-3 py-2 text-right">Tốc độ thu hoạch</th>
              <th className="px-3 py-2 text-right">Sẵn sàng giao</th>
              <th className="px-3 py-2 text-right">Thu hoạch trong kỳ</th>
              <th className="px-3 py-2 text-right">Tiêu thụ dự kiến</th>
              <th className="px-3 py-2 text-left">Cung khả dụng</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.province} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{r.province}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {formatKg(r.dailyHarvestKg)} kg/ngày
                </td>
                <td className="px-3 py-2 text-right">{formatKg(r.immediateKg)} kg</td>
                <td className="px-3 py-2 text-right">{formatKg(r.incomingHarvestKg)} kg</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  -{formatKg(r.expectedConsumptionKg)} kg
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="relative h-5 w-40 overflow-hidden rounded-md bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(r.netAvailableKg / maxNet) * 100}%` }}
                      />
                    </div>
                    <b>{formatKg(r.netAvailableKg)} kg</b>
                  </div>
                </td>
              </tr>
            ))}
            {!supplyQuery.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Không có vùng trồng nào khớp từ khóa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DateField({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </label>
  );
}

function MiniStat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "primary" | "accent" | "muted";
}) {
  const cls =
    tone === "primary"
      ? "bg-primary-soft text-primary"
      : tone === "accent"
        ? "bg-accent/30 text-accent-foreground"
        : "bg-muted text-foreground";
  return (
    <div className={`rounded-xl p-3 ${cls}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-0.5 text-lg font-bold">{value}</div>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  tone,
  formula,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "destructive" | "accent";
  formula?: string;
}) {
  const cls =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "accent"
        ? "bg-accent/30 text-accent-foreground"
        : "bg-primary-soft text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${cls}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-4 text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {formula && (
        <div className="mt-1 font-mono text-[11px] text-muted-foreground/80">{formula}</div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

function RateRow({ name, rate }: { name: string; rate: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 truncate text-xs">{name}</div>
      <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-muted">
        <div className={`h-full ${rateTone(rate)}`} style={{ width: `${rate}%` }} />
        <span className="absolute inset-y-0 right-1.5 grid items-center text-[10px] font-bold">
          {formatPercent(rate)}%
        </span>
      </div>
    </div>
  );
}

function LineChart({
  data,
  aLabel,
  bLabel,
}: {
  data: { label: string; a: number; b: number }[];
  aLabel: string;
  bLabel: string;
}) {
  if (data.length === 0) return <EmptyText>Chưa có dữ liệu biểu đồ</EmptyText>;
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  const w = 100;
  const h = 50;
  const stepX = data.length > 1 ? w / (data.length - 1) : w;
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
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <Legend color="bg-destructive" label={aLabel} />
        <Legend color="bg-primary" label={bLabel} />
      </div>
    </div>
  );
}

function StateBox({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  const cls =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-border bg-card text-muted-foreground";
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{children}</div>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

function rateTone(rate: number) {
  return rate >= 70 ? "bg-primary" : rate >= 50 ? "bg-accent" : "bg-destructive";
}

function provincePosition(index: number) {
  const positions = [
    { x: 60, y: 82 },
    { x: 68, y: 79 },
    { x: 74, y: 70 },
    { x: 56, y: 84 },
    { x: 60, y: 58 },
    { x: 66, y: 64 },
  ];
  return positions[index] ?? { x: 50, y: 50 };
}

function shortProvince(value: string) {
  return value.length > 10 ? value.slice(0, 9) + "." : value;
}

function formatTons(value: number) {
  return (value / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

function formatKg(value: number) {
  return Math.round(value).toLocaleString("vi-VN");
}

function formatPercent(value: number) {
  return Math.round(value).toLocaleString("vi-VN");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(startISO: string, endISO: string) {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}
