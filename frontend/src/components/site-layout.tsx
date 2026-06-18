import { Link, useRouterState } from "@tanstack/react-router";
import { Sprout, Menu, X, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

const links = [
  { to: "/", label: "Trang chủ" },
  { to: "/categories", label: "Danh mục" },
  { to: "/products", label: "Nông sản" },
  { to: "/rescue", label: "Giải cứu" },
  { to: "/coordination", label: "Điều phối" },
  { to: "/analytics", label: "Phân tích" },
  { to: "/farmer", label: "Nông dân" },
  { to: "/buyer", label: "Người mua" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">AgriConnect</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-muted" aria-label="Giỏ hàng">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/farmer"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            Đăng ký
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-lg border border-border" aria-label="Giỏ hàng">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-border"
            onClick={() => setOpen((s) => !s)}
            aria-label="Mở menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">Quản trị</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">AgriConnect</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Nền tảng kết nối nông dân và người mua, giảm thất thoát nông sản và hỗ trợ giải cứu khẩn cấp.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Khám phá</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/products">Nông sản</Link></li>
            <li><Link to="/categories">Danh mục</Link></li>
            <li><Link to="/coordination">Điều phối</Link></li>
            <li><Link to="/rescue-points">Điểm giải cứu</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Tài khoản</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/farmer">Dashboard nông dân</Link></li>
            <li><Link to="/buyer">Tài khoản người mua</Link></li>
            <li><Link to="/orders">Lịch sử mua hàng</Link></li>
            <li><Link to="/admin">Quản trị</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Liên hệ</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hotro@agriconnect.vn</li>
            <li>1900 8686</li>
            <li>TP. Hồ Chí Minh, Việt Nam</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 AgriConnect. Vì nền nông nghiệp Việt Nam bền vững.
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
