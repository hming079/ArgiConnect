import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Package,
  Radio,
  TrendingUp,
  Truck,
} from "lucide-react";

import type { RiskLevel } from "@/api/analyticsApi";
import { PageShell } from "@/components/site-layout";
import {
  useAnalyticsOverview,
  useCongestionRisk,
  useForecastInventory,
  useProvinceStats,
} from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";

export const Route = createFileRoute("/coordination/")({
  head: () => ({
    meta: [
      { title: "Dashboard điều phối - AgriConnect" },
      {
        name: "description",
        content: "Phân tích dữ liệu và hỗ trợ ra quyết định điều phối nông sản.",
      },
    ],
  }),
  component: CoordinationPage,
});

function CoordinationPage() {
  const { role } = useAuth();
  const overviewQuery = useAnalyticsOverview();
  const provinceQuery = useProvinceStats();
  const riskQuery = useCongestionRisk();
  const forecastQuery = useForecastInventory(30);
  const shipmentsQuery = useShipments(undefined, true);

  const overview = overviewQuery.data;
  const provinceStats = provinceQuery.data ?? [];
  const riskRows = riskQuery.data ?? [];
  const forecast = forecastQuery.data;
  const shipments = shipmentsQuery.data ?? [];
  const isLoading =
    overviewQuery.isLoading ||
    provinceQuery.isLoading ||
    riskQuery.isLoading ||
    forecastQuery.isLoading ||
    shipmentsQuery.isLoading;
  const isError =
    overviewQuery.isError ||
    provinceQuery.isError ||
    riskQuery.isError ||
    forecastQuery.isError ||
    shipmentsQuery.isError;

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Activity className="h-3.5 w-3.5" /> Supply Chain Control Tower
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard điều phối nông sản</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Phân tích sản lượng, dự báo cung cầu và hỗ trợ ra quyết định điều phối theo dữ liệu
            backend.
          </p>
          {role === "ADMIN" && (
            <div className="mt-4">
              <Link
                to="/analytics"
                className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
              >
                <BarChart3 className="h-4 w-4" /> Mở báo cáo Analytics chi tiết{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {isError && <StateBox tone="error">Không tải được dữ liệu điều phối từ backend.</StateBox>}
        {isLoading && <StateBox>Đang tải dữ liệu điều phối...</StateBox>}

        <section>
          <SectionTitle>Thống kê sản lượng</SectionTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SumCard
              icon={Package}
              label="Tổng sản lượng"
              value={`${formatTons(overview?.totalProductionQuantity ?? 0)}t`}
            />
            <SumCard
              icon={Package}
              label="Tồn kho"
              value={`${formatTons(overview?.currentInventoryQuantity ?? 0)}t`}
              tone="accent"
            />
            <SumCard
              icon={AlertTriangle}
              label="Đang giải cứu"
              value={`${formatTons(overview?.rescuingQuantity ?? 0)}t`}
              tone="destructive"
            />
            <SumCard
              icon={TrendingUp}
              label="Đã tiêu thụ"
              value={`${formatTons(overview?.soldQuantity ?? 0)}t`}
              tone="primary"
            />
            <SumCard
              icon={Truck}
              label="Đang vận chuyển"
              value={`${formatTons(overview?.inTransitQuantity ?? 0)}t`}
            />
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
                    <td className="px-4 py-3 text-right">{formatKg(p.totalKg)} kg</td>
                    <td className="px-4 py-3 text-right">{formatKg(p.inventoryKg)} kg</td>
                    <td className="px-4 py-3 text-right text-destructive">
                      {formatKg(p.rescuingKg)} kg
                    </td>
                    <td className="px-4 py-3 text-right text-primary">
                      {formatKg(p.consumedKg)} kg
                    </td>
                    <td className="px-4 py-3 text-right">{formatKg(p.inTransitKg)} kg</td>
                  </tr>
                ))}
                {!isLoading && provinceStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Chưa có dữ liệu tỉnh.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle>Phân tích khả năng cung ứng</SectionTitle>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {provinceStats.map((p) => (
              <div
                key={p.province}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.province}</div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskPill(p.congestionRiskLevel)}`}
                  >
                    {riskLabel(p.congestionRiskLevel)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <Metric label="Hiện có" value={`${formatTons(p.inventoryKg + p.rescuingKg)}t`} />
                  <Metric
                    label="Tốc độ TB"
                    value={`${formatKg(p.consumptionRateKgPerDay)} kg/ngày`}
                  />
                  <Metric
                    label="Dự báo tiêu thụ hết"
                    value={`${formatNumber(p.inventoryCoverageDays)} ngày`}
                  />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`${riskBar(p.congestionRiskLevel)} h-full`}
                    style={{ width: `${Math.min(100, p.congestionRiskScore)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Dự báo cung cầu</SectionTitle>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-base font-semibold">Dự báo tồn kho</h3>
              <p className="text-xs text-muted-foreground">
                Sản lượng tồn (tấn) - hiện tại và dự báo 7/14/30 ngày
              </p>
              <div className="mt-4 flex h-44 items-end gap-3">
                {(forecast?.points ?? []).map((d) => {
                  const max = Math.max(
                    1,
                    ...(forecast?.points ?? []).map((p) => p.forecastInventory / 1000),
                  );
                  const current = d.currentInventory / 1000;
                  const projected = d.forecastInventory / 1000;
                  return (
                    <div key={d.days} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-[10px] font-semibold">{formatNumber(projected)}t</div>
                      <div className="flex w-full items-end gap-1">
                        <div
                          className="w-1/2 rounded-t-lg bg-primary"
                          style={{ height: `${(current / max) * 100}%` }}
                        />
                        <div
                          className="w-1/2 rounded-t-lg border border-dashed border-primary bg-primary/30"
                          style={{ height: `${(projected / max) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">{d.days}d</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <Legend color="bg-primary" label="Hiện tại" />
                <Legend color="border border-dashed border-primary bg-primary/30" label="Dự báo" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-card">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> Vùng có nguy cơ dư thừa
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {riskRows
                    .filter((row) => row.riskLevel !== "LOW")
                    .slice(0, 6)
                    .map((row) => (
                      <li
                        key={`${row.province}-${row.cropName}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>
                          <b>{row.province}</b> - {row.cropName}
                        </span>
                        <span className="font-mono text-xs">
                          {formatTons(row.currentInventory)}t
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
              <MiniForecast
                label="Dự báo nhu cầu"
                value={`~ ${formatTons(forecast?.expectedConsumption ?? 0)} tấn`}
              />
              <MiniForecast
                label="Dự báo thu hoạch"
                value={`~ ${formatTons(forecast?.expectedHarvest ?? 0)} tấn`}
                tone="destructive"
              />
            </div>
          </div>
        </section>

        {/* <section>
          <SectionTitle>Bản đồ vùng dư thừa & shipment</SectionTitle>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-primary-soft/40 to-accent/10">
                <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full opacity-30">
                  <path
                    d="M55 5 Q60 15 58 25 Q70 35 60 45 Q70 55 62 65 Q75 75 65 88 Q60 100 55 115 Q50 120 48 115 Q52 105 50 95 Q40 85 50 75 Q42 65 52 55 Q45 45 55 35 Q48 25 52 15 Z"
                    fill="var(--primary)"
                  />
                </svg>
                {riskRows.slice(0, 8).map((row, index) => {
                  const size = Math.max(
                    28,
                    Math.min(72, Math.sqrt(row.currentInventory + row.incomingHarvest) / 30),
                  );
                  const pos = provincePosition(index);
                  return (
                    <div
                      key={`${row.province}-${row.cropName}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div className="relative">
                        <span
                          className={`block animate-ping rounded-full opacity-40 ${riskColor(row.riskLevel)}`}
                          style={{ width: size, height: size }}
                        />
                        <span
                          className={`absolute inset-0 grid place-items-center rounded-full ${riskColor(row.riskLevel)} text-[10px] font-bold text-white shadow-soft`}
                        >
                          {formatTons(row.currentInventory)}t
                        </span>
                      </div>
                      <div className="mt-1 whitespace-nowrap rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium shadow-card">
                        {row.province} - {row.cropName}
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
                <Link
                  to="/shipments"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Xem tất cả &gt;
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {shipments
                  .filter((s) => s.status !== "DELIVERED" && s.status !== "CANCELLED")
                  .slice(0, 5)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
                        <Truck className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px]">#{s.id}</span>
                          <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">
                            {s.status}
                          </span>
                        </div>
                        <div className="truncate text-xs">Order #{s.orderId}</div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {s.pickupAddress} &gt; {s.deliveryAddress}
                        </div>
                      </div>
                    </div>
                  ))}
                {!shipmentsQuery.isLoading && shipments.length === 0 && (
                  <StateBox>Chưa có shipment.</StateBox>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <Legend color="bg-destructive" label="Khẩn cấp" />
            <Legend color="bg-accent" label="Cần theo dõi" />
            <Legend color="bg-primary" label="Bình thường" />
          </div>
        </section> */}
      </div>
    </PageShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold">{children}</h2>;
}

function SumCard({
  icon: Icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "primary" | "destructive" | "accent" | "muted";
}) {
  const cls =
    tone === "primary"
      ? "bg-primary-soft text-primary"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : tone === "accent"
          ? "bg-accent/30 text-accent-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${cls}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}

function MiniForecast({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "destructive";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div
        className={`text-xs font-semibold uppercase tracking-wider ${tone === "destructive" ? "text-destructive" : "text-primary"}`}
      >
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">Rule-based forecast từ backend</div>
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

function riskLabel(level: RiskLevel) {
  return level === "HIGH" ? "Nguy cơ ùn ứ cao" : level === "MEDIUM" ? "Cần theo dõi" : "Ổn định";
}

function riskPill(level: RiskLevel) {
  return level === "HIGH"
    ? "bg-destructive/10 text-destructive"
    : level === "MEDIUM"
      ? "bg-accent/30 text-accent-foreground"
      : "bg-primary-soft text-primary";
}

function riskBar(level: RiskLevel) {
  return level === "HIGH" ? "bg-destructive" : level === "MEDIUM" ? "bg-accent" : "bg-primary";
}

function riskColor(level: RiskLevel) {
  return level === "HIGH" ? "bg-destructive" : level === "MEDIUM" ? "bg-accent" : "bg-primary";
}

function provincePosition(index: number) {
  const positions = [
    { x: 60, y: 82 },
    { x: 68, y: 79 },
    { x: 74, y: 70 },
    { x: 56, y: 84 },
    { x: 60, y: 58 },
    { x: 66, y: 64 },
    { x: 58, y: 72 },
    { x: 70, y: 60 },
  ];
  return positions[index] ?? { x: 50, y: 50 };
}

function formatTons(value: number) {
  return (value / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

function formatKg(value: number) {
  return Math.round(value).toLocaleString("vi-VN");
}

function formatNumber(value: number) {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}
