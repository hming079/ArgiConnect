import axiosClient from "./axiosClient";
import { normalizePage, unwrapPage, type PageParams, type PageResponse } from "./pagination";

export type ShipmentStatus = "PENDING" | "CONFIRMED" | "PACKING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
export interface Shipment { id: number; orderId: number; logisticsUserId: number; pickupAddress: string; deliveryAddress: string; status: ShipmentStatus; shippedAt: string | null; deliveredAt: string | null; }
export type ShipmentInput = Omit<Shipment, "id">;
export interface ShipmentFilters { logisticsUserId?: number; status?: ShipmentStatus; }

export async function getShipments(filters?: ShipmentFilters) { return unwrapPage((await axiosClient.get<Shipment[] | PageResponse<Shipment>>("/shipments", { params: { ...filters, size: 100 } })).data); }
export async function getShipmentsPage(filters?: ShipmentFilters, pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  return normalizePage((await axiosClient.get<Shipment[] | PageResponse<Shipment>>("/shipments", { params: { ...filters, page, size } })).data, page, size);
}
export async function getMyShipments() {
  const size = 100;
  const firstPage = await getMyShipmentsPage({ page: 0, size });
  const shipments = [...firstPage.content];
  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await getMyShipmentsPage({ page, size });
    shipments.push(...nextPage.content);
  }
  return shipments;
}
export async function getMyShipmentsPage(pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  return normalizePage((await axiosClient.get<Shipment[] | PageResponse<Shipment>>("/shipments/my", { params: { page, size } })).data, page, size);
}
export async function getShipment(id: number) { return (await axiosClient.get<Shipment>(`/shipments/${id}`)).data; }
export async function getShipmentByOrder(orderId: number) { return (await axiosClient.get<Shipment>(`/shipments/order/${orderId}`)).data; }
export async function createShipment(data: ShipmentInput) { return (await axiosClient.post<Shipment>("/shipments", data)).data; }
export async function updateShipment(id: number, data: ShipmentInput) { return (await axiosClient.put<Shipment>(`/shipments/${id}`, data)).data; }
export async function updateShipmentStatus(id: number, status: ShipmentStatus) { return (await axiosClient.patch<Shipment>(`/shipments/${id}/status`, undefined, { params: { status } })).data; }
export async function deleteShipment(id: number) { await axiosClient.delete(`/shipments/${id}`); }
