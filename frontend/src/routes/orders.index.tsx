import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2, PackageCheck, ShieldCheck, ShoppingBag, Truck, X } from "lucide-react";

import type { Order, OrderStatus } from "@/api/orderApi";
import type { Crop, CropBatch } from "@/api/cropApi";
import type { OrderItem } from "@/api/orderItemApi";
import type { Shipment } from "@/api/shipmentApi";
import { PageShell } from "@/components/site-layout";
import { useAuth } from "@/hooks/use-auth";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useOrderItems } from "@/hooks/use-order-items";
import { useMyOrders, useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useMyShipments, useUpdateShipmentStatus } from "@/hooks/use-shipments";
import type { UserRole } from "@/lib/auth";
import { getCropImage } from "@/lib/crop-images";
import { formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Quan ly don hang - AgriConnect" }] }),
  component: OrdersPage,
});

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Vừa tạo đơn",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

interface OrderRow {
  id: number;
  status: OrderStatus;
  totalAmount?: number;
  orderDate?: string | null;
  source: "order" | "shipment";
  shipmentId?: number;
  logisticsUserId?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  items: OrderCropInfo[];
}

interface OrderCropInfo {
  id: number;
  batchId: number;
  quantity: number;
  unitPrice: number;
  farmerName: string;
  cropName: string;
  image?: string;
}

