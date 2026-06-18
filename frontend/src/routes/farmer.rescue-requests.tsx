import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { farmerBatches, rescueRequests, formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/rescue-requests")({
  head: () => ({ meta: [{ title: "Đăng ký giải cứu nông sản – AgriConnect" }] }),
  component: Page,
});

function Page() {
  const [batchId, setBatchId] = useState(farmerBatches[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [qty, setQty] = useState(1000);
  const [urgency, setUrgency] = useState<"normal" | "high" | "rescue">("high");
  const [sent, setSent] = useState(false);
  const myRequests = rescueRequests;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setReason("");
  }

  const selected = farmerBatches.find((b) => b.id === batchId);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/farmer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard nông dân
        </Link>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> Yêu cầu giải cứu
        </div>
        <h1 className="mt-1 text-3xl font-bold">Gửi yêu cầu giải cứu nông sản</h1>
        <p className="mt-1 text-muted-foreground">
          Yêu cầu sẽ được Admin xem xét, phê duyệt và phân bổ vào điểm giải cứu phù hợp.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {sent && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary-soft/40 p-3 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" /> Yêu cầu đã gửi! Mã: YC-{Math.floor(Math.random() * 9000 + 1000)}
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold">Chọn lô nông sản</label>
                <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
                  {farmerBatches.map((b) => (
                    <option key={b.id} value={b.id}>{b.id} — {b.name} ({(b.quantityKg - b.soldKg).toLocaleString("vi-VN")} kg tồn)</option>
                  ))}
                </select>
                {selected && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                    <img src={selected.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">{selected.name}</div>
                      <div className="text-xs text-muted-foreground">{selected.location} · Thu hoạch {selected.harvestDate}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-bold text-primary">{formatVND(selected.expectedPrice)}/kg</div>
                      <div className="text-xs text-muted-foreground">Tồn: {(selected.quantityKg - selected.soldKg).toLocaleString("vi-VN")} kg</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold">Sản lượng cần giải cứu (kg)</label>
                <input type="number" min={1} value={qty} onChange={(e) => setQty(+e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="text-sm font-semibold">Lý do cần giải cứu</label>
                <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Ví dụ: Thương lái huỷ đơn đột ngột, mưa kéo dài làm quả nhanh chín, vào vụ rộ vượt dự kiến…" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="text-sm font-semibold">Mức độ khẩn cấp</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([
                    { v: "normal", l: "Bình thường", c: "border-primary text-primary" },
                    { v: "high", l: "Cao", c: "border-accent text-accent" },
                    { v: "rescue", l: "Khẩn cấp", c: "border-destructive text-destructive" },
                  ] as const).map((o) => (
                    <button type="button" key={o.v} onClick={() => setUrgency(o.v)} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold ${urgency === o.v ? o.c + " bg-muted/40" : "border-border text-muted-foreground"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95">
                <Send className="h-4 w-4" /> Gửi yêu cầu giải cứu
              </button>
            </div>
          </form>

          <aside className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-lg font-semibold">Yêu cầu của tôi</h3>
            <ul className="mt-4 space-y-3">
              {myRequests.slice(0, 5).map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{r.id}</span>
                    <StatusBadge s={r.status} />
                  </div>
                  <div className="mt-1 text-sm font-medium">{r.productName}</div>
                  <div className="text-xs text-muted-foreground">{r.quantityKg.toLocaleString("vi-VN")} kg · {r.createdAt}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function StatusBadge({ s }: { s: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { l: "Chờ duyệt", c: "bg-accent/20 text-accent" },
    approved: { l: "Đã duyệt", c: "bg-primary-soft text-primary" },
    rejected: { l: "Từ chối", c: "bg-destructive/15 text-destructive" },
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[s].c}`}>{map[s].l}</span>;
}
