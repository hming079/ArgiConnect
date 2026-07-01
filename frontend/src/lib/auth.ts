export type UserRole = "FARMER" | "BUYER" | "LOGISTICS" | "ADMIN";

const ROLES: UserRole[] = ["FARMER", "BUYER", "LOGISTICS", "ADMIN"];

export const ROLE_HOME: Record<UserRole, string> = {
  FARMER: "/farmer",
  BUYER: "/buyer",
  LOGISTICS: "/shipments",
  ADMIN: "/admin",
};

export function getRoleFromToken(token: string | null): UserRole | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { role?: string; exp?: number };
    if (decoded.exp && decoded.exp * 1000 <= Date.now()) return null;
    return ROLES.includes(decoded.role as UserRole) ? (decoded.role as UserRole) : null;
  } catch {
    return null;
  }
}

export function requiredRoleForPath(pathname: string): UserRole | UserRole[] | null {
  if (pathname.startsWith("/admin")) {
    return "ADMIN";
  }
  if (pathname.startsWith("/analytics")) return ["ADMIN", "BUYER"];
  if (pathname.startsWith("/coordination")) return ["ADMIN", "LOGISTICS"];
  if (pathname.startsWith("/farmer")) return "FARMER";
  if (
    pathname.startsWith("/buyer") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout")
  ) {
    return "BUYER";
  }
  return null;
}

export function roleMatchesRequirement(
  role: UserRole | null,
  required: UserRole | UserRole[] | null,
) {
  if (!required) return true;
  if (!role) return false;
  return Array.isArray(required) ? required.includes(role) : required === role;
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event("auth-changed"));
}
