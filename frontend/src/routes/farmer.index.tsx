import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Edit, Eye, Package, Plus, ShoppingBag, Sprout, TrendingUp } from "lucide-react";

import type { Crop, CropBatch } from "@/api/cropApi";
import type { Order } from "@/api/orderApi";
import type { OrderItem } from "@/api/orderItemApi";
import { PageShell } from "@/components/site-layout";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useOrderItems } from "@/hooks/use-order-items";
import { useOrders } from "@/hooks/use-orders";
import { useMyRescueRegistrations } from "@/hooks/use-rescue-registrations";
import { useMyProfile } from "@/hooks/use-user-profile";

export const Route = createFileRoute("/farmer/")({
  head: () => ({ meta: [{ title: "Tong quan nguoi ban - AgriConnect" }] }),
  component: FarmerDashboard,
});

function FarmerDashboard() {
  const profileQuery = useMyProfile();
  const batchesQuery = useCropBatches(undefined, true);
  const cropsQuery = useCrops();
  const ordersQuery = useOrders();
  const orderItemsQuery = useOrderItems(undefined, true);
  const rescueQuery = useMyRescueRegistrations();

  const profile = profileQuery.data;
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const orderItems = orderItemsQuery.data ?? [];
  const rescueRequests = rescueQuery.data ?? [];
  const farmerBatchIds = new Set(batches.map((batch) => batch.id));
  const farmerItems = orderItems.filter((item) => farmerBatchIds.has(item.batchId));
  const totalSold = batches.reduce((sum, batch) => sum + Math.max(0, Number(batch.initialQuantity ?? 0) - Number(batch.currentQuantity ?? 0)), 0);
  const totalRevenue = farmerItems.reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0), 0);
  const chart = buildChart(orders, farmerItems);
  const max = Math.max(1, ...chart.map((point) => point.value));
  const isLoading = profileQuery.isLoading || batchesQuery.isLoading || cropsQuery.isLoading || ordersQuery.isLoading || orderItemsQuery.isLoading || rescueQuery.isLoading;
  const isError = profileQuery.isError || batchesQuery.isError || cropsQuery.isError || ordersQuery.isError || orderItemsQuery.isError || rescueQuery.isError;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Bang dieu khien</div>
            <h1 className="mt-1 text-3xl font-bold">Xin chao, {profile?.fullName ?? "nong dan"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quan ly lo nong san, don hang va doanh thu bang du lieu backend.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/shipments" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted">Van chuyen</Link>
            <Link to="/farmer/rescue-requests" className="inline-flex items-center gap-2 rounded-full border border-destructive bg-card px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10">
              <AlertTriangle className="h-4 w-4" /> Gui yeu cau giai cuu
            </Link>
            <Link to="/farmer/batches" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-95">
              <Plus className="h-4 w-4" /> Quan ly lo
            </Link>
          </div>
        </div>

        {isError && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Khong tai duoc du lieu nong dan tu backend.</div>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Package, l: "Lo dang ban", v: batches.filter((batch) => Number(batch.currentQuantity) > 0).length, sub: `${batches.length} tong so lo`, tone: "primary" },
            { i: ShoppingBag, l: "Don hang", v: orders.length, sub: "Lien quan lo cua ban", tone: "accent" },
            { i: TrendingUp, l: "Da ban (kg)", v: totalSold.toLocaleString("vi-VN"), sub: formatVND(totalRevenue), tone: "primary" },
            { i: AlertTriangle, l: "Can giai cuu", v: rescueRequests.filter((request) => request.status === "PENDING").length, sub: "Dang cho duyet", tone: "destructive" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${
                s.tone === "destructive" ? "bg-destructive/10 text-destructive" : s.tone === "accent" ? "bg-accent/30 text-accent-foreground" : "bg-primary-soft text-primary"
              }`}>
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-bold">{isLoading ? "..." : s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-xs font-medium text-primary">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">San luong ban theo thang</h2>
                <p className="text-sm text-muted-foreground">6 thang gan nhat, tinh tu order item backend.</p>
              </div>
            </div>

            <div className="mt-8 flex h-56 items-end gap-3">
              {chart.map((point) => (
                <div key={point.label} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div className="w-full rounded-t-lg bg-primary transition-all group-hover:bg-primary/80" style={{ height: `${(point.value / max) * 100}%` }} />
                    <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs text-background group-hover:block">{point.value}kg</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{point.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Hoat dong gan day</h2>
            <ul className="mt-4 space-y-4">
              {buildActivities(orders, batches, rescueRequests.length).map((activity, index) => (
                <li key={`${activity.t}-${index}`} className="flex gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><activity.i className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.t}</div>
                    <div className="text-xs text-muted-foreground">{activity.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-lg font-semibold">Lo nong san cua ban</h2>
            <Link to="/farmer/batches" className="text-sm font-medium text-primary hover:underline">Quan ly tat ca</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Ma</th>
                  <th className="px-5 py-3">Nong san</th>
                  <th className="px-5 py-3">Da ban / Tong</th>
                  <th className="px-5 py-3">Don</th>
                  <th className="px-5 py-3">Trang thai</th>
                  <th className="px-5 py-3 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const cropName = cropNameFor(batch, crops);
                  const sold = Math.max(0, Number(batch.initialQuantity ?? 0) - Number(batch.currentQuantity ?? 0));
                  const total = Math.max(1, Number(batch.initialQuantity ?? 0));
                  const pct = Math.min(100, Math.round((sold / total) * 100));
                  return (
                    <tr key={batch.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">#{batch.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-medium">
                          {cropName}
                          {rescueRequests.some((request) => request.batchId === batch.id) && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">Giai cuu</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{batch.province}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-muted-foreground">{sold.toLocaleString("vi-VN")} / {Number(batch.initialQuantity).toLocaleString("vi-VN")} {batch.unit}</div>
                        <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      </td>
                      <td className="px-5 py-4">{orderCountForBatch(batch.id, farmerItems)}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">{cropBatchStatusLabel(batch.status)}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Link to="/products" className="rounded-lg p-2 hover:bg-muted"><Eye className="h-4 w-4" /></Link>
                          <Link to="/farmer/batches" className="rounded-lg p-2 hover:bg-muted"><Edit className="h-4 w-4" /></Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && batches.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Ban chua co lo nong san.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function buildChart(orders: Order[], items: OrderItem[]) {
  const now = new Date();
  const orderById = new Map(orders.map((order) => [order.id, order]));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const value = items.reduce((sum, item) => {
      const order = orderById.get(item.orderId);
      const orderDate = new Date(order?.orderDate ?? order?.createdAt ?? 0);
      return orderDate.getMonth() === month && orderDate.getFullYear() === year ? sum + Number(item.quantity ?? 0) : sum;
    }, 0);
    return { label: `T${month + 1}`, value };
  });
}

function buildActivities(orders: Order[], batches: CropBatch[], rescueCount: number) {
  const activities = [
    ...orders.slice(-2).reverse().map((order) => ({ t: `Don hang #${order.id} dang o trang thai ${order.status}`, d: formatDate(order.orderDate ?? order.createdAt), i: ShoppingBag })),
    ...batches.slice(-1).map((batch) => ({ t: `Lo nong san #${batch.id} con ${batch.currentQuantity} ${batch.unit}`, d: batch.updatedAt ? formatDate(batch.updatedAt) : "Moi cap nhat", i: TrendingUp })),
  ];
  if (rescueCount > 0) activities.push({ t: `${rescueCount} yeu cau giai cuu da gui`, d: "Theo doi trang thai duyet", i: Sprout });
  return activities.length > 0 ? activities : [{ t: "Chua co hoat dong moi", d: "Du lieu se hien thi sau khi co lo va don hang", i: Sprout }];
}

function cropNameFor(batch: CropBatch, crops: Crop[]) {
  return crops.find((crop) => crop.id === batch.cropId)?.name ?? `Nong san #${batch.cropId}`;
}

function orderCountForBatch(batchId: number, items: OrderItem[]) {
  return new Set(items.filter((item) => item.batchId === batchId).map((item) => item.orderId)).size;
}

function formatDate(value?: string | null) {
  if (!value) return "Chua co ngay";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function cropBatchStatusLabel(status: CropBatch["status"]) {
  return {
    available: "Còn hàng",
    sold_out: "Đã bán hết",
    expired: "Hết hạn",
    cancelled: "Đã hủy",
  }[status];
}
