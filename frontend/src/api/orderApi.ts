import axiosClient from "./axiosClient";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PACKING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
export interface Order { id: number; buyerId: number; totalAmount: number; status: OrderStatus; orderDate: string | null; createdAt: string | null; }
export type OrderInput = Pick<Order, "totalAmount" | "status" | "orderDate"> & { buyerId?: number };
export interface CheckoutInput { totalAmount: number; orderDate: string | null; cropLockIds: number[]; items: { batchId: number; quantity: number; unitPrice: number }[]; }
export interface OrderFilters { buyerId?: number; status?: OrderStatus; }

export async function getOrders(filters?: OrderFilters) { return (await axiosClient.get<Order[]>("/orders", { params: filters })).data; }
export async function getMyOrders() { return (await axiosClient.get<Order[]>("/orders/my")).data; }
export async function getOrder(id: number) { return (await axiosClient.get<Order>(`/orders/${id}`)).data; }
export async function createOrder(data: OrderInput) { return (await axiosClient.post<Order>("/orders", data)).data; }
export async function checkoutOrder(data: CheckoutInput) { return (await axiosClient.post<Order>("/orders/checkout", data)).data; }
export async function updateOrder(id: number, data: OrderInput) { return (await axiosClient.put<Order>(`/orders/${id}`, data)).data; }
export async function updateOrderStatus(id: number, status: OrderStatus) { return (await axiosClient.patch<Order>(`/orders/${id}/status`, { status })).data; }
export async function deleteOrder(id: number) { await axiosClient.delete(`/orders/${id}`); }
