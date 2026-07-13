import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Package,
  Search,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";

import type { RiskLevel } from "@/api/analyticsApi";
import type { ForecastResult } from "@/api/forecastApi";
import type { InventoryRiskResponse } from "@/api/inventoryRiskApi";
import { PageShell } from "@/components/site-layout";
import { PaginationControls } from "@/components/pagination-controls";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  useAnalyticsOverview,
  useCongestionRisk,
  useForecastInventory,
  useProvinceStats,
} from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { useForecasts } from "@/hooks/use-forecasts";
import { useInventoryRiskForecast, useInventoryRiskSummary } from "@/hooks/use-inventory-risk";
import { useShipments } from "@/hooks/use-shipments";
import { getCropImage } from "@/lib/crop-images";

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
  const aiForecastQuery = useForecasts();
  const inventoryRiskQuery = useInventoryRiskForecast();
  const inventoryRiskSummaryQuery = useInventoryRiskSummary();
  const shipmentsQuery = useShipments(undefined, true);

  const overview = overviewQuery.data;
  const provinceStats = provinceQuery.data ?? [];
  const riskRows = riskQuery.data ?? [];
  const forecast = forecastQuery.data;
  const aiForecasts = aiForecastQuery.data ?? [];
  const inventoryRiskRows = inventoryRiskQuery.data ?? [];
  const inventoryRiskSummary = inventoryRiskSummaryQuery.data;
  const shipments = shipmentsQuery.data ?? [];
  const isLoading =
    overviewQuery.isLoading ||
    provinceQuery.isLoading ||
    riskQuery.isLoading ||
    forecastQuery.isLoading ||
    aiForecastQuery.isLoading ||
    inventoryRiskQuery.isLoading ||
    inventoryRiskSummaryQuery.isLoading ||
    shipmentsQuery.isLoading;
  const isError =
    overviewQuery.isError ||
    provinceQuery.isError ||
    riskQuery.isError ||
    forecastQuery.isError ||
    aiForecastQuery.isError ||
    inventoryRiskQuery.isError ||
    inventoryRiskSummaryQuery.isError ||
    shipmentsQuery.isError;

  // --- STATE TÌM KIẾM VÀ LỌC TỈNH THÀNH ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Hiển thị 6 card (grid 2 cột x 3 hàng) mỗi trang cho gọn
  const [forecastProvince, setForecastProvince] = useState("");
  const [forecastCrop, setForecastCrop] = useState("");

  // Danh sách tỉnh được lọc (áp dụng chung cho bảng và card)
  const filteredProvinces = useMemo(() => {
    return provinceStats.filter((p) => {
      const matchSearch = p.province.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchRisk = filterRisk === "ALL" || p.congestionRiskLevel === filterRisk;
      return matchSearch && matchRisk;
    });
  }, [provinceStats, searchQuery, filterRisk]);

  // Reset trang về 1 mỗi khi lọc
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterRisk]);

  // Phân trang riêng cho phần Card Khả năng cung ứng
  const paginatedProvinces = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProvinces.slice(start, start + pageSize);
  }, [filteredProvinces, page, pageSize]);

  const riskDistribution = useMemo(() => riskDistributionData(inventoryRiskRows), [inventoryRiskRows]);
  const provinceRiskRanking = useMemo(() => provinceHighRiskRanking(inventoryRiskRows), [inventoryRiskRows]);
  const cropTypeRiskCards = useMemo(() => cropTypeRiskSummary(inventoryRiskRows), [inventoryRiskRows]);
  const filteredAiForecasts = useMemo(
    () =>
      aiForecasts.filter((forecast) => {
        const matchProvince = !forecastProvince || forecast.province === forecastProvince;
        const matchCrop = !forecastCrop || forecast.cropName === forecastCrop;
        return matchProvince && matchCrop;
      }),
    [aiForecasts, forecastProvince, forecastCrop],
  );
  const forecastProvinceOptions = useMemo(() => uniqueSorted(aiForecasts.map((forecast) => forecast.province)), [aiForecasts]);
  const forecastCropOptions = useMemo(() => uniqueSorted(aiForecasts.map((forecast) => forecast.cropName)), [aiForecasts]);
  const monthlyForecastResults = useMemo(() => monthlyForecastTrend(filteredAiForecasts), [filteredAiForecasts]);

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Activity className="h-3.5 w-3.5" /> Tháp điều khiển chuỗi cung ứng
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

        {/* THẺ THỐNG KÊ TỔNG QUAN */}
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

          {/* THANH TÌM KIẾM CHUNG */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-b-0 border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span>Hiển thị chi tiết theo tỉnh thành:</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 w-full sm:w-72">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh tên tỉnh..."
                className="bg-transparent text-sm outline-none w-full"
              />
            </div>
          </div>

          {/* BẢNG THỐNG KÊ CÓ SCROLL NỘI BỘ */}
          <div className="max-h-[380px] overflow-y-auto rounded-b-2xl border border-border bg-card shadow-card">
            <table className="w-full text-sm relative">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-xs uppercase tracking-wider text-muted-foreground shadow-sm">
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
                {filteredProvinces.map((p) => (
                  <tr key={p.province} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.province}</td>
                    <td className="px-4 py-3 text-right">{formatKg(p.totalKg)} kg</td>
                    <td className="px-4 py-3 text-right">{formatKg(p.inventoryKg)} kg</td>
                    <td className="px-4 py-3 text-right text-destructive font-medium">
                      {formatKg(p.rescuingKg)} kg
                    </td>
                    <td className="px-4 py-3 text-right text-primary font-medium">
                      {formatKg(p.consumedKg)} kg
                    </td>
                    <td className="px-4 py-3 text-right">{formatKg(p.inTransitKg)} kg</td>
                  </tr>
                ))}
                {!isLoading && filteredProvinces.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Không tìm thấy dữ liệu tỉnh thành phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle>Dự báo rủi ro tồn kho</SectionTitle>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft"
            >
              Xem báo cáo phân tích <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <RiskSummaryCard label="Tổng số lô" value={inventoryRiskSummary?.totalBatches ?? 0} />
            <RiskSummaryCard label="Rủi ro cao" value={inventoryRiskSummary?.highRiskCount ?? 0} tone="high" />
            <RiskSummaryCard label="Rủi ro trung bình" value={inventoryRiskSummary?.mediumRiskCount ?? 0} tone="medium" />
            <RiskSummaryCard label="Rủi ro thấp" value={inventoryRiskSummary?.lowRiskCount ?? 0} tone="low" />
            <RiskSummaryCard label="Điểm trung bình" value={formatNumber(inventoryRiskSummary?.averageRiskScore ?? 0)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <RiskDistributionChart data={riskDistribution} />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-4">
                <h3 className="text-base font-semibold">Nông sản có nguy cơ rủi ro</h3>
                <p className="text-xs text-muted-foreground">Những loại nông sản nào đang có lượng tồn kho rủi ro cao nhất.</p>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {cropTypeRiskCards.slice(0, 6).map((row) => (
                  <CropTypeRiskCard key={row.cropName} row={row} />
                ))}
                {!isLoading && cropTypeRiskCards.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Hiện không có loại nông sản nào có rủi ro tồn kho.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <ForecastResultRepositoryChart
              data={monthlyForecastResults}
              rows={filteredAiForecasts}
              province={forecastProvince}
              crop={forecastCrop}
              provinceOptions={forecastProvinceOptions}
              cropOptions={forecastCropOptions}
              onProvinceChange={setForecastProvince}
              onCropChange={setForecastCrop}
            />
            <div className="grid gap-4">
              <ProvinceRiskRanking data={provinceRiskRanking} />
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Trọng tâm dự báo</div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <div className="text-sm text-muted-foreground">Tỉnh có rủi ro cao nhất</div>
                    <div className="text-xl font-bold">{inventoryRiskSummary?.topRiskProvince ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Nông sản rủi ro cao nhất</div>
                    <div className="text-xl font-bold">{inventoryRiskSummary?.topRiskCropName ?? "-"}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                  Mô-đun này hiện tại được tính toán dựa trên tập luật (rule-based). Nó được thiết kế độc lập để các mô hình Học máy (ML) dự báo thu hoạch và nhu cầu có thể thay thế lượng bán ra ước tính hàng ngày sau này.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionTitle>Phân tích khả năng cung ứng</SectionTitle>
            
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1 text-xs">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "HIGH", label: "Nguy cơ cao" },
                { id: "MEDIUM", label: "Cần theo dõi" },
                { id: "LOW", label: "Ổn định" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterRisk(tab.id)}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                    filterRisk === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {paginatedProvinces.map((p) => (
              <div
                key={p.province}
                className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-base">{p.province}</div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskPill(p.congestionRiskLevel)}`}
                  >
                    {riskLabel(p.congestionRiskLevel)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
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
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`${riskBar(p.congestionRiskLevel)} h-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, p.congestionRiskScore)}%` }}
                  />
                </div>
              </div>
            ))}
            {!isLoading && paginatedProvinces.length === 0 && (
              <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Không có khu vực nào khớp với điều kiện lọc hiện tại.
              </div>
            )}
          </div>

          {!isLoading && filteredProvinces.length > pageSize && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-card">
              <PaginationControls
                totalItems={filteredProvinces.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                pageSizeOptions={[6, 12, 24, 48]}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          )}
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

function RiskSummaryCard({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number | string;
  tone?: "high" | "medium" | "low" | "muted";
}) {
  const cls =
    tone === "high"
      ? "text-destructive"
      : tone === "medium"
        ? "text-amber-700"
        : tone === "low"
          ? "text-green-700"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RiskDistributionChart({
  data,
}: {
  data: { level: RiskLevel; label: string; count: number; fill: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold">Phân bổ rủi ro</h3>
      <p className="text-xs text-muted-foreground">Mức độ rủi ro (Cao / Trung bình / Thấp) của các lô hàng</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {data.map((item) => (
          <div key={item.level} className="rounded-xl border border-border bg-background/70 p-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="font-semibold">{item.label}</span>
            </div>
            <div className="mt-1 text-lg font-bold">{item.count}</div>
          </div>
        ))}
      </div>
      <ChartContainer
        config={{ count: { label: "Số lô", color: "var(--primary)" } }}
        className="mt-4 h-56 w-full"
      >
        <BarChart data={data} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((item) => (
              <Cell key={item.level} fill={item.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function ForecastResultRepositoryChart({
  data,
  rows,
  province,
  crop,
  provinceOptions,
  cropOptions,
  onProvinceChange,
  onCropChange,
}: {
  data: { month: number; predictedQuantity: number }[];
  rows: ForecastResult[];
  province: string;
  crop: string;
  provinceOptions: string[];
  cropOptions: string[];
  onProvinceChange: (value: string) => void;
  onCropChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Kho lưu trữ kết quả dự báo</h3>
          <p className="text-xs text-muted-foreground">
            Sản lượng thu hoạch dự báo hàng tháng từ dữ liệu phân tích AI.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadForecastCsv(rows, { province, crop })}
          disabled={rows.length === 0}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tải CSV
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-muted-foreground">
          Tỉnh/Thành
          <select
            value={province}
            onChange={(event) => onProvinceChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            <option value="">Tất cả tỉnh/thành</option>
            {provinceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Loại nông sản
          <select
            value={crop}
            onChange={(event) => onCropChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            <option value="">Tất cả nông sản</option>
            {cropOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ChartContainer
        config={{ predictedQuantity: { label: "Thu hoạch dự báo", color: "var(--primary)" } }}
        className="mt-4 h-72 w-full"
      >
        <LineChart data={data} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickFormatter={(value) => `T${value}`} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactKg(Number(value))} width={54} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${formatKg(Number(value))} kg`} />} />
          <Line
            type="monotone"
            dataKey="predictedQuantity"
            stroke="var(--color-predictedQuantity)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
      {data.every((item) => item.predictedQuantity === 0) && (
        <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Không có dữ liệu dự báo cho tỉnh và loại nông sản đã chọn.
        </div>
      )}
    </div>
  );
}

function ProvinceRiskRanking({
  data,
}: {
  data: { province: string; highRiskCount: number; totalRiskCount: number }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold">Xếp hạng rủi ro theo tỉnh</h3>
      <p className="text-xs text-muted-foreground">Các tỉnh có số lượng lô nông sản rủi ro cao nhiều nhất</p>
      <ChartContainer
        config={{ highRiskCount: { label: "Rủi ro cao", color: "#dc2626" } }}
        className="mt-4 h-72 w-full"
      >
        <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis dataKey="province" type="category" tickLine={false} axisLine={false} width={92} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="highRiskCount" fill="#dc2626" radius={[0, 6, 6, 0]}>
            {data.slice(0, 8).map((row) => (
              <Cell key={row.province} fill={row.highRiskCount > 0 ? "#dc2626" : "#f59e0b"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      {data.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu cho các tỉnh rủi ro cao.
        </div>
      )}
    </div>
  );
}

function CropTypeRiskCard({
  row,
}: {
  row: {
    cropName: string;
    highestRiskLevel: RiskLevel;
    maxRiskScore: number;
    highRiskCount: number;
    mediumRiskCount: number;
    batchCount: number;
    currentQuantity: number;
    nearestExpiryDays: number | null;
  };
}) {
  const cropImage = getCropImage(row.cropName);

  return (
    <div className={`rounded-xl border p-4 ${riskCardSurface(row.highestRiskLevel)}`}>
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-background shadow-sm">
          {cropImage ? (
            <img src={cropImage} alt={row.cropName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-soft text-primary">
              <Package className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold leading-tight">{row.cropName}</div>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskPill(row.highestRiskLevel)}`}>
            {riskLabel(row.highestRiskLevel)}
          </span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Điểm tối đa" value={`${formatNumber(row.maxRiskScore)}/100`} />
        <Metric label="Tồn kho" value={`${formatKg(row.currentQuantity)} kg`} />
        <Metric label="Số lô" value={`${row.batchCount}`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">
          {row.highRiskCount} rủi ro cao
        </span>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
          {row.mediumRiskCount} rủi ro TB
        </span>
        <span className="rounded-full bg-background/80 px-2.5 py-1 text-muted-foreground">
          hết hạn gần nhất: {row.nearestExpiryDays ?? "?"} ngày
        </span>
      </div>
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
      <div className="text-xs text-muted-foreground">Dự báo theo luật (rule-based) từ backend</div>
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
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";
}

function riskBar(level: RiskLevel) {
  return level === "HIGH" ? "bg-destructive" : level === "MEDIUM" ? "bg-amber-500" : "bg-green-600";
}

function riskDistributionData(rows: InventoryRiskResponse[]) {
  return (["HIGH", "MEDIUM", "LOW"] as RiskLevel[]).map((level) => ({
    level,
    label: level === "HIGH" ? "Cao" : level === "MEDIUM" ? "Trung bình" : "Thấp",
    count: rows.filter((row) => row.riskLevel === level).length,
    fill: riskChartColor(level),
  }));
}

function provinceHighRiskRanking(rows: InventoryRiskResponse[]) {
  const groups = new Map<string, { highRiskCount: number; totalRiskCount: number }>();
  rows.forEach((row) => {
    const current = groups.get(row.province) ?? { highRiskCount: 0, totalRiskCount: 0 };
    current.totalRiskCount += 1;
    if (row.riskLevel === "HIGH") current.highRiskCount += 1;
    groups.set(row.province, current);
  });
  return Array.from(groups.entries())
    .map(([province, value]) => ({ province, ...value }))
    .filter((row) => row.highRiskCount > 0)
    .sort((a, b) => b.highRiskCount - a.highRiskCount || b.totalRiskCount - a.totalRiskCount);
}

function cropTypeRiskSummary(rows: InventoryRiskResponse[]) {
  const groups = new Map<
    string,
    {
      cropName: string;
      highestRiskLevel: RiskLevel;
      maxRiskScore: number;
      highRiskCount: number;
      mediumRiskCount: number;
      batchCount: number;
      currentQuantity: number;
      nearestExpiryDays: number | null;
    }
  >();

  rows.forEach((row) => {
    const current =
      groups.get(row.cropName) ??
      {
        cropName: row.cropName,
        highestRiskLevel: "LOW" as RiskLevel,
        maxRiskScore: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        batchCount: 0,
        currentQuantity: 0,
        nearestExpiryDays: null,
      };
    current.batchCount += 1;
    current.currentQuantity += Number(row.currentQuantity ?? 0);
    current.maxRiskScore = Math.max(current.maxRiskScore, Number(row.riskScore ?? 0));
    current.highestRiskLevel = strongerRiskLevel(current.highestRiskLevel, row.riskLevel);
    if (row.riskLevel === "HIGH") current.highRiskCount += 1;
    if (row.riskLevel === "MEDIUM") current.mediumRiskCount += 1;
    if (row.daysUntilExpiry != null) {
      current.nearestExpiryDays =
        current.nearestExpiryDays == null
          ? row.daysUntilExpiry
          : Math.min(current.nearestExpiryDays, row.daysUntilExpiry);
    }
    groups.set(row.cropName, current);
  });

  return Array.from(groups.values()).sort(
    (a, b) =>
      b.highRiskCount - a.highRiskCount ||
      b.maxRiskScore - a.maxRiskScore ||
      b.currentQuantity - a.currentQuantity,
  );
}

function monthlyForecastTrend(forecasts: ForecastResult[]) {
  const groups = new Map<number, number>();
  for (let month = 1; month <= 12; month += 1) {
    groups.set(month, 0);
  }
  forecasts.forEach((forecast) => {
    groups.set(
      forecast.month,
      (groups.get(forecast.month) ?? 0) + Number(forecast.predictedQuantity ?? 0),
    );
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, predictedQuantity]) => ({ month, predictedQuantity }));
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function downloadForecastCsv(
  forecasts: ForecastResult[],
  filters: { province: string; crop: string },
) {
  const headers = ["province", "cropName", "year", "month", "predictedQuantity", "modelName", "createdAt"];
  const rows = forecasts.map((forecast) => [
    forecast.province,
    forecast.cropName,
    forecast.year,
    forecast.month,
    forecast.predictedQuantity,
    forecast.modelName,
    forecast.createdAt,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => csvEscape(String(value ?? ""))).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filenameParts = ["coordination-forecast", filters.province, filters.crop]
    .map((part) => part.trim().replace(/\s+/g, "-").toLowerCase())
    .filter(Boolean);
  link.href = url;
  link.download = `${filenameParts.join("_") || "coordination-forecast"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function strongerRiskLevel(current: RiskLevel, next: RiskLevel) {
  const rank: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  return rank[next] > rank[current] ? next : current;
}

function riskChartColor(level: RiskLevel) {
  if (level === "HIGH") return "#dc2626";
  if (level === "MEDIUM") return "#f59e0b";
  return "#16a34a";
}

function riskCardSurface(level: RiskLevel) {
  if (level === "HIGH") return "border-destructive/30 bg-destructive/5";
  if (level === "MEDIUM") return "border-amber-300 bg-amber-50/70";
  return "border-primary/30 bg-primary-soft/30";
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

function formatCompactKg(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}K`;
  return Math.round(value).toLocaleString("vi-VN");
}
