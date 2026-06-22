import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { notifyAuthChanged } from "@/lib/auth";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    localStorage.removeItem("token");
    notifyAuthChanged();
    queryClient.clear();
    await navigate({ to: "/login", replace: true });
  }, [navigate, queryClient]);
}
