import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  HeartHandshake,
  Package,
  Search,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react";

import type { CropBatch } from "@/api/cropApi";
import {
  clearForecastDataset,
  clearForecasts,
  generateAiForecast,
  importForecastCsv,
  importForecastDataset,
  type ForecastResult,
} from "@/api/forecastApi";
import type { UserProfile } from "@/api/userApi";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/site-layout";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { forecastKey, useForecasts } from "@/hooks/use-forecasts";
import { useOrders } from "@/hooks/use-orders";
import { useRescueRegistrations } from "@/hooks/use-rescue-registrations";
import { useUsers } from "@/hooks/use-user-profile";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Quản trị hệ thống - AgriConnect" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [forecastProvince, setForecastProvince] = useState("");
  const [forecastCrop, setForecastCrop] = useState("");
  const [forecastYear, setForecastYear] = useState("");
  const queryClient = useQueryClient();
  const usersQuery = useUsers();
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const ordersQuery = useOrders();
  const rescueQuery = useRescueRegistrations();
  const forecastQuery = useForecasts({
    province: forecastProvince.trim() || undefined,
    cropName: forecastCrop.trim() || undefined,
    year: forecastYear ? Number(forecastYear) : undefined,
  });
  const allForecastsQuery = useForecasts();
  const importMutation = useMutation({
    mutationFn: importForecastCsv,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: forecastKey });
    },
  });
  const importDatasetMutation = useMutation({
    mutationFn: importForecastDataset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: forecastKey });
    },
  });
  const generateAiForecastMutation = useMutation({
    mutationFn: generateAiForecast,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: forecastKey });
    },
  });
  const clearForecastMutation = useMutation({
    mutationFn: clearForecasts,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: forecastKey });
    },
  });
  const clearDatasetMutation = useMutation({
    mutationFn: clearForecastDataset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: forecastKey });
    },
  });

  const users = usersQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const rescueRequests = rescueQuery.data ?? [];
  const forecasts = forecastQuery.data ?? [];
  const allForecasts = allForecastsQuery.data ?? [];
  const pendingRescue = rescueRequests.filter((request) => request.status === "PENDING").length;
  const totalTransactions = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);
  const recentUsers = useMemo(
    () =>
      users
        .filter((user) => {
          const query = userSearch.trim().toLowerCase();
          if (!query) return true;
          return [user.fullName, user.email, user.role, user.status].some((value) =>
            value?.toLowerCase().includes(query),
          );
        })
        .sort((a, b) => b.id - a.id),
    [userSearch, users],
  );
  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(recentUsers.length / userPageSize));
    if (userPage > totalPages) setUserPage(totalPages);
  }, [recentUsers.length, userPage, userPageSize]);
  useEffect(() => {
    if (!importMutation.isSuccess) return;
    const timer = window.setTimeout(() => importMutation.reset(), 15000);
    return () => window.clearTimeout(timer);
  }, [importMutation.isSuccess, importMutation]);
  useEffect(() => {
    if (!importDatasetMutation.isSuccess) return;
    const timer = window.setTimeout(() => importDatasetMutation.reset(), 15000);
    return () => window.clearTimeout(timer);
  }, [importDatasetMutation.isSuccess, importDatasetMutation]);
  useEffect(() => {
    if (!generateAiForecastMutation.isSuccess) return;
    const timer = window.setTimeout(() => generateAiForecastMutation.reset(), 15000);
    return () => window.clearTimeout(timer);
  }, [generateAiForecastMutation.isSuccess, generateAiForecastMutation]);
  useEffect(() => {
    if (!clearForecastMutation.isSuccess) return;
    const timer = window.setTimeout(() => clearForecastMutation.reset(), 15000);
    return () => window.clearTimeout(timer);
  }, [clearForecastMutation.isSuccess, clearForecastMutation]);
  useEffect(() => {
    if (!clearDatasetMutation.isSuccess) return;
    const timer = window.setTimeout(() => clearDatasetMutation.reset(), 15000);
    return () => window.clearTimeout(timer);
  }, [clearDatasetMutation.isSuccess, clearDatasetMutation]);
  const userStart = (userPage - 1) * userPageSize;
  const pagedUsers = recentUsers.slice(userStart, userStart + userPageSize);
  const forecastTotal = useMemo(() => totalForecastQuantity(forecasts), [forecasts]);
  const monthlyForecasts = useMemo(() => monthlyTrend(forecasts), [forecasts]);
  const provinceForecasts = useMemo(() => provinceComparison(forecasts), [forecasts]);
  const provinceOptions = useMemo(() => uniqueSorted(allForecasts.map((forecast) => forecast.province)), [allForecasts]);
  const cropOptions = useMemo(() => uniqueSorted(allForecasts.map((forecast) => forecast.cropName)), [allForecasts]);
  const topProvince = provinceForecasts[0];
  const topCrop = useMemo(() => cropComparison(forecasts)[0], [forecasts]);
  const peakMonth = useMemo(
    () => [...monthlyForecasts].sort((a, b) => b.predictedQuantity - a.predictedQuantity)[0],
    [monthlyForecasts],
  );
  const isLoading =
    usersQuery.isLoading ||
    batchesQuery.isLoading ||
    cropsQuery.isLoading ||
    ordersQuery.isLoading ||
    rescueQuery.isLoading;
  const isError =
    usersQuery.isError ||
    batchesQuery.isError ||
    cropsQuery.isError ||
    ordersQuery.isError ||
    rescueQuery.isError;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Bảng quản trị
            </div>
            <h1 className="mt-1 text-3xl font-bold">Tổng quan hệ thống</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dữ liệu người dùng, lô nông sản, đơn hàng và yêu cầu giải cứu từ backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* <Link
              to="/admin/subsidy"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-5 py-3 text-sm font-semibold text-primary shadow-soft hover:bg-primary-soft"
            >
              <HeartHandshake className="h-4 w-4" /> Tính giá an sinh
            </Link> */}
            <Link
              to="/admin/rescue-requests"
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-soft"
            >
              <AlertTriangle className="h-4 w-4" /> Duyệt giải cứu
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive-foreground/20 px-1 text-[10px] font-bold">
                {pendingRescue}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {isError && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Không tải được dữ liệu quản trị từ backend.
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              i: Users,
              l: "Người dùng",
              v: users.length.toLocaleString("vi-VN"),
              sub: `${countByRole(users, "FARMER")} nông dân, ${countByRole(users, "BUYER")} người mua`,
            },
            {
              i: Package,
              l: "Lô nông sản",
              v: batches.length.toLocaleString("vi-VN"),
              sub: `${availableBatches(batches)} lô còn hàng`,
            },
            {
              i: AlertTriangle,
              l: "Yêu cầu giải cứu",
              v: rescueRequests.length.toLocaleString("vi-VN"),
              sub: `${pendingRescue} đang chờ duyệt`,
            },
            {
              i: TrendingUp,
              l: "Tổng giao dịch",
              v: formatVND(totalTransactions),
              sub: `${orders.length} đơn hàng`,
            },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-bold">{isLoading ? "..." : s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-xs font-medium text-primary">{s.sub}</div>
            </div>
          ))}
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <BarChart3 className="h-3.5 w-3.5" /> AI Forecast MVP
              </div>
              <h2 className="mt-1 text-lg font-semibold">Dự báo sản lượng nông sản</h2>
              <p className="text-sm text-muted-foreground">
                Kết quả từ mô hình tối ưu nhất trong: RandomForest, GradientBoosting, DecisionTree, LinearRegression local trong thư mục ai/data/forecast_result.csv.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => importDatasetMutation.mutate()}
                disabled={importDatasetMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-4 py-2 text-sm font-semibold text-primary shadow-soft disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {importDatasetMutation.isPending ? "Đang import..." : "Import Dataset"}
              </button>
              <button
                type="button"
                onClick={() => generateAiForecastMutation.mutate()}
                disabled={generateAiForecastMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
              >
                <TrendingUp className="h-4 w-4" />
                {generateAiForecastMutation.isPending ? "Generating..." : "Generate AI Forecast"}
              </button>
              <button
                type="button"
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {importMutation.isPending ? "Đang import..." : "Import Forecast Local"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Xóa tất cả forecast results?")) clearForecastMutation.mutate();
                }}
                disabled={clearForecastMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-destructive bg-card px-4 py-2 text-sm font-semibold text-destructive shadow-soft disabled:opacity-60"
              >
                Clear Forecast
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Xóa toàn bộ AI training dataset trong backend?")) clearDatasetMutation.mutate();
                }}
                disabled={clearDatasetMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-soft disabled:opacity-60"
              >
                Clear Dataset
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-border p-5 md:grid-cols-3">
            <FilterInput
              label="Tỉnh"
              value={forecastProvince}
              onChange={setForecastProvince}
              placeholder="Chọn tỉnh"
              options={provinceOptions}
            />
            <FilterInput
              label="Loại nông sản"
              value={forecastCrop}
              onChange={setForecastCrop}
              placeholder="Chọn loại nông sản"
              options={cropOptions}
            />
            {/* <FilterInput label="Year" value={forecastYear} onChange={setForecastYear} placeholder="2026" /> */}
          </div>

          {importMutation.isSuccess && (
            <div className="mx-5 mt-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-sm text-primary">
              Đã import {importMutation.data.importedRows} dòng dự báo.
            </div>
          )}
          {importDatasetMutation.isSuccess && (
            <div className="mx-5 mt-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-sm text-primary">
              Đã import {importDatasetMutation.data.importedRows} dòng dataset lịch sử.
            </div>
          )}
          {generateAiForecastMutation.isSuccess && (
            <div className="mx-5 mt-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-sm text-primary">
              AI service generated {generateAiForecastMutation.data.importedRows} forecast rows
              {generateAiForecastMutation.data.modelName ? ` with ${generateAiForecastMutation.data.modelName}` : ""}.
            </div>
          )}
          {clearForecastMutation.isSuccess && (
            <div className="mx-5 mt-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-sm text-primary">
              Đã xóa {clearForecastMutation.data.deletedRows} dòng forecast results.
            </div>
          )}
          {clearDatasetMutation.isSuccess && (
            <div className="mx-5 mt-4 rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-sm text-primary">
              Đã xóa {clearDatasetMutation.data.deletedRows} dòng AI training dataset.
            </div>
          )}
          {importMutation.isError && (
            <div className="mx-5 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Không import được forecast_result.csv. Hãy chạy Python forecast trước.
            </div>
          )}
          {importDatasetMutation.isError && (
            <div className="mx-5 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Không import được cleaned_agri_forecast_dataset.csv. Hãy chạy Python ETL trước.
            </div>
          )}

          {generateAiForecastMutation.isError && (
            <div className="mx-5 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getMutationErrorMessage(
                generateAiForecastMutation.error,
                "Cannot call AI service. Start FastAPI on port 8001 and import the backend dataset first.",
              )}
            </div>
          )}
          <div className="grid gap-3 border-b border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
            <ForecastStat
              label="Tổng sản lượng dự báo"
              value={`${formatKg(forecastTotal)} kg`}
              detail={forecastYear ? `Year ${forecastYear}` : "Current filters"}
              tone="primary"
            />
            <ForecastStat
              label="Tháng cao nhất"
              value={peakMonth ? `Tháng ${peakMonth.month}` : "-"}
              detail={peakMonth ? `${formatKg(peakMonth.predictedQuantity)} kg` : "No data"}
            />
            <ForecastStat
              label="Top tỉnh"
              value={topProvince?.province ?? "-"}
              detail={topProvince ? `${formatKg(topProvince.predictedQuantity)} kg` : "No data"}
            />
            <ForecastStat
              label="Top loại nông sản"
              value={topCrop?.cropName ?? "-"}
              detail={topCrop ? `${formatKg(topCrop.predictedQuantity)} kg` : "No data"}
            />
          </div>

          <div className="grid gap-5 border-b border-border p-5 lg:grid-cols-2">
            <ForecastLineChart
              data={monthlyForecasts}
              selectedProvince={forecastProvince}
              selectedCrop={forecastCrop}
            />
            <ForecastProvinceBarChart data={provinceForecasts.slice(0, 10)} />
          </div>

          <div className="p-5">
            {forecastQuery.isLoading && (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                Loading forecast data...
              </div>
            )}
            {!forecastQuery.isLoading && forecasts.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                No forecast data for the current filters. Run Python forecast, import CSV, or adjust filters.
              </div>
            )}
            {!forecastQuery.isLoading && forecasts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/70 p-4">
                <div>
                  <div className="text-sm font-semibold">Dữ liệu dự báo sẵn sàng xuất sang file csv</div>
                  <div className="text-xs text-muted-foreground">
                    {forecasts.length.toLocaleString("vi-VN")} rows match the selected province, crop, and year.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadForecastCsv(forecasts, { province: forecastProvince, crop: forecastCrop, year: forecastYear })}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Cập nhật lưới chia cột ở đây */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <h2 className="text-lg font-semibold">Người dùng gần đây</h2>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Tìm theo tên..."
                  className="bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 min-w-[180px]">Người dùng</th>
                    <th className="px-5 py-3 whitespace-nowrap">Vai trò</th>
                    <th className="px-5 py-3">Liên hệ</th>
                    <th className="px-5 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-4 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                            {initial(user.fullName)}
                          </div>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground break-all max-w-[200px]">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <button
                            className="rounded-lg p-2 text-primary hover:bg-primary-soft"
                            title="Duyệt"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                            title="Khóa"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                        Không có người dùng phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!isLoading && recentUsers.length > 0 && (
              <div className="border-t border-border p-4">
                <PaginationControls
                  totalItems={recentUsers.length}
                  page={userPage}
                  pageSize={userPageSize}
                  onPageChange={setUserPage}
                  onPageSizeChange={(size) => {
                    setUserPageSize(size);
                    setUserPage(1);
                  }}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-1">
            <h2 className="text-lg font-semibold">Lô nông sản mới</h2>
            <p className="text-sm text-muted-foreground">Danh sách lấy trực tiếp từ backend.</p>
            <div className="mt-4 space-y-3">
              {batches
                .slice(-5)
                .reverse()
                .map((batch) => {
                  const cropName =
                    crops.find((crop) => crop.id === batch.cropId)?.name ??
                    `Nông sản #${batch.cropId}`;
                  return (
                    <div
                      key={batch.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <img
                        src={getCropImage(cropName)}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{cropName}</div>
                        <div className="text-xs text-muted-foreground">
                          {batch.farmerName ?? `Farmer #${batch.farmerId}`} - {batch.province}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-semibold text-primary">
                          {batch.currentQuantity} {batch.unit}
                        </div>
                        <div className="text-muted-foreground">Lô #{batch.id}</div>
                      </div>
                    </div>
                  );
                })}
              {!isLoading && batches.length === 0 && (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  Chưa có lô nông sản.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function countByRole(users: UserProfile[], role: UserProfile["role"]) {
  return users.filter((user) => user.role === role).length;
}

function availableBatches(batches: CropBatch[]) {
  return batches.filter(
    (batch) => batch.status === "available" && Number(batch.currentQuantity) > 0,
  ).length;
}

function roleLabel(role: UserProfile["role"]) {
  return role === "FARMER"
    ? "Nông dân"
    : role === "BUYER"
      ? "Người mua"
      : role === "LOGISTICS"
        ? "Vận chuyển"
        : "Quản trị";
}

function initial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "?";
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return options ?? [];
    return (options ?? []).filter((option) => option.toLowerCase().includes(query));
  }, [options, searchValue]);

  if (options) {
    return (
      <label className="relative text-sm">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3">
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              setOpen((current) => !current);
            }}
            className="min-w-0 flex-1 truncate text-left text-sm outline-none"
          >
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSearchValue("");
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Clear ${label}`}
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        {open && (
          <div
            className="absolute z-30 mt-2 w-full rounded-xl border border-border bg-card p-2 shadow-card"
            onMouseDown={(event) => event.preventDefault()}
          >
            <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={placeholder}
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setSearchValue("");
                    setOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                    option === value ? "bg-primary-soft text-primary" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No matching option.
                </div>
              )}
            </div>
          </div>
        )}
      </label>
    );
  }

  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
      />
    </label>
  );
}

function ForecastStat({
  label,
  value,
  detail,
  tone = "muted",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "primary" | "muted";
}) {
  return (
    <div className={`rounded-xl p-4 ${tone === "primary" ? "bg-primary-soft text-primary" : "bg-muted/50"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs opacity-75">{detail}</div>
    </div>
  );
}

function ForecastLineChart({
  data,
  selectedProvince,
  selectedCrop,
}: {
  data: { month: number; predictedQuantity: number }[];
  selectedProvince: string;
  selectedCrop: string;
}) {
  const subtitle =
    selectedProvince || selectedCrop
      ? [selectedProvince || "Tất cả tỉnh", selectedCrop || "Tất cả nông sản"].join(" - ")
      : "Tổng hợp tất cả tỉnh/thành và nông sản";
  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <h3 className="text-sm font-semibold">Xu hướng sản lượng theo tháng</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <ChartContainer config={{ predictedQuantity: { label: "Dự báo", color: "var(--primary)" } }} className="mt-4 h-72 w-full">
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
      {totalForecastQuantity(data) === 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu xu hướng cho bộ lọc hiện tại.
        </div>
      )}
    </div>
  );
}

