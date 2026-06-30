import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getUsers } from "@/api/userApi";

export function useMyProfile() { return useQuery({ queryKey: ["users", "me"], queryFn: getMyProfile }); }
export function useUsers(enabled = true) { return useQuery({ queryKey: ["users"], queryFn: getUsers, enabled }); }
