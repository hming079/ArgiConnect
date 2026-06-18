import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Package, ShoppingBag, TrendingUp, Eye, Edit, AlertTriangle, Sprout } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { farmerPosts, farmerSalesChart, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/")({
  head: () => ({ meta: [{ title: "Bảng điều khiển nông dân – AgriConnect" }] }),
  component: FarmerDashboard,
});

function FarmerDashboard() {
  const max = Math.max(...farmerSalesChart.map((d) => d.v));
  const totalSold = farmerPosts.reduce((s, p) => s + p.sold, 0);
  const totalOrders = farmerPosts.reduce((s, p) => s + p.orders, 0);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Bảng điều khiển</div>
            <h1 className="mt-1 text-3xl font-bold">Xin chào, anh Tâm 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quản lý nông sản, đơn hàng và doanh thu của bạn.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/shipments" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted">
              Vận chuyển
            </Link>
            <Link to="/farmer/rescue-requests" className="inline-flex items-center gap-2 rounded-full border border-destructive bg-card px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10">
              <AlertTriangle className="h-4 w-4" /> Gửi yêu cầu giải cứu
            </Link>
            <Link to="/farmer/batches" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-95">
              <Plus className="h-4 w-4" /> Quản lý lô
            </Link>
          </div>
        </div>



        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Package, l: "Bài đăng đang bán", v: farmerPosts.filter((p) => p.status === "Đang bán").length, sub: "+2 tuần này", tone: "primary" },
            { i: ShoppingBag, l: "Đơn hàng", v: totalOrders, sub: "12 đơn mới", tone: "accent" },
            { i: TrendingUp, l: "Đã bán (kg)", v: totalSold.toLocaleString("vi-VN"), sub: "65% mục tiêu tháng", tone: "primary" },
            { i: AlertTriangle, l: "Cần giải cứu", v: farmerPosts.filter((p) => p.urgency === "rescue").length, sub: "Ưu tiên hiển thị", tone: "destructive" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${
                  s.tone === "destructive" ? "bg-destructive/10 text-destructive" :
                  s.tone === "accent" ? "bg-accent/30 text-accent-foreground" :
                  "bg-primary-soft text-primary"
                }`}>
                  <s.i className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-xs font-medium text-primary">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Chart */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sản lượng bán theo tháng</h2>
                <p className="text-sm text-muted-foreground">6 tháng gần nhất (đơn vị: kg)</p>
              </div>
              <select className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm">
                <option>2026</option>
                <option>2025</option>
              </select>
            </div>

            <div className="mt-8 flex h-56 items-end gap-3">
              {farmerSalesChart.map((d) => (
                <div key={d.m} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-primary transition-all group-hover:bg-primary/80"
                      style={{ height: `${(d.v / max) * 100}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs text-background group-hover:block">
                      {d.v}kg
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.m}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
            <ul className="mt-4 space-y-4">
              {[
                { t: "Đơn hàng #DH-1042 vừa được tạo", d: "5 phút trước", i: ShoppingBag },
                { t: "Bài đăng \"Dưa hấu Long An\" đạt 65%", d: "1 giờ trước", i: TrendingUp },
                { t: "Có 3 người mua mới quan tâm", d: "3 giờ trước", i: Eye },
                { t: "Bài đăng được ưu tiên giải cứu", d: "Hôm qua", i: Sprout },
              ].map((a, i) => (
                <li key={i} className="flex gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <a.i className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.t}</div>
                    <div className="text-xs text-muted-foreground">{a.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Posts table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-lg font-semibold">Bài đăng của bạn</h2>
            <div className="flex gap-2">
              {["Tất cả", "Đang bán", "Đã bán hết"].map((t, i) => (
                <button key={t} className={`rounded-full px-3 py-1.5 text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Mã</th>
                  <th className="px-5 py-3">Nông sản</th>
                  <th className="px-5 py-3">Đã bán / Tổng</th>
                  <th className="px-5 py-3">Đơn</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {farmerPosts.map((p) => {
                  const pct = Math.round((p.sold / p.qty) * 100);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-medium">
                          {p.name}
                          {p.urgency === "rescue" && (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">Giải cứu</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-muted-foreground">{p.sold.toLocaleString("vi-VN")} / {p.qty.toLocaleString("vi-VN")} kg</div>
                        <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-4">{p.orders}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.status === "Đang bán" ? "bg-primary-soft text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button className="rounded-lg p-2 hover:bg-muted"><Eye className="h-4 w-4" /></button>
                          <button className="rounded-lg p-2 hover:bg-muted"><Edit className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
