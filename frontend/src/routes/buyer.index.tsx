import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";

import type { Crop, CropBatch } from "@/api/cropApi";
import type { Order, OrderStatus } from "@/api/orderApi";
import type { OrderItem } from "@/api/orderItemApi";
import { PageShell } from "@/components/site-layout";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useOrderItems } from "@/hooks/use-order-items";
import { useMyOrders } from "@/hooks/use-orders";
import { useRescueRegistrations } from "@/hooks/use-rescue-registrations";
import { useMyProfile } from "@/hooks/use-user-profile";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/buyer/")({
  head: () => ({ meta: [{ title: "Tổng quan người mua - AgriConnect" }] }),
  component: BuyerDashboard,
});

function BuyerDashboard() {
  const profileQuery = useMyProfile();
  const ordersQuery = useMyOrders();
  const orderItemsQuery = useOrderItems(undefined, true);
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const rescueQuery = useRescueRegistrations({ status: "APPROVED" });

  const profile = profileQuery.data;
  const orders = ordersQuery.data ?? [];
  const orderItems = orderItemsQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const approvedRescueRegistrations = rescueQuery.data ?? [];
  const rescueBatchIds = new Set(approvedRescueRegistrations.map((request) => request.batchId));
  const rescueOrderItems = orderItems.filter((item) => rescueBatchIds.has(item.batchId));
  const rescueOrderCount = new Set(rescueOrderItems.map((item) => item.orderId)).size;
  const recentOrders = [...orders].sort(sortByOrderDateDesc).slice(0, 5);
  const suggestedBatches = batches
    .filter((batch) => batch.status === "available" && Number(batch.currentQuantity) > 0)
    .slice(-3)
    .reverse();
  const isLoading =
    profileQuery.isLoading ||
    ordersQuery.isLoading ||
    orderItemsQuery.isLoading ||
    batchesQuery.isLoading ||
    cropsQuery.isLoading ||
    rescueQuery.isLoading;
  const isError =
    profileQuery.isError ||
    ordersQuery.isError ||
    orderItemsQuery.isError ||
    batchesQuery.isError ||
    cropsQuery.isError ||
    rescueQuery.isError;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Tài khoản người mua
            </div>
            <h1 className="mt-1 text-3xl font-bold">
              Xin chào, {profile?.fullName ?? "người mua"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi đơn hàng và nông sản đang có trong hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/shipments"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"
            >
              <Truck className="h-4 w-4" /> Vận chuyển
            </Link>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"
            >
              <ShoppingBag className="h-4 w-4" /> Giỏ hàng
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              <Search className="h-4 w-4" /> Tìm nông sản
            </Link>
          </div>
        </div>

        {isError && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Không tải được dữ liệu người mua từ backend.
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: ShoppingBag, l: "Tổng đơn hàng", v: orders.length, sub: "Từ backend" },
            {
              i: Clock,
              l: "Đang giao",
              v: orders.filter((order) => order.status === "SHIPPING").length,
              sub: "Cập nhật theo trạng thái",
            },
            {
              i: CheckCircle2,
              l: "Đã hoàn thành",
              v: orders.filter((order) => order.status === "DELIVERED").length,
              sub: "Đơn đã giao",
            },
            {
              i: HeartHandshake,
              l: "Giải cứu đã tham gia",
              v: rescueOrderCount,
              sub: "Đơn hàng của bạn",
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
              <Link to="/shipments" className="text-sm font-medium text-primary hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentOrders.map((order) => {
                const summary = getOrderSummary(order.id, orderItems, batches, crops);
                return (
                  <div key={order.id} className="flex flex-wrap items-center gap-3 p-5">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{summary.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">#{order.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {summary.quantity} kg - {formatDate(order.orderDate ?? order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {formatVND(Number(order.totalAmount ?? 0))}
                      </div>
                      <StatusPill status={order.status} />
                    </div>
                  </div>
                );
              })}
              {!isLoading && recentOrders.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Bạn chưa có đơn hàng.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nông sản gợi ý</h2>
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {suggestedBatches.map((batch) => {
                const cropName =
                  crops.find((crop) => crop.id === batch.cropId)?.name ??
                  `Nông sản #${batch.cropId}`;
                return (
                  <Link
                    key={batch.id}
                    to="/products"
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted"
                  >
                    <img
                      src={getCropImage(cropName)}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{cropName}</div>
                      <div className="text-xs text-muted-foreground">{batch.province}</div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {formatVND(Number(batch.unitPrice))}
                    </div>
                  </Link>
                );
              })}
              {!isLoading && suggestedBatches.length === 0 && (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  Chưa có nông sản đang bán.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                <HeartHandshake className="h-3.5 w-3.5" /> Chiến dịch giải cứu
              </div>
              <h2 className="mt-1 text-lg font-semibold">Bạn đã tham gia</h2>
            </div>
            <Link
              to="/rescue-points"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Tham gia thêm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rescueOrderItems.slice(0, 6).map((item) => {
              const batch = batches.find((candidate) => candidate.id === item.batchId);
              const cropName = batch
                ? (crops.find((crop) => crop.id === batch.cropId)?.name ??
                  `Nông sản #${batch.cropId}`)
                : `Lô nông sản #${item.batchId}`;
              return (
                <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Đơn #{item.orderId}
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                      APPROVED
                    </span>
                  </div>
                  <div className="mt-2 font-semibold">{cropName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Number(item.quantity ?? 0).toLocaleString("vi-VN")} kg -{" "}
                    {formatVND(Number(item.subtotal ?? 0))}
                  </div>
                </div>
              );
            })}
            {!isLoading && rescueOrderItems.length === 0 && (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                Chưa có đơn hàng giải cứu.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function getOrderSummary(orderId: number, items: OrderItem[], batches: CropBatch[], crops: Crop[]) {
  const orderItems = items.filter((item) => item.orderId === orderId);
  const names = orderItems.map((item) => {
    const batch = batches.find((candidate) => candidate.id === item.batchId);
    return batch
      ? (crops.find((crop) => crop.id === batch.cropId)?.name ?? `Nông sản #${batch.cropId}`)
      : `Lô #${item.batchId}`;
  });
  return {
    name: names.length > 0 ? names.join(", ") : "Đơn hàng",
    quantity: orderItems
      .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
      .toLocaleString("vi-VN"),
  };
}

function sortByOrderDateDesc(a: Order, b: Order) {
  return (
    new Date(b.orderDate ?? b.createdAt ?? 0).getTime() -
    new Date(a.orderDate ?? a.createdAt ?? 0).getTime()
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone =
    status === "DELIVERED"
      ? "bg-primary-soft text-primary"
      : status === "CANCELLED"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent/30 text-accent-foreground";
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function statusLabel(status: OrderStatus) {
  return (
    {
      PENDING: "Vừa tạo đơn",
      CONFIRMED: "Đã xác nhận",
      PACKING: "Đang chuẩn bị",
      SHIPPING: "Đang giao",
      DELIVERED: "Đã giao",
      CANCELLED: "Đã hủy",
    } as Record<OrderStatus, string>
  )[status];
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có ngày";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}