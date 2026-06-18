import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, MapPin, ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { rescueRequests, rescuePoints } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/rescue-requests")({
  head: () => ({ meta: [{ title: "Duyệt yêu cầu giải cứu – AgriConnect" }] }),
  component: Page,
});

type Decision = Record<string, { action: "pending" | "approved" | "rejected"; pointId?: string }>;

function Page() {
  const [decisions, setDecisions] = useState<Decision>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const list = rescueRequests.filter((r) => {
    const effective = decisions[r.id]?.action ?? r.status;
    return filter === "all" || effective === filter;
  });
  const pendingCount = rescueRequests.filter((r) => (decisions[r.id]?.action ?? r.status) === "pending").length;

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Quản trị
          </Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Phê duyệt
              </div>
              <h1 className="mt-1 text-3xl font-bold">Duyệt yêu cầu giải cứu</h1>
              <p className="mt-1 text-muted-foreground">Có <span className="font-semibold text-destructive">{pendingCount}</span> yêu cầu đang chờ xử lý.</p>
            </div>
            <div className="flex gap-2">
              {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                  {f === "pending" ? "Chờ duyệt" : f === "approved" ? "Đã duyệt" : f === "rejected" ? "Từ chối" : "Tất cả"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {list.map((r) => {
            const dec = decisions[r.id];
            const status = dec?.action ?? r.status;
            const pointId = dec?.pointId ?? r.assignedPointId;
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                      <UrgencyChip u={r.urgency} />
                      <StatusChip s={status} />
                    </div>
                    <h3 className="mt-1 text-lg font-bold">{r.productName}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">Lô: <span className="font-mono">{r.batchId}</span> · {r.quantityKg.toLocaleString("vi-VN")} kg cần giải cứu</div>
                    <p className="mt-2 text-sm text-foreground/80">{r.reason}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {r.location} · Nông dân: {r.farmer} · Gửi: {r.createdAt}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Chỉ định điểm giải cứu</label>
                    <select
                      value={pointId ?? ""}
                      onChange={(e) => setDecisions((d) => ({ ...d, [r.id]: { action: d[r.id]?.action ?? "approved", pointId: e.target.value } }))}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="">— Chọn điểm —</option>
                      {rescuePoints.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {pointId && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {rescuePoints.find((p) => p.id === pointId)?.address}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44">
                    <button
                      disabled={status === "approved"}
                      onClick={() => setDecisions((d) => ({ ...d, [r.id]: { action: "approved", pointId: d[r.id]?.pointId ?? rescuePoints[0].id } }))}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Phê duyệt
                    </button>
                    <button
                      onClick={() => setDecisions((d) => ({ ...d, [r.id]: { action: "rejected" } }))}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-destructive px-4 py-2 text-sm font-semibold text-destructive"
                    >
                      <XCircle className="h-4 w-4" /> Từ chối
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              Không có yêu cầu nào.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function StatusChip({ s }: { s: string }) {
  const map: Record<string, { l: string; c: string }> = {
    pending: { l: "Chờ duyệt", c: "bg-accent/20 text-accent" },
    approved: { l: "Đã duyệt", c: "bg-primary-soft text-primary" },
    rejected: { l: "Từ chối", c: "bg-destructive/15 text-destructive" },
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[s]?.c}`}>{map[s]?.l}</span>;
}

function UrgencyChip({ u }: { u: "normal" | "high" | "rescue" }) {
  const map = {
    rescue: { l: "Khẩn cấp", c: "bg-destructive text-destructive-foreground" },
    high: { l: "Cao", c: "bg-accent text-accent-foreground" },
    normal: { l: "Bình thường", c: "bg-primary-soft text-primary" },
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[u].c}`}>{map[u].l}</span>;
}
