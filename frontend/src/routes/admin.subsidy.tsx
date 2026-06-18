import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, HeartHandshake, Truck, Snowflake, Users, TrendingDown } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { formatVND } from "@/lib/mock-data";
import {
  subsidyStats,
  subsidyByRegion,
  priceVsRescue,
  logisticsByRegion,
} from "@/lib/pricing";

export const Route = createFileRoute("/admin/subsidy")({
  head: () => ({ meta: [{ title: "Tính giá an sinh & trợ phí – Admin AgriConnect" }] }),
  component: AdminSubsidy,
});

function AdminSubsidy() {
  const welfarePct = ((subsidyStats.welfareOrders / subsidyStats.totalOrders) * 100).toFixed(1);
  const maxSubsidy = Math.max(...subsidyByRegion.map((r) => r.subsidy));
  const maxLogi = Math.max(...logisticsByRegion.map((r) => r.logistics + r.cold));
  const maxPrice = Math.max(...priceVsRescue.map((p) => p.farm));

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Quay lại bảng quản trị
        </Link>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Phân hệ tài chính</div>
          <h1 className="mt-1 text-3xl font-bold">Tính giá an sinh & trợ phí</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi tổng trợ giá, chi phí logistics, lưu kho và các đơn hàng được hưởng ưu đãi an sinh trên toàn hệ thống.
          </p>
        </div>

        {/* KPI */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi i={HeartHandshake} l="Tổng trợ giá đã áp dụng" v={formatVND(subsidyStats.totalSubsidyVnd)} sub="Chương trình giải cứu + an sinh" tone="primary" />
          <Kpi i={Truck} l="Tổng chi phí logistics" v={formatVND(subsidyStats.totalLogisticsVnd)} sub="Bao gồm phụ thu khoảng cách" />
          <Kpi i={Snowflake} l="Tổng chi phí lưu kho lạnh" v={formatVND(subsidyStats.totalColdStorageVnd)} sub="Rau lá, sầu riêng, thủy sản" />
          <Kpi i={Users} l="Đơn hưởng ưu đãi an sinh" v={subsidyStats.welfareOrders.toLocaleString("vi-VN")} sub={`${welfarePct}% tổng đơn hàng`} tone="accent" />
        </div>

        {/* Mức giảm giá theo địa phương */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Mức giảm giá & trợ phí theo địa phương</h2>
                <p className="text-xs text-muted-foreground">Giá trị trợ giá tích lũy, số đơn hàng và mức giảm trung bình</p>
              </div>
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-3">
              {subsidyByRegion.map((r) => (
                <div key={r.region}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.region}</span>
                    <span className="text-muted-foreground">{r.orders.toLocaleString("vi-VN")} đơn · <span className="font-semibold text-primary">−{r.avgDiscountPct}%</span></span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${(r.subsidy / maxSubsidy) * 100}%` }} />
                  </div>
                  <div className="mt-1 flex justify-end text-[11px] tabular-nums text-muted-foreground">{formatVND(r.subsidy)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Giá tại vườn vs Giá tại điểm giải cứu */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">Giá tại vườn vs giá tại điểm giải cứu</h2>
            <p className="text-xs text-muted-foreground">Đơn vị: đ/kg</p>
            <div className="mt-5 space-y-4">
              {priceVsRescue.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">Δ {formatVND(p.farm - p.rescue)}</span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] font-semibold text-muted-foreground">Vườn</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(p.farm / maxPrice) * 100}%` }} />
                      </div>
                      <span className="w-20 text-right text-xs tabular-nums">{formatVND(p.farm)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] font-semibold text-primary">Giải cứu</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(p.rescue / maxPrice) * 100}%` }} />
                      </div>
                      <span className="w-20 text-right text-xs font-semibold text-primary tabular-nums">{formatVND(p.rescue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phân bổ chi phí logistics theo khu vực */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Phân bổ chi phí logistics & lưu kho theo khu vực</h2>
          <p className="text-xs text-muted-foreground">Stacked: logistics nội bộ + phí lưu kho lạnh</p>
          <div className="mt-6 flex items-end gap-3 overflow-x-auto pb-2">
            {logisticsByRegion.map((r) => {
              const totalH = ((r.logistics + r.cold) / maxLogi) * 220;
              const logiH = (r.logistics / (r.logistics + r.cold)) * totalH;
              const coldH = totalH - logiH;
              return (
                <div key={r.region} className="flex w-20 shrink-0 flex-col items-center gap-2">
                  <div className="text-[10px] font-semibold tabular-nums">{formatVND(r.logistics + r.cold)}</div>
                  <div className="flex h-[220px] w-12 flex-col justify-end overflow-hidden rounded-t-lg">
                    <div className="w-full bg-accent" style={{ height: `${coldH}px` }} title={`Lưu kho: ${formatVND(r.cold)}`} />
                    <div className="w-full bg-primary" style={{ height: `${logiH}px` }} title={`Logistics: ${formatVND(r.logistics)}`} />
                  </div>
                  <div className="text-center text-[11px] font-medium">{r.region}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary" />Logistics nội bộ</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent" />Lưu kho lạnh</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/30 p-5 text-sm text-foreground/80">
          <strong className="text-primary">Ghi chú:</strong> Phân hệ chỉ hiển thị thống kê tổng hợp, không thay đổi các luồng nghiệp vụ
          phê duyệt giải cứu, đặt hàng và giao nhận hiện có. Quy tắc tính giá có thể được cấu hình tại
          <span className="font-mono"> src/lib/pricing.ts</span>.
        </div>
      </div>
    </PageShell>
  );
}

function Kpi({ i: I, l, v, sub, tone }: { i: typeof Users; l: string; v: string; sub: string; tone?: "primary" | "accent" }) {
  const t = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "accent" ? "bg-accent text-accent-foreground" : "bg-primary-soft text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${t}`}><I className="h-5 w-5" /></div>
      <div className="mt-4 text-2xl font-bold tabular-nums">{v}</div>
      <div className="text-sm text-muted-foreground">{l}</div>
      <div className="mt-1 text-xs font-medium text-primary">{sub}</div>
    </div>
  );
}
