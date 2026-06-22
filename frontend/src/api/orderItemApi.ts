import axiosClient from "./axiosClient";

export interface OrderItem { id: number; orderId: number; batchId: number; quantity: number; unitPrice: number; subtotal: number; }
export type OrderItemInput = Omit<OrderItem, "id" | "subtotal">;
export interface OrderItemFilters { orderId?: number; batchId?: number; }

export async function getOrderItems(filters?: OrderItemFilters) { return (await axiosClient.get<OrderItem[]>("/order-items", { params: filters })).data; }
export async function getOrderItem(id: number) { return (await axiosClient.get<OrderItem>(`/order-items/${id}`)).data; }
export async function createOrderItem(data: OrderItemInput) { return (await axiosClient.post<OrderItem>("/order-items", data)).data; }
export async function updateOrderItem(id: number, data: OrderItemInput) { return (await axiosClient.put<OrderItem>(`/order-items/${id}`, data)).data; }
export async function deleteOrderItem(id: number) { await axiosClient.delete(`/order-items/${id}`); }
