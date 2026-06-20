import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Lock, Mail, Sprout, ShieldCheck } from "lucide-react";

import { login } from "@/api/authApi";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login/")({
  head: () => ({ meta: [{ title: "Đăng nhập – AgriConnect" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      const token = res?.accessToken ?? res?.token ?? res?.data?.accessToken ?? res?.data?.token;

      if (token) {
        localStorage.setItem("token", token);
      }

      nav({ to: "/" });
    } catch {
      setError("Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_32%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/18 to-background" />

        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="flex items-center text-primary-foreground">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" /> Bảo mật bằng JWT
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Đăng nhập để tiếp tục <br /> kết nối nông sản
              </h1>
              <p className="mt-5 max-w-xl text-base text-primary-foreground/90 sm:text-lg">
                Quản lý đơn hàng, theo dõi chiến dịch giải cứu và đồng bộ dữ liệu giao dịch trong một tài khoản duy nhất.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Sprout, title: "Dành cho nông dân", desc: "Quản lý lô hàng, đơn cứu nông sản và tiến độ bán." },
                  { icon: CheckCircle2, title: "Dành cho người mua", desc: "Đặt hàng nhanh, theo dõi đơn và thanh toán thuận tiện." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
                    <p className="mt-1 text-sm text-primary-foreground/80">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-soft transition hover:bg-white/95"
                >
                  <Leaf className="h-4 w-4" /> Khám phá nông sản <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/farmer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <Sprout className="h-4 w-4" /> Tạo tài khoản
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/95 p-6 shadow-soft backdrop-blur sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary">AgriConnect</div>
                  <h2 className="text-2xl font-bold">Đăng nhập</h2>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Sử dụng email và mật khẩu đã đăng ký để vào hệ thống.
              </p>

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="h-11 pl-10 pr-11"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    Ghi nhớ đăng nhập
                  </label>
                  <a href="mailto:hotro@agriconnect.vn" className="font-medium text-primary hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <Button type="submit" className="h-11 w-full rounded-full text-sm font-semibold" disabled={loading}>
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm">
                <div className="font-semibold text-foreground">Gợi ý cho bản demo</div>
                <p className="mt-1 text-muted-foreground">
                  Nếu bạn đang thử môi trường nội bộ, dùng tài khoản đã tạo sẵn trong hệ thống backend.
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Chưa có tài khoản? <Link to="/farmer" className="font-semibold text-primary hover:underline">Đăng ký ngay</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}