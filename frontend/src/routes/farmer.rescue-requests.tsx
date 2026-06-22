import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw, Send, Trash2 } from "lucide-react";
import type { RescueRegistrationStatus } from "@/api/rescueRegistrationApi";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useCropBatches } from "@/hooks/use-crops";
import { useCreateRescueRegistration, useDeleteMyRescueRegistration, useMyRescueRegistrations, useUpdateMyRescueRegistration } from "@/hooks/use-rescue-registrations";
import { useRescuePoints } from "@/hooks/use-rescue-points";

export const Route = createFileRoute("/farmer/rescue-requests")({
  head: () => ({ meta: [{ title: "Đăng ký giải cứu nông sản – AgriConnect" }] }),
  component: FarmerRescueRequests,
});

function FarmerRescueRequests() {
  const batchesQuery = useCropBatches(undefined, true);
  const pointsQuery = useRescuePoints();
  const registrationsQuery = useMyRescueRegistrations();
  const createRegistration = useCreateRescueRegistration();
  const updateRegistration = useUpdateMyRescueRegistration();
  const deleteRegistration = useDeleteMyRescueRegistration();
  const batches = batchesQuery.data ?? [];
  const points = (pointsQuery.data ?? []).filter((point) => point.status === "ACTIVE");
  const registrations = registrationsQuery.data ?? [];
  const [batchId, setBatchId] = useState(0);
  const [rescuePointId, setRescuePointId] = useState(0);
  const [pointEdits, setPointEdits] = useState<Record<number, number>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (!batchId && batches[0]) setBatchId(batches[0].id); }, [batchId, batches]);
  useEffect(() => { if (!rescuePointId && points[0]) setRescuePointId(points[0].id); }, [points, rescuePointId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!batchId || !rescuePointId) return;
    try {
      setError(""); setMessage("");
      await createRegistration.mutateAsync({ batchId, rescuePointId, status: "PENDING" });
      setMessage("Đã gửi đăng ký giải cứu. Admin sẽ xem xét yêu cầu.");
    } catch { setError("Không thể gửi đăng ký. Hãy kiểm tra lô và thử lại."); }
  }

  async function updatePoint(id: number, currentPointId: number) {
    try {
      setError("");
      await updateRegistration.mutateAsync({ id, rescuePointId: pointEdits[id] ?? currentPointId });
      setMessage("Đã cập nhật điểm giải cứu.");
    } catch { setError("Chỉ đăng ký đang chờ duyệt mới có thể cập nhật."); }
  }

  async function cancel(id: number) {
    if (!window.confirm("Hủy đăng ký giải cứu này?")) return;
    try { setError(""); await deleteRegistration.mutateAsync(id); setMessage("Đã hủy đăng ký."); }
    catch { setError("Chỉ đăng ký đang chờ duyệt mới có thể hủy."); }
  }

  const pending = batchesQuery.isPending || pointsQuery.isPending || registrationsQuery.isPending;
  const failed = batchesQuery.isError || pointsQuery.isError || registrationsQuery.isError;

  return <PageShell>
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/farmer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard nông dân</Link>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Yêu cầu giải cứu</div>
      <h1 className="mt-1 text-3xl font-bold">Quản lý đăng ký giải cứu</h1>
      <p className="mt-1 text-muted-foreground">Gửi lô đến điểm giải cứu và theo dõi quyết định của Admin.</p>
      {message && <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary-soft p-3 text-sm text-primary"><CheckCircle2 className="h-4 w-4" /> {message}</div>}
      {error && <div className="mt-5 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {failed && <Button className="mt-5" onClick={() => { void batchesQuery.refetch(); void pointsQuery.refetch(); void registrationsQuery.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" /> Tải lại dữ liệu</Button>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={submit} className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Đăng ký mới</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">Lô nông sản<select required value={batchId} onChange={(e) => setBatchId(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">{batches.map((batch) => <option key={batch.id} value={batch.id}>Lô #{batch.id} — {batch.quantity} {batch.unit}</option>)}</select></label>
            <label className="block text-sm font-semibold">Điểm giải cứu<select required value={rescuePointId} onChange={(e) => setRescuePointId(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">{points.map((point) => <option key={point.id} value={point.id}>{point.name} — {point.province}</option>)}</select></label>
            <Button type="submit" className="w-full rounded-full" disabled={pending || !batches.length || !points.length || createRegistration.isPending}><Send className="mr-2 h-4 w-4" /> {createRegistration.isPending ? "Đang gửi…" : "Gửi đăng ký"}</Button>
            {!pending && !batches.length && <p className="text-sm text-muted-foreground">Bạn chưa có lô nông sản.</p>}
            {!pending && !points.length && <p className="text-sm text-muted-foreground">Chưa có điểm giải cứu hoạt động.</p>}
          </div>
        </form>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Đăng ký của tôi</h2>
          <div className="mt-4 space-y-3">
            {registrations.map((registration) => <article key={registration.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs">#{registration.id} · Lô #{registration.batchId}</span><StatusBadge status={registration.status} /></div>
              <div className="mt-3 text-sm">Điểm: <strong>{pointsQuery.data?.find((point) => point.id === registration.rescuePointId)?.name ?? `#${registration.rescuePointId}`}</strong></div>
              <div className="mt-1 text-xs text-muted-foreground">Gửi lúc: {formatDate(registration.submittedAt)}</div>
              {registration.status === "PENDING" && <div className="mt-3 flex flex-wrap gap-2"><select value={pointEdits[registration.id] ?? registration.rescuePointId} onChange={(e) => setPointEdits((current) => ({ ...current, [registration.id]: Number(e.target.value) }))} className="min-w-48 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">{points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}</select><Button size="sm" variant="outline" onClick={() => void updatePoint(registration.id, registration.rescuePointId)}>Cập nhật</Button><Button size="sm" variant="destructive" onClick={() => void cancel(registration.id)}><Trash2 className="mr-1 h-3.5 w-3.5" /> Hủy</Button></div>}
            </article>)}
            {!pending && registrations.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Chưa có đăng ký nào.</p>}
          </div>
        </section>
      </div>
    </div>
  </PageShell>;
}

function StatusBadge({ status }: { status: RescueRegistrationStatus }) {
  const styles = { PENDING: "bg-accent/20 text-accent-foreground", APPROVED: "bg-primary-soft text-primary", REJECTED: "bg-destructive/15 text-destructive" };
  const labels = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
}

function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—"; }
