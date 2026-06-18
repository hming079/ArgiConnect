import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Package, AlertTriangle, TrendingUp, CheckCircle2, XCircle, Search, ArrowRight, HeartHandshake } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { adminUsers, products, stats, rescueRequests } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Quản trị hệ thống – AgriConnect" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const pendingRescue = rescueRequests.filter((r) => r.status === "pending").length;
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Bảng quản trị</div>
            <h1 className="mt-1 text-3xl font-bold">Tổng quan hệ thống</h1>
            <p className="mt-1 text-sm text-muted-foreground">Quản lý người dùng, bài đăng và phê duyệt yêu cầu giải cứu.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/subsidy" className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-5 py-3 text-sm font-semibold text-primary shadow-soft hover:bg-primary-soft">
              <HeartHandshake className="h-4 w-4" /> Tính giá an sinh & trợ phí
            </Link>
            <Link to="/admin/rescue-requests" className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-soft">
              <AlertTriangle className="h-4 w-4" /> Duyệt yêu cầu giải cứu
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive-foreground/20 px-1 text-[10px] font-bold">{pendingRescue}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Users, l: "Người dùng", v: (stats.farmers + stats.buyers).toLocaleString("vi-VN"), sub: "+1,240 tuần này" },
            { i: Package, l: "Bài đăng", v: "2,184", sub: "186 đang chờ duyệt" },
            { i: AlertTriangle, l: "Chiến dịch giải cứu", v: stats.activeCampaigns, sub: "Đang hoạt động" },
            { i: TrendingUp, l: "Tổng giao dịch", v: "4.2 tỷ₫", sub: "Tháng này" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-bold">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-xs font-medium text-primary">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Users */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <h2 className="text-lg font-semibold">Người dùng gần đây</h2>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input placeholder="Tìm theo tên..." className="bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3">Người dùng</th>
                    <th className="px-5 py-3">Vai trò</th>
                    <th className="px-5 py-3">Khu vực</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                            {u.name[0]}
                          </div>
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === "Nông dân" ? "bg-primary-soft text-primary" : "bg-accent/30 text-accent-foreground"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{u.region}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.status === "Hoạt động" ? "bg-primary-soft text-primary" : "bg-accent/30 text-accent-foreground"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button className="rounded-lg p-2 text-primary hover:bg-primary-soft" title="Duyệt">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-2 text-destructive hover:bg-destructive/10" title="Khóa">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Moderation */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-lg font-semibold">Bài đăng chờ duyệt</h2>
            <p className="text-sm text-muted-foreground">Kiểm duyệt nội dung trước khi hiển thị công khai.</p>
            <div className="mt-4 space-y-3">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <img src={p.image} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.farmer.name} • {p.location}</div>
                  </div>
                  <button className="rounded-lg bg-primary p-1.5 text-primary-foreground"><CheckCircle2 className="h-4 w-4" /></button>
                  <button className="rounded-lg bg-destructive p-1.5 text-destructive-foreground"><XCircle className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
