import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, ShoppingCart, Sprout, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useCropLock } from "@/hooks/use-croplock";
import { useLogout } from "@/hooks/use-logout";
import type { UserRole } from "@/lib/auth";

interface NavLink {
  to: string;
  label: string;
}

interface FooterLink extends NavLink {
  roles?: UserRole[];
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}
const homeLink: NavLink = { to: "/", label: "Trang chủ" };
const commonLinks: NavLink[] = [
  { to: "/rescue-points", label: "Giải cứu" },
  { to: "/shipments", label: "Vận chuyển" },
];

const roleLinks: Record<UserRole, NavLink[]> = {
  FARMER: [
    { to: "/categories", label: "Danh mục" },
    // { to: "/farmer/batches", label: "Lô nông sản" },
    { to: "/farmer/rescue-requests", label: "Yêu cầu giải cứu" },
    { to: "/farmer", label: "Tổng quan nông dân" },
  ],
  BUYER: [
    { to: "/products", label: "Nông sản" },
    { to: "/buyer", label: "Tổng quan người mua" },
    { to: "/analytics", label: "Phân tích" },
  ],
  LOGISTICS: [
    { to: "/categories", label: "Danh mục" },
    { to: "/coordination", label: "Điều phối" },
  ],

  ADMIN: [
    { to: "/admin", label: "Quản trị" },
    { to: "/categories", label: "Danh mục" },
    { to: "/admin/rescue-requests", label: "Duyệt giải cứu" },
    { to: "/coordination", label: "Điều phối" },
    { to: "/analytics", label: "Phân tích" },
  ],
};

const footerSections: FooterSection[] = [
  {
    title: "Mua sắm và khám phá",
    links: [
      { to: "/rescue-points", label: "Điểm giải cứu" },
      { to: "/products", label: "Nông sản", roles: ["BUYER"] },
      { to: "/categories", label: "Danh mục nông sản", roles: ["FARMER", "LOGISTICS", "ADMIN"] },
      { to: "/shipments", label: "Vận chuyển", roles: ["FARMER", "BUYER", "LOGISTICS", "ADMIN"] },
    ],
  },
  {
    title: "Dành cho nhà nông",
    links: [
      { to: "/farmer", label: "Tổng quan nông dân", roles: ["FARMER"] },
      { to: "/farmer/batches", label: "Quản lý lô hàng", roles: ["FARMER"] },
      { to: "/farmer/rescue-requests", label: "Gửu yêu cầu giải cứu", roles: ["FARMER"] },
    ],
  },
  {
    title: "Vận hành và phân tích",
    links: [
      { to: "/buyer", label: "Tổng quan người mua", roles: ["BUYER"] },
      { to: "/admin", label: "Quản trị", roles: ["ADMIN"] },
      { to: "/admin/rescue-requests", label: "Duyệt giải cứu", roles: ["ADMIN"] },
      { to: "/coordination", label: "Điều phối vận chuyển", roles: ["LOGISTICS", "ADMIN"] },
      { to: "/analytics", label: "Phân tích số liệu", roles: ["BUYER", "ADMIN"] },
    ],
  },
];

const roleLabels: Record<UserRole, string> = {
  FARMER: "Nông dân",
  BUYER: "Người mua",
  LOGISTICS: "Vận chuyển",
  ADMIN: "Quản trị",
};

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { count } = useCart();
  const logout = useLogout();
  const { token, role } = useAuth();
  const links = [homeLink, ...(role ? roleLinks[role] : []), ...commonLinks];

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
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
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
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
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
            {role && (
              <div className="px-3 py-2 text-xs font-semibold uppercase text-primary">
                {roleLabels[role]}
              </div>
            )}
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
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-primary"
              >
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
  const { lock } = useCropLock();
  const activeCheckoutLock = !!lock && lock.status !== "ORDERED";
  const target = activeCheckoutLock ? "/checkout" : "/cart";

  function preserveCheckoutSelection() {
    if (!activeCheckoutLock || typeof window === "undefined") return;
    window.localStorage.setItem(
      "agriconnect-checkout-selection",
      JSON.stringify(lock.items.map((item) => item.id)),
    );
  }

  return (
    <Link
      to={target}
      onClick={preserveCheckoutSelection}
      className={`relative grid h-10 w-10 place-items-center rounded-lg border border-border hover:bg-muted ${compact ? "" : ""}`}
      aria-label="Giỏ hàng"
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
  const visibleFooterSections = footerSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => !link.roles || (role && link.roles.includes(role))),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">AgriConnect</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Kết nối nông dân, người mua, đơn vị vận chuyển và các điểm giải cứu nông sản.
          </p>
        </div>
        {visibleFooterSections.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-semibold">{section.title}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {/* <div>
          <h4 className="text-sm font-semibold">Liên hệ</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hotro@agriconnect.vn</li>
            <li>1900 8686</li>
            <li>TP. Ho Chi Minh, Viet Nam</li>
          </ul>
        </div> */}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        2026 AgriConnect
      </div>
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
