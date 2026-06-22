import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCrop,
  createCropBatch,
  deleteCrop,
  deleteCropBatch,
  getCrop,
  getCropBatches,
  getCrops,
  updateCrop,
  updateCropBatch,
} from "@/api/cropApi";
import type { CropBatchInput, CropInput } from "@/api/cropApi";

export function useCrops() {
  return useQuery({
    queryKey: ["crops"],
    queryFn: getCrops,
  });
}

export function useCrop(id: number) {
  return useQuery({
    queryKey: ["crops", id],
    queryFn: () => getCrop(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCropBatches(cropId?: number, mine = false) {
  return useQuery({
    queryKey: ["crop-batches", { cropId, mine }],
    queryFn: () => getCropBatches(cropId, mine),
    enabled: cropId === undefined || (Number.isInteger(cropId) && cropId > 0),
  });
}

export function useCreateCropBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCropBatch,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["crop-batches"] }),
  });
}

export function useUpdateCropBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CropBatchInput }) => updateCropBatch(id, data),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["crop-batches"] }),
  });
}

export function useDeleteCropBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCropBatch,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["crop-batches"] }),
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCrop,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["crops"] });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CropInput }) => updateCrop(id, data),
    onSuccess: async (crop) => {
      queryClient.setQueryData(["crops", crop.id], crop);
      await queryClient.invalidateQueries({ queryKey: ["crops"] });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCrop,
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: ["crops", id] });
      await queryClient.invalidateQueries({ queryKey: ["crops"] });
    },
  });
}
