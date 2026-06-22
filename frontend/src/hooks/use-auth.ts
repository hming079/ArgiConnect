import { useEffect, useState } from "react";
import { getRoleFromToken, type UserRole } from "@/lib/auth";

interface AuthState {
  ready: boolean;
  token: string | null;
  role: UserRole | null;
}

export function useAuth(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ ready: false, token: null, role: null });

  useEffect(() => {
    const refresh = () => {
      const token = localStorage.getItem("token");
      const role = getRoleFromToken(token);
      if (token && !role) localStorage.removeItem("token");
      setAuth({ ready: true, token: role ? token : null, role });
    };

    refresh();
    window.addEventListener("auth-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("auth-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return auth;
}
