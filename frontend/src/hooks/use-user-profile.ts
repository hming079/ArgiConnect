import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, getUsers, getVisibleBuyers, updateUserStatus, type UserStatus } from "@/api/userApi";

export function useMyProfile() {
  return useQuery({ queryKey: ["users", "me"], queryFn: getMyProfile });
}
export function useUsers(enabled = true) {
  return useQuery({ queryKey: ["users"], queryFn: getUsers, enabled });
}
export function useVisibleBuyers(enabled = true) {
  return useQuery({ queryKey: ["users", "visible-buyers"], queryFn: getVisibleBuyers, enabled });
}
export function useUpdateUserStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) => updateUserStatus(id, status),
    onSuccess: async () => client.invalidateQueries({ queryKey: ["users"] }),
  });
}
