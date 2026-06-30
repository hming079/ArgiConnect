import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createShipment, deleteShipment, getMyShipments, getShipment, getShipmentByOrder, getShipments, updateShipment, updateShipmentStatus, type ShipmentFilters, type ShipmentInput, type ShipmentStatus } from "@/api/shipmentApi";

const key = ["shipments"];
export function useShipments(filters?: ShipmentFilters, enabled = true) { return useQuery({ queryKey: [...key, filters], queryFn: () => getShipments(filters), enabled }); }
export function useMyShipments(enabled = true) { return useQuery({ queryKey: [...key, "my"], queryFn: getMyShipments, enabled }); }
export function useShipment(id: number) { return useQuery({ queryKey: [...key, id], queryFn: () => getShipment(id), enabled: id > 0 }); }
export function useShipmentByOrder(orderId: number) { return useQuery({ queryKey: [...key, "order", orderId], queryFn: () => getShipmentByOrder(orderId), enabled: orderId > 0 }); }
export function useCreateShipment() { const client = useQueryClient(); return useMutation({ mutationFn: createShipment, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateShipment() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: ShipmentInput }) => updateShipment(id, data), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateShipmentStatus() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, status }: { id: number; status: ShipmentStatus }) => updateShipmentStatus(id, status), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteShipment() { const client = useQueryClient(); return useMutation({ mutationFn: deleteShipment, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
