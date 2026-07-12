import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, deleteOrder, getMyOrders, getMyOrdersPage, getOrder, getOrders, getOrdersPage, updateOrder, updateOrderStatus, type OrderFilters, type OrderInput, type OrderStatus } from "@/api/orderApi";
import type { PageParams } from "@/api/pagination";

const key = ["orders"];
export function useOrders(filters?: OrderFilters, enabled = true) { return useQuery({ queryKey: [...key, filters], queryFn: () => getOrders(filters), enabled }); }
export function useMyOrders(enabled = true) { return useQuery({ queryKey: [...key, "my"], queryFn: getMyOrders, enabled }); }
export function useOrdersPage(filters?: OrderFilters, pagination?: PageParams, enabled = true) { return useQuery({ queryKey: [...key, "page", filters, pagination], queryFn: () => getOrdersPage(filters, pagination), enabled }); }
export function useMyOrdersPage(pagination?: PageParams, enabled = true) { return useQuery({ queryKey: [...key, "my", "page", pagination], queryFn: () => getMyOrdersPage(pagination), enabled }); }
export function useOrder(id: number) { return useQuery({ queryKey: [...key, id], queryFn: () => getOrder(id), enabled: id > 0 }); }
export function useCreateOrder() { const client = useQueryClient(); return useMutation({ mutationFn: createOrder, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateOrder() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: OrderInput }) => updateOrder(id, data), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateOrderStatus() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => updateOrderStatus(id, status), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteOrder() { const client = useQueryClient(); return useMutation({ mutationFn: deleteOrder, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
