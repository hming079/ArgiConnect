import axiosClient from "./axiosClient";
import { normalizePage, unwrapPage, type PageParams, type PageResponse } from "./pagination";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";
export interface Order {
  id: number;
  buyerId: number;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string | null;
  createdAt: string | null;
}
export type OrderInput = Pick<Order, "totalAmount" | "orderDate">;
export interface CheckoutInput {
  totalAmount: number;
  orderDate: string | null;
  cropLockIds: number[];
  deliveryAddress: string;
  items: { batchId: number; quantity: number; unitPrice: number }[];
}
export interface OrderFilters {
  buyerId?: number;
  status?: OrderStatus;
}

export async function getOrders(filters?: OrderFilters) {
  return unwrapPage((await axiosClient.get<Order[] | PageResponse<Order>>("/orders", { params: { ...filters, size: 100 } })).data);
}
export async function getOrdersPage(filters?: OrderFilters, pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  return normalizePage((await axiosClient.get<Order[] | PageResponse<Order>>("/orders", { params: { ...filters, page, size } })).data, page, size);
}
export async function getMyOrders() {
  return unwrapPage((await axiosClient.get<Order[] | PageResponse<Order>>("/orders/my", { params: { size: 100 } })).data);
}
export async function getMyOrdersPage(pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  return normalizePage((await axiosClient.get<Order[] | PageResponse<Order>>("/orders/my", { params: { page, size } })).data, page, size);
}
export async function getOrder(id: number) {
  return (await axiosClient.get<Order>(`/orders/${id}`)).data;
}
export async function createOrder(data: OrderInput) {
  return (await axiosClient.post<Order>("/orders", data)).data;
}
export async function checkoutOrder(data: CheckoutInput) {
  return (await axiosClient.post<Order>("/orders/checkout", data)).data;
}
export async function updateOrder(id: number, data: OrderInput) {
  return (await axiosClient.put<Order>(`/orders/${id}`, data)).data;
}
export async function updateOrderStatus(id: number, status: OrderStatus) {
  return (await axiosClient.patch<Order>(`/orders/${id}/status`, { status })).data;
}
export async function deleteOrder(id: number) {
  await axiosClient.delete(`/orders/${id}`);
}
