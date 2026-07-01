import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getUsers, getVisibleBuyers } from "@/api/userApi";

export function useMyProfile() {
  return useQuery({ queryKey: ["users", "me"], queryFn: getMyProfile });
}
export function useUsers(enabled = true) {
  return useQuery({ queryKey: ["users"], queryFn: getUsers, enabled });
}
export function useVisibleBuyers(enabled = true) {
  return useQuery({ queryKey: ["users", "visible-buyers"], queryFn: getVisibleBuyers, enabled });
}