function OrdersPage() {
  const { role, ready } = useAuth();
  const ordersQuery = useOrders(undefined, role === "ADMIN" || role === "FARMER" || role === "LOGISTICS");
  const myOrdersQuery = useMyOrders(role === "BUYER");
  const shipmentsQuery = useMyShipments(role === "FARMER" || role === "LOGISTICS");
  const orderItemsQuery = useOrderItems(undefined, !!role);
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const updateOrderStatus = useUpdateOrderStatus();
  const updateShipmentStatus = useUpdateShipmentStatus();

  const rows = getRows(role, ordersQuery.data, myOrdersQuery.data, shipmentsQuery.data, orderItemsQuery.data, batchesQuery.data, cropsQuery.data);
  const isLoading = !ready || ordersQuery.isLoading || myOrdersQuery.isLoading || shipmentsQuery.isLoading || orderItemsQuery.isLoading || batchesQuery.isLoading || cropsQuery.isLoading;
  const isError = ordersQuery.isError || myOrdersQuery.isError || shipmentsQuery.isError || orderItemsQuery.isError || batchesQuery.isError || cropsQuery.isError;
  const busy = updateOrderStatus.isPending || updateShipmentStatus.isPending;

  async function changeStatus(row: OrderRow, status: OrderStatus) {
    if (row.source === "shipment" && row.shipmentId) {
      await updateShipmentStatus.mutateAsync({ id: row.shipmentId, status });
      return;
    }
    await updateOrderStatus.mutateAsync({ id: row.id, status });
  }

  return (
    <PageShell>
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <ShoppingBag className="h-3.5 w-3.5" /> Đơn hàng
          </div>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Trạng thái đơn hàng</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Nông dân theo dõi đơn từ lô nông sản của mình; người mua theo dõi đơn đã mua; admin và logistics xem toàn bộ.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải đơn hàng...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            Không tải được danh sách đơn hàng. Vui lòng kiểm tra quyền truy cập hoặc backend.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Chưa có đơn hàng phù hợp.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <OrderCard key={`${row.source}-${row.id}`} row={row} role={role} busy={busy} onChangeStatus={changeStatus} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function OrderCard({
  row,
  role,
  busy,
  onChangeStatus,
}: {
  row: OrderRow;
  role: UserRole | null;
  busy: boolean;
  onChangeStatus: (row: OrderRow, status: OrderStatus) => Promise<void>;
}) {
  const actions = getAllowedActions(role, row.status);

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-semibold">Đơn #{row.id}</span>
            <StatusPill status={row.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {row.totalAmount !== undefined && <span>Tong {formatVND(row.totalAmount)}</span>}
            {row.orderDate && <span>Ngày {formatDate(row.orderDate)}</span>}
            {row.source === "shipment" && (
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Vận chuyển #{row.shipmentId}
              </span>
            )}
            {row.logisticsUserId !== undefined && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Logistics #{row.logisticsUserId}
              </span>
            )}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy}
                onClick={() => void onChangeStatus(row, status)}
                className={buttonClass(status)}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {statusLabels[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      {(row.pickupAddress || row.deliveryAddress) && (
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {row.pickupAddress && <InfoBox label="Noi lay hang" value={row.pickupAddress} />}
          {row.deliveryAddress && <InfoBox label="Noi giao hang" value={row.deliveryAddress} />}
        </div>
      )}

      {row.items.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {row.items.map((item) => (
            <div key={item.id} className="flex min-w-0 gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-primary-soft">
                {item.image ? <img src={item.image} alt={item.cropName} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs font-bold text-primary">#{item.batchId}</div>}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{item.cropName}</div>
                <div className="mt-1 text-xs text-muted-foreground">Lo #{item.batchId}</div>
                <div className="mt-1 text-xs text-muted-foreground">Nong dan: {item.farmerName}</div>
                <div className="mt-1 text-xs font-semibold text-primary">{item.quantity} kg x {formatVND(item.unitPrice)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
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
): OrderRow[] {
  const itemsByOrder = buildItemsByOrder(orderItems ?? [], batches ?? [], crops ?? []);
  if (role === "ADMIN") return (adminOrders ?? []).map((order) => orderToRow(order, itemsByOrder));
  if (role === "BUYER") return (buyerOrders ?? []).map((order) => orderToRow(order, itemsByOrder));
  if (role === "FARMER" || role === "LOGISTICS") {
    const shipmentByOrderId = new Map((shipments ?? []).map((shipment) => [shipment.orderId, shipment]));
    return (adminOrders ?? []).map((order) => orderToRow(order, itemsByOrder, shipmentByOrderId.get(order.id)));
  }
  return [];
}

function orderToRow(order: Order, itemsByOrder: Map<number, OrderCropInfo[]>, shipment?: Shipment): OrderRow {
  return {
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate ?? order.createdAt,
    source: shipment ? "shipment" : "order",
    shipmentId: shipment?.id,
    logisticsUserId: shipment?.logisticsUserId,
    pickupAddress: shipment?.pickupAddress,
    deliveryAddress: shipment?.deliveryAddress,
    items: itemsByOrder.get(order.id) ?? [],
  };
}

function buildItemsByOrder(orderItems: OrderItem[], batches: CropBatch[], crops: Crop[]) {
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const cropById = new Map(crops.map((crop) => [crop.id, crop]));
  const itemsByOrder = new Map<number, OrderCropInfo[]>();

  orderItems.forEach((item) => {
    const batch = batchById.get(item.batchId);
    const cropName = batch ? cropById.get(batch.cropId)?.name ?? `Nong san #${batch.cropId}` : `Nong san`;
    const info: OrderCropInfo = {
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

function getAllowedActions(role: UserRole | null, current: OrderStatus): OrderStatus[] {
  if (!role || current === "DELIVERED" || current === "CANCELLED") return [];

  const actions: OrderStatus[] = [];
  if ((role === "ADMIN" || role === "FARMER") && current === "PENDING") actions.push("CONFIRMED");
  if ((role === "FARMER" || role === "LOGISTICS") && current === "CONFIRMED") actions.push("PACKING");
  if (role === "LOGISTICS" && current === "PACKING") actions.push("SHIPPING");
  if (role === "LOGISTICS" && current === "SHIPPING") actions.push("DELIVERED");
  if ((role === "BUYER" || role === "ADMIN") && (current === "PENDING" || current === "CONFIRMED")) actions.push("CANCELLED");
  return actions;
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone = status === "CANCELLED"
    ? "bg-destructive/10 text-destructive"
    : status === "DELIVERED"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-primary-soft text-primary";
  const Icon = status === "CANCELLED" ? X : status === "DELIVERED" ? CheckCircle2 : status === "SHIPPING" ? Truck : status === "PACKING" ? PackageCheck : Clock;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      <Icon className="h-3 w-3" /> {statusLabels[status]}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function buttonClass(status: OrderStatus) {
  const tone = status === "CANCELLED"
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : "bg-primary text-primary-foreground hover:bg-primary/90";
  return `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${tone}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
