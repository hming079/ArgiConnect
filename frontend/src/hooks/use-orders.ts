import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, deleteOrder, getMyOrders, getOrder, getOrders, updateOrder, updateOrderStatus, type OrderFilters, type OrderInput, type OrderStatus } from "@/api/orderApi";

const key = ["orders"];
export function useOrders(filters?: OrderFilters, enabled = true) { return useQuery({ queryKey: [...key, filters], queryFn: () => getOrders(filters), enabled }); }
export function useMyOrders(enabled = true) { return useQuery({ queryKey: [...key, "my"], queryFn: getMyOrders, enabled }); }
export function useOrder(id: number) { return useQuery({ queryKey: [...key, id], queryFn: () => getOrder(id), enabled: id > 0 }); }
export function useCreateOrder() { const client = useQueryClient(); return useMutation({ mutationFn: createOrder, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateOrder() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: OrderInput }) => updateOrder(id, data), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateOrderStatus() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => updateOrderStatus(id, status), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteOrder() { const client = useQueryClient(); return useMutation({ mutationFn: deleteOrder, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
