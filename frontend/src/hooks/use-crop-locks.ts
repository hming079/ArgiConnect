import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCropLock, deleteCropLock, getCropLock, getCropLocks, updateCropLock, type CropLockFilters, type CropLockInput } from "@/api/cropLockApi";

const key = ["crop-locks"];
export function useCropLocks(filters?: CropLockFilters) { return useQuery({ queryKey: [...key, filters], queryFn: () => getCropLocks(filters) }); }
export function useCropLockById(id: number) { return useQuery({ queryKey: [...key, id], queryFn: () => getCropLock(id), enabled: id > 0 }); }
export function useCreateCropLock() { const client = useQueryClient(); return useMutation({ mutationFn: createCropLock, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateCropLock() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: CropLockInput }) => updateCropLock(id, data), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteCropLock() { const client = useQueryClient(); return useMutation({ mutationFn: deleteCropLock, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