function ForecastProvinceBarChart({
  data,
}: {
  data: { province: string; predictedQuantity: number }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <h3 className="text-sm font-semibold">So sánh sản lượng theo tỉnh</h3>
      <p className="text-xs text-muted-foreground">Sắp xếp giảm dần, hiển thị top tỉnh/thành</p>
      <ChartContainer config={{ predictedQuantity: { label: "Dự báo", color: "var(--primary)" } }} className="mt-4 h-72 w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactKg(Number(value))} />
          <YAxis dataKey="province" type="category" tickLine={false} axisLine={false} width={92} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${formatKg(Number(value))} kg`} />} />
          <Bar dataKey="predictedQuantity" fill="var(--color-predictedQuantity)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartContainer>
      {data.length === 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu tỉnh/thành cho bộ lọc hiện tại.
        </div>
      )}
    </div>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function downloadForecastCsv(
  forecasts: ForecastResult[],
  filters: { province: string; crop: string; year: string },
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
  const filenameParts = ["forecast", filters.province, filters.crop, filters.year]
    .map((part) => part.trim().replace(/\s+/g, "-").toLowerCase())
    .filter(Boolean);
  link.href = url;
  link.download = `${filenameParts.join("_") || "forecast"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response;
    const data = response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    if (response?.status) return `${fallback} Backend status: ${response.status}.`;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function monthlyTrend(forecasts: ForecastResult[]) {
  const groups = new Map<number, number>();
  for (let month = 1; month <= 12; month += 1) {
    groups.set(month, 0);
  }
  forecasts.forEach((forecast) => {
    const key = forecast.month;
    groups.set(key, (groups.get(key) ?? 0) + Number(forecast.predictedQuantity ?? 0));
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, predictedQuantity]) => ({ month, predictedQuantity }));
}

function provinceComparison(forecasts: ForecastResult[]) {
  const groups = new Map<string, number>();
  forecasts.forEach((forecast) => {
    groups.set(
      forecast.province,
      (groups.get(forecast.province) ?? 0) + Number(forecast.predictedQuantity ?? 0),
    );
  });
  return Array.from(groups.entries())
    .map(([province, predictedQuantity]) => ({ province, predictedQuantity }))
    .sort((a, b) => b.predictedQuantity - a.predictedQuantity);
}

function cropComparison(forecasts: ForecastResult[]) {
  const groups = new Map<string, number>();
  forecasts.forEach((forecast) => {
    groups.set(
      forecast.cropName,
      (groups.get(forecast.cropName) ?? 0) + Number(forecast.predictedQuantity ?? 0),
    );
  });
  return Array.from(groups.entries())
    .map(([cropName, predictedQuantity]) => ({ cropName, predictedQuantity }))
    .sort((a, b) => b.predictedQuantity - a.predictedQuantity);
}

function totalForecastQuantity(items: { predictedQuantity: number }[]) {
  return items.reduce((sum, item) => sum + Number(item.predictedQuantity ?? 0), 0);
}

function formatKg(value: number) {
  return Math.round(value).toLocaleString("vi-VN");
}

function formatCompactKg(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}K`;
  return Math.round(value).toLocaleString("vi-VN");
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
