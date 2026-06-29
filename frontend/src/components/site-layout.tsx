import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, ShoppingCart, Sprout, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLogout } from "@/hooks/use-logout";
import type { UserRole } from "@/lib/auth";

interface NavLink {
  to: string;
  label: string;
}

const commonLinks: NavLink[] = [
  { to: "/", label: "Trang chu" },
  { to: "/rescue", label: "Giai cuu" },
];

const roleLinks: Record<UserRole, NavLink[]> = {
  FARMER: [
    { to: "/farmer", label: "Tong quan nong dan" },
    { to: "/categories", label: "Danh muc" },
    { to: "/farmer/batches", label: "Lo nong san" },
    { to: "/farmer/rescue-requests", label: "Yeu cau giai cuu" },
  ],
  BUYER: [
    { to: "/buyer", label: "Tong quan nguoi mua" },
    { to: "/products", label: "Nong san" },
    { to: "/orders", label: "Don hang" },
  ],
  LOGISTICS: [{ to: "/shipments", label: "Van chuyen" }, { to: "/categories", label: "Danh muc" }],

  ADMIN: [
    { to: "/admin", label: "Quan tri" },
    { to: "/categories", label: "Danh muc" },
    { to: "/admin/rescue-requests", label: "Duyet giai cuu" },
    { to: "/coordination", label: "Dieu phoi" },
    { to: "/analytics", label: "Phan tich" },
  ],
};

const roleLabels: Record<UserRole, string> = {
  FARMER: "Nong dan",
  BUYER: "Nguoi mua",
  LOGISTICS: "Van chuyen",
  ADMIN: "Quan tri",
};

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { count } = useCart();
  const logout = useLogout();
  const { token, role } = useAuth();
  const links = [...commonLinks, ...(role ? roleLinks[role] : [])];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">AgriConnect</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => {
            const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary-soft text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {role === "BUYER" && <CartButton count={count} />}
          {token && role ? (
            <>
              <span className="rounded-lg bg-primary-soft px-3 py-2 text-xs font-semibold text-primary">
                {roleLabels[role]}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <LogIn className="h-4 w-4" /> Đăng nhập
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {role === "BUYER" && <CartButton count={count} compact />}
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-border"
            onClick={() => setOpen((value) => !value)}
            aria-label="Mo menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {role && <div className="px-3 py-2 text-xs font-semibold uppercase text-primary">{roleLabels[role]}</div>}
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            {token ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary">
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function CartButton({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <Link
      to="/cart"
      className={`relative grid h-10 w-10 place-items-center rounded-lg border border-border hover:bg-muted ${compact ? "" : ""}`}
      aria-label="Gio hang"
    >
      <ShoppingCart className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

export function SiteFooter() {
  const { role } = useAuth();
  const accountLinks = role ? roleLinks[role] : [];

  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sprout className="h-5 w-5" /></span>
            <span className="text-lg font-bold">AgriConnect</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Ket noi nong dan, nguoi mua, don vi van chuyen va cac diem giai cuu nong san.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Kham pha</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {commonLinks.slice(1).map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}
            <li><Link to="/rescue-points">Diem giai cuu</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Tai khoan</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {accountLinks.map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Lien he</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hotro@agriconnect.vn</li>
            <li>1900 8686</li>
            <li>TP. Ho Chi Minh, Viet Nam</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">2026 AgriConnect</div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
