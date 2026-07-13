import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Crop, CropBatch } from "@/api/cropApi";
import type { Order, OrderStatus } from "@/api/orderApi";
import type { OrderItem } from "@/api/orderItemApi";
import type { Shipment } from "@/api/shipmentApi";
import type { UserProfile } from "@/api/userApi";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/site-layout";
import { useAuth } from "@/hooks/use-auth";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useOrderItems } from "@/hooks/use-order-items";
import { useMyOrdersPage, useOrdersPage, useOrderStatusCounts, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useMyShipments } from "@/hooks/use-shipments";
import { useVisibleBuyers } from "@/hooks/use-user-profile";
import type { UserRole } from "@/lib/auth";
import { getCropImage } from "@/lib/crop-images";
import { formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/shipments/")({
  head: () => ({ meta: [{ title: "Vận chuyển đơn hàng - AgriConnect" }] }),
  component: Page,
});

const statusOrder: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Vừa tạo đơn",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

interface TrackingRow {
  id: number;
  status: OrderStatus;
  totalAmount?: number;
  orderDate?: string | null;
  buyerId: number;
  buyer?: UserProfile;
  shipmentId?: number;
  logisticsUserId?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: CropInfo[];
}

interface CropInfo {
  id: number;
  batchId: number;
  quantity: number;
  unitPrice: number;
  farmerName: string;
  cropName: string;
  image?: string;
}

