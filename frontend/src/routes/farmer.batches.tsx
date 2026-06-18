import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MapPin, Calendar, AlertTriangle, X, Edit, Eye } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { farmerBatches, categoryGroups, regions, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/batches")({
  head: () => ({ meta: [{ title: "Quản lý lô nông sản – AgriConnect" }] }),
  component: BatchesPage,
});

function BatchesPage() {
  const [open, setOpen] = useState(false);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/farmer" className="text-sm text-primary hover:underline">← Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold">Quản lý lô nông sản</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tạo và theo dõi các lô nông sản với tồn kho realtime.</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95">
            <Plus className="h-4 w-4" /> Tạo lô mới
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {farmerBatches.map((b) => {
            const remaining = b.quantityKg - b.soldKg;
            const pct = Math.round((b.soldKg / b.quantityKg) * 100);
            return (
              <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={b.image} alt={b.name} className="h-full w-full object-cover" />
                  {b.urgency === "rescue" && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                      <AlertTriangle className="h-3 w-3" /> Giải cứu
                    </span>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 font-mono text-[10px] font-semibold backdrop-blur">
                    {b.id}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{b.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {b.harvestDate}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Giá dự kiến</div>
                      <div className="text-sm font-bold text-primary">{formatVND(b.expectedPrice)}/kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Tồn kho</div>
                      <div className="text-sm font-bold">{remaining.toLocaleString("vi-VN")} kg</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{b.soldKg.toLocaleString("vi-VN")} / {b.quantityKg.toLocaleString("vi-VN")} kg</span>
                      <span className="font-semibold text-primary">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                      <Eye className="h-3.5 w-3.5" /> Xem
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                      <Edit className="h-3.5 w-3.5" /> Sửa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Tạo lô nông sản mới</h2>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Tên lô" placeholder="VD: Dưa hấu ruột đỏ lô 6" full />
              <Select label="Loại nông sản" options={categoryGroups.filter((c) => c !== "Tất cả")} />
              <Field label="Sản lượng (kg)" placeholder="12000" />
              <Field label="Giá dự kiến (₫/kg)" placeholder="4500" />
              <Field label="Ngày thu hoạch" type="date" />
              <Select label="Địa điểm" options={regions.filter((r) => r !== "Tất cả khu vực")} />
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Mức độ khẩn cấp</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {[
                    { v: "normal", l: "Bình thường", c: "bg-primary-soft text-primary" },
                    { v: "high", l: "Cần bán nhanh", c: "bg-accent/30 text-accent-foreground" },
                    { v: "rescue", l: "Giải cứu khẩn cấp", c: "bg-destructive/10 text-destructive" },
                  ].map((u) => (
                    <button key={u.v} className={`rounded-xl border border-border px-3 py-2 text-xs font-semibold ${u.c}`}>
                      {u.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm">Hủy</button>
              <button onClick={() => setOpen(false)} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Tạo lô</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Field({ label, placeholder, type = "text", full }: { label: string; placeholder?: string; type?: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input type={type} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}

function Select({ label, options }: { label: string; options: readonly string[] }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
