import axiosClient from "./axiosClient";

export type ShipmentStatus = "PENDING" | "CONFIRMED" | "PACKING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
export interface Shipment { id: number; orderId: number; logisticsUserId: number; pickupAddress: string; deliveryAddress: string; status: ShipmentStatus; shippedAt: string | null; deliveredAt: string | null; }
export type ShipmentInput = Omit<Shipment, "id">;
export interface ShipmentFilters { logisticsUserId?: number; status?: ShipmentStatus; }

export async function getShipments(filters?: ShipmentFilters) { return (await axiosClient.get<Shipment[]>("/shipments", { params: filters })).data; }
export async function getMyShipments() { return (await axiosClient.get<Shipment[]>("/shipments/my")).data; }
export async function getShipment(id: number) { return (await axiosClient.get<Shipment>(`/shipments/${id}`)).data; }
export async function getShipmentByOrder(orderId: number) { return (await axiosClient.get<Shipment>(`/shipments/order/${orderId}`)).data; }
export async function createShipment(data: ShipmentInput) { return (await axiosClient.post<Shipment>("/shipments", data)).data; }
export async function updateShipment(id: number, data: ShipmentInput) { return (await axiosClient.put<Shipment>(`/shipments/${id}`, data)).data; }
export async function updateShipmentStatus(id: number, status: ShipmentStatus) { return (await axiosClient.patch<Shipment>(`/shipments/${id}/status`, undefined, { params: { status } })).data; }
export async function deleteShipment(id: number) { await axiosClient.delete(`/shipments/${id}`); }