function Page() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Tối ưu: Đổi mặc định sang 5 cho gọn thẻ
  const { role, ready } = useAuth();
  const orderFilters = statusFilter === "ALL" ? undefined : { status: statusFilter };
  const ordersQuery = useOrdersPage(
    orderFilters,
    { page: page - 1, size: pageSize },
    role === "ADMIN" || role === "FARMER" || role === "LOGISTICS",
    5000,
  );
  const myOrdersQuery = useMyOrdersPage({ page: page - 1, size: pageSize }, role === "BUYER", 5000);
  const statusCountsQuery = useOrderStatusCounts(!!role, 5000);
  const shipmentsQuery = useMyShipments(!!role);
  const orderItemsQuery = useOrderItems(undefined, !!role);
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const buyersQuery = useVisibleBuyers(!!role);
  const updateOrderStatus = useUpdateOrderStatus();

  const rows = useMemo(
    () =>
      getRows(
        role,
        ordersQuery.data?.content,
        myOrdersQuery.data?.content,
        shipmentsQuery.data,
        orderItemsQuery.data,
        batchesQuery.data,
        cropsQuery.data,
        buyersQuery.data,
      ),
    [
      role,
      ordersQuery.data?.content,
      myOrdersQuery.data?.content,
      shipmentsQuery.data,
      orderItemsQuery.data,
      batchesQuery.data,
      cropsQuery.data,
      buyersQuery.data,
    ],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      const haystack = [
        row.id,
        row.shipmentId,
        row.logisticsUserId,
        row.buyer?.fullName,
        row.buyer?.email,
        row.buyer?.phone,
        row.pickupAddress,
        row.deliveryAddress,
        statusLabels[row.status],
        ...row.items.flatMap((item) => [item.batchId, item.cropName, item.farmerName]),
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [q, rows, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  useEffect(() => {
    const totalRows = q.trim()
      ? filtered.length
      : role === "BUYER"
        ? (myOrdersQuery.data?.totalElements ?? filtered.length)
        : (ordersQuery.data?.totalElements ?? filtered.length);
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, myOrdersQuery.data?.totalElements, ordersQuery.data?.totalElements, page, pageSize, q, role]);

  const totalRows = q.trim()
    ? filtered.length
    : role === "BUYER"
      ? (myOrdersQuery.data?.totalElements ?? filtered.length)
      : (ordersQuery.data?.totalElements ?? filtered.length);
  const pagedRows = filtered;

  const isLoading =
    !ready ||
    ordersQuery.isLoading ||
    myOrdersQuery.isLoading ||
    shipmentsQuery.isLoading ||
    orderItemsQuery.isLoading ||
    batchesQuery.isLoading ||
    cropsQuery.isLoading ||
    buyersQuery.isLoading;
  const isError =
    ordersQuery.isError ||
    myOrdersQuery.isError ||
    shipmentsQuery.isError ||
    orderItemsQuery.isError ||
    batchesQuery.isError ||
    cropsQuery.isError ||
    buyersQuery.isError;
  const busy = updateOrderStatus.isPending;

  async function changeStatus(row: TrackingRow, status: OrderStatus) {
    await updateOrderStatus.mutateAsync({ id: row.id, status });
  }

  return (
    <PageShell>
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <Truck className="h-3.5 w-3.5" /> Vận chuyển
          </div>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Đơn hàng và giao nhận</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Nông dân theo dõi đơn từ lô nông sản của mình; người mua theo dõi đơn đã mua; admin và
            logistics xem toàn bộ.
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Tìm mã đơn, mã lô, nông sản, nông dân..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "ALL")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {statusOrder.map((status) => {
            const count = statusCountsQuery.data?.[status] ?? 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter((current) => (current === status ? "ALL" : status))}
                className={`rounded-lg border p-3 text-left shadow-card transition-colors ${
                  statusFilter === status
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-card hover:bg-muted/60"
                }`}
              >
                <div className="text-2xl font-bold text-primary">{count}</div>
                <div className="mt-1 text-xs font-semibold">{statusLabels[status]}</div>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải đơn hàng...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            Không tải được danh sách đơn hàng. Vui lòng kiểm tra quyền truy cập hoặc backend.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Chưa có đơn hàng phù hợp.
          </div>
        ) : (
          <div className="space-y-4">
            {pagedRows.map((row) => (
              <TrackingCard
                key={row.id}
                row={row}
                role={role}
                busy={busy}
                onChangeStatus={changeStatus}
              />
            ))}
            <PaginationControls
              totalItems={totalRows}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

function TrackingCard({
  row,
  role,
  busy,
  onChangeStatus,
}: {
  row: TrackingRow;
  role: UserRole | null;
  busy: boolean;
  onChangeStatus: (row: TrackingRow, status: OrderStatus) => Promise<void>;
}) {
  const actions = getAllowedActions(role, row.status);

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-card">
      {/* HEADER CARD */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-semibold">Đơn #{row.id}</span>
            {row.shipmentId && (
              <span className="font-mono text-xs text-muted-foreground">VC-{row.shipmentId}</span>
            )}
            <StatusPill status={row.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {row.totalAmount !== undefined && (
              <span className="font-semibold text-foreground">Tổng: {formatVND(row.totalAmount)}</span>
            )}
            {row.orderDate && <span>Ngày: {formatDate(row.orderDate)}</span>}
            {row.logisticsUserId !== undefined && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Logistics #{row.logisticsUserId}
              </span>
            )}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy}
                onClick={() => void onChangeStatus(row, status)}
                className={actionButtonClass(status)}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {statusLabels[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BODY THU GỌN: THÔNG TIN KHÁCH HÀNG + ĐỊA CHỈ & DANH SÁCH LÔ NÔNG SẢN */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {/* Cột trái: Người mua & Nơi giao nhận */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
          <div>
            <span className="font-semibold text-foreground">Khách hàng: </span>
            <span>{row.buyer?.fullName ?? `Người mua #${row.buyerId}`}</span>
            {row.buyer?.phone && <span className="text-muted-foreground"> ({row.buyer.phone})</span>}
          </div>
          {row.pickupAddress && (
            <div className="flex items-start gap-1">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span><strong className="font-medium text-foreground">Lấy:</strong> {row.pickupAddress}</span>
            </div>
          )}
          {row.deliveryAddress && (
            <div className="flex items-start gap-1">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              <span><strong className="font-medium text-foreground">Giao:</strong> {row.deliveryAddress}</span>
            </div>
          )}
        </div>

        {/* Cột phải: Danh sách nông sản có scroll nội bộ nếu quá nhiều */}
        <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
          {row.items.length > 0 ? (
            row.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/10 p-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-primary-soft">
                    {item.image ? (
                      <img src={item.image} alt={item.cropName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[10px] font-bold text-primary">
                        #{item.batchId}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{item.cropName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Lô #{item.batchId} • ND: {item.farmerName}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right font-medium text-primary">
                  {item.quantity} kg x {formatVND(item.unitPrice)}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-muted/10 p-3 text-xs text-muted-foreground">
              Chưa có thông tin lô nông sản.
            </div>
          )}
        </div>
      </div>

      {/* TIMELINE THU NHỎ */}
      <Timeline status={row.status} />
    </article>
  );
}

function getRows(
  role: UserRole | null,
  adminOrders?: Order[],
  buyerOrders?: Order[],
  shipments?: Shipment[],
  orderItems?: OrderItem[],
  batches?: CropBatch[],
  crops?: Crop[],
  buyers?: UserProfile[],
): TrackingRow[] {
  const itemsByOrder = buildItemsByOrder(orderItems ?? [], batches ?? [], crops ?? []);
  const shipmentByOrderId = new Map(
    (shipments ?? []).map((shipment) => [shipment.orderId, shipment]),
  );
  const buyerById = new Map((buyers ?? []).map((buyer) => [buyer.id, buyer]));

  if (role === "BUYER")
    return (buyerOrders ?? []).map((order) =>
      orderToRow(
        order,
        itemsByOrder,
        shipmentByOrderId.get(order.id),
        buyerById.get(order.buyerId),
      ),
    );
  if (role === "ADMIN" || role === "FARMER" || role === "LOGISTICS") {
    return (adminOrders ?? []).map((order) =>
      orderToRow(
        order,
        itemsByOrder,
        shipmentByOrderId.get(order.id),
        buyerById.get(order.buyerId),
      ),
    );
  }
  return [];
}

function orderToRow(
  order: Order,
  itemsByOrder: Map<number, CropInfo[]>,
  shipment?: Shipment,
  buyer?: UserProfile,
): TrackingRow {
  return {
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate ?? order.createdAt,
    buyerId: order.buyerId,
    buyer,
    shipmentId: shipment?.id,
    logisticsUserId: shipment?.logisticsUserId,
    pickupAddress: shipment?.pickupAddress,
    deliveryAddress: shipment?.deliveryAddress,
    shippedAt: shipment?.shippedAt,
    deliveredAt: shipment?.deliveredAt,
    items: itemsByOrder.get(order.id) ?? [],
  };
}

function buildItemsByOrder(orderItems: OrderItem[], batches: CropBatch[], crops: Crop[]) {
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const cropById = new Map(crops.map((crop) => [crop.id, crop]));
  const itemsByOrder = new Map<number, CropInfo[]>();

  orderItems.forEach((item) => {
    const batch = batchById.get(item.batchId);
    const cropName = batch
      ? (cropById.get(batch.cropId)?.name ?? `Nông sản #${batch.cropId}`)
      : "Nông sản";
    const info: CropInfo = {
      id: item.id,
      batchId: item.batchId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      farmerName: batch?.farmerName ?? "Unknown farmer",
      cropName,
      image: getCropImage(cropName),
    };
    itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), info]);
  });

  return itemsByOrder;
}

function Timeline({ status }: { status: OrderStatus }) {
  const activeOrder =
    status === "CANCELLED"
      ? statusOrder.indexOf("CANCELLED")
      : statusOrder.filter((step) => step !== "CANCELLED").indexOf(status);
  const flow =
    status === "CANCELLED" ? statusOrder : statusOrder.filter((step) => step !== "CANCELLED");

  return (
    <div className="mt-3 overflow-x-auto pt-2 border-t border-border/50">
      <div className="flex min-w-[560px] items-start">
        {flow.map((step, index) => {
          const done = index <= activeOrder;
          const isLast = index === flow.length - 1;
          return (
            <div key={step} className="flex flex-1 items-start">
              <div className="flex w-20 flex-col items-center">
                <div
                  className={`grid h-6 w-6 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`mt-1 text-center text-[10px] leading-tight ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {statusLabels[step]}
                </div>
              </div>
              {!isLast && (
                <div
                  className={`mt-3 h-0.5 flex-1 ${index < activeOrder ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone =
    status === "CANCELLED"
      ? "bg-destructive/10 text-destructive"
      : status === "DELIVERED"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-primary-soft text-primary";
  const Icon =
    status === "CANCELLED"
      ? X
      : status === "DELIVERED"
        ? CheckCircle2
        : status === "SHIPPING"
          ? Truck
          : status === "PACKING"
            ? PackageCheck
            : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}
    >
      <Icon className="h-3 w-3" /> {statusLabels[status]}
    </span>
  );
}

function getAllowedActions(role: UserRole | null, current: OrderStatus): OrderStatus[] {
  if (!role || current === "DELIVERED" || current === "CANCELLED") return [];

  const actions: OrderStatus[] = [];
  if ((role === "ADMIN" || role === "FARMER") && current === "PENDING") actions.push("CONFIRMED");
  if ((role === "FARMER" || role === "LOGISTICS") && current === "CONFIRMED")
    actions.push("PACKING");
  if (role === "LOGISTICS" && current === "PACKING") actions.push("SHIPPING");
  if (role === "LOGISTICS" && current === "SHIPPING") actions.push("DELIVERED");
  if ((role === "BUYER" || role === "ADMIN") && (current === "PENDING" || current === "CONFIRMED"))
    actions.push("CANCELLED");
  return actions;
}

function actionButtonClass(status: OrderStatus) {
  const tone =
    status === "CANCELLED"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : "bg-primary text-primary-foreground hover:bg-primary/90";
  return `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${tone}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}
