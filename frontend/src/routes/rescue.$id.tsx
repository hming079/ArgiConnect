import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, MapPin, Users, Calendar, HeartHandshake, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { campaigns } from "@/lib/mock-data";

export const Route = createFileRoute("/rescue/$id")({
  head: () => ({ meta: [{ title: "Đăng ký giải cứu – AgriConnect" }] }),
  component: RescueRegister,
});

function RescueRegister() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const campaign = campaigns.find((c) => c.id === id) ?? campaigns[0];
  const [qty, setQty] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const pct = Math.round((campaign.committedKg / campaign.needKg) * 100);

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/coordination" className="text-sm text-primary hover:underline">← Trang điều phối</Link>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="relative aspect-[21/9] overflow-hidden">
            <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold">
                <AlertTriangle className="h-3 w-3" /> Khẩn cấp
              </span>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{campaign.title}</h1>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="text-muted-foreground">{campaign.desc}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat i={MapPin} l="Khu vực" v={campaign.location} />
                <Stat i={Users} l="Nông dân" v={`${campaign.farmers} hộ`} />
                <Stat i={Calendar} l="Hạn chót" v={campaign.deadline} />
                <Stat i={HeartHandshake} l="Cần" v={`${(campaign.needKg / 1000).toLocaleString("vi-VN")} tấn`} />
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Đã cam kết: {(campaign.committedKg / 1000).toLocaleString("vi-VN")} tấn</span>
                  <span className="font-semibold text-primary">{pct}%</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {/* Register form */}
            <div className="rounded-2xl border border-border bg-muted/30 p-5">
              {submitted ? (
                <div className="flex flex-col items-center text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">Đăng ký thành công!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bạn đã cam kết tiêu thụ <strong className="text-primary">{qty} kg</strong>. Chúng tôi sẽ liên hệ trong 24h.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setSubmitted(false)} className="rounded-full border border-border px-4 py-2 text-sm">Đăng ký thêm</button>
                    <button onClick={() => nav({ to: "/buyer" })} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Theo dõi</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">Đăng ký tham gia giải cứu</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Chọn số lượng bạn cam kết tiêu thụ</p>

                  <label className="mt-4 block text-xs font-semibold text-muted-foreground">Số lượng (kg)</label>
                  <input
                    type="number"
                    value={qty}
                    min={1}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[10, 50, 100, 500, 1000].map((n) => (
                      <button key={n} onClick={() => setQty(n)} className={`rounded-full px-3 py-1 text-xs font-medium ${
                        qty === n ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                      }`}>
                        {n} kg
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block text-xs font-semibold text-muted-foreground">Họ tên / Đơn vị</label>
                  <input className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" placeholder="Nguyễn Văn A" />

                  <label className="mt-3 block text-xs font-semibold text-muted-foreground">Số điện thoại</label>
                  <input className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" placeholder="09xx xxx xxx" />

                  <button
                    onClick={() => setSubmitted(true)}
                    className="mt-5 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
                  >
                    Cam kết tiêu thụ {qty.toLocaleString("vi-VN")} kg
                  </button>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Bạn có thể hủy đăng ký miễn phí trong 24h.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ i: Icon, l, v }: { i: typeof MapPin; l: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-1 text-[11px] text-muted-foreground">{l}</div>
      <div className="text-sm font-semibold">{v}</div>
    </div>
  );
}
