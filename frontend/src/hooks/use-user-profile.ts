import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/api/userApi";

export function useMyProfile() { return useQuery({ queryKey: ["users", "me"], queryFn: getMyProfile }); }
