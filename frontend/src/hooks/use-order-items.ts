import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrderItem, deleteOrderItem, getOrderItem, getOrderItems, updateOrderItem, type OrderItemFilters, type OrderItemInput } from "@/api/orderItemApi";

const key = ["order-items"];
export function useOrderItems(filters?: OrderItemFilters) { return useQuery({ queryKey: [...key, filters], queryFn: () => getOrderItems(filters) }); }
export function useOrderItem(id: number) { return useQuery({ queryKey: [...key, id], queryFn: () => getOrderItem(id), enabled: id > 0 }); }
export function useCreateOrderItem() { const client = useQueryClient(); return useMutation({ mutationFn: createOrderItem, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateOrderItem() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: OrderItemInput }) => updateOrderItem(id, data), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteOrderItem() { const client = useQueryClient(); return useMutation({ mutationFn: deleteOrderItem, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
