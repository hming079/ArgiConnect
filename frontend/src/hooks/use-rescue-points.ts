import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRescuePoint,
  deleteRescuePoint,
  getRescuePoints,
  updateRescuePoint,
  type RescuePointInput,
} from "@/api/rescuePointApi";

const queryKey = ["rescue-points"];

export function useRescuePoints() {
  return useQuery({ queryKey, queryFn: getRescuePoints });
}

export function useCreateRescuePoint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createRescuePoint,
    onSuccess: async () => client.invalidateQueries({ queryKey }),
  });
}

export function useUpdateRescuePoint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RescuePointInput }) => updateRescuePoint(id, data),
    onSuccess: async () => client.invalidateQueries({ queryKey }),
  });
}

export function useDeleteRescuePoint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteRescuePoint,
    onSuccess: async () => client.invalidateQueries({ queryKey }),
  });
}
