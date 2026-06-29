import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Building2, CheckCircle2, Map, MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { RescuePoint, RescuePointInput } from "@/api/rescuePointApi";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useCreateRescuePoint, useDeleteRescuePoint, useRescuePoints, useUpdateRescuePoint } from "@/hooks/use-rescue-points";

export const Route = createFileRoute("/rescue-points/")({
  head: () => ({ meta: [{ title: "Điểm giải cứu – AgriConnect" }] }),
  component: RescuePointsPage,
});

type Editor = { mode: "create" } | { mode: "edit"; point: RescuePoint };

function RescuePointsPage() {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const pointsQuery = useRescuePoints();
  const createPoint = useCreateRescuePoint();
  const updatePoint = useUpdateRescuePoint();
  const deletePoint = useDeleteRescuePoint();
  const points = pointsQuery.data ?? [];
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (points.length > 0 && !points.some((point) => point.id === activeId)) setActiveId(points[0].id);
  }, [activeId, points]);

  const selected = points.find((point) => point.id === activeId) ?? null;

  async function remove(point: RescuePoint) {
    if (!isAdmin || !window.confirm(`Xóa điểm giải cứu “${point.name}”?`)) return;
    try {
      setError("");
      await deletePoint.mutateAsync(point.id);
    } catch {
      setError("Không thể xóa điểm giải cứu.");
    }
  }

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Điểm giải cứu</div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Mạng lưới điểm tiếp nhận nông sản</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Tìm điểm tiếp nhận và phân phối nông sản giải cứu gần bạn nhất.</p>
          <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 shadow-card">
            <Link to="/rescue" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><Map className="h-4 w-4" /> Khu vực giải cứu</Link>
            <Link to="/rescue-points" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Building2 className="h-4 w-4" /> Điểm giải cứu</Link>
          </div>
          {isAdmin && <Button className="ml-3 rounded-full" onClick={() => { setError(""); setEditor({ mode: "create" }); }}><Plus className="mr-2 h-4 w-4" /> Thêm điểm</Button>}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {pointsQuery.isPending && <div className="mx-auto h-72 max-w-7xl animate-pulse rounded-2xl bg-muted my-10" />}
      {pointsQuery.isError && <div className="mx-auto max-w-3xl px-4 py-20 text-center"><AlertCircle className="mx-auto h-10 w-10 text-destructive" /><h2 className="mt-3 text-xl font-bold">Không thể tải điểm giải cứu</h2><Button className="mt-4" onClick={() => void pointsQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" /> Thử lại</Button></div>}
      {pointsQuery.isSuccess && points.length === 0 && <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Chưa có điểm giải cứu nào.</div>}

      {points.length > 0 && <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-3">
          {points.map((point) => <button key={point.id} onClick={() => setActiveId(point.id)} className={`w-full rounded-2xl border p-4 text-left shadow-card transition ${point.id === activeId ? "border-primary bg-primary-soft/50" : "border-border bg-card hover:border-primary/40"}`}>
            <div className="flex items-start justify-between gap-2"><span className="font-semibold">{point.name}</span><Status status={point.status} /></div>
            <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {formatPointAddress(point)}</div>
            <div className="mt-2 text-xs font-medium text-primary">{point.province}</div>
          </button>)}
        </aside>

        {selected && <section className="space-y-5">
          <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-primary-soft/40 to-accent/10 shadow-card">
            <MapPin className="h-20 w-20 text-primary" /><span className="absolute bottom-5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-card">{selected.province}</span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{selected.name}</h2><p className="mt-2 text-sm text-muted-foreground">{formatPointAddress(selected)}</p></div><Status status={selected.status} /></div>
            {isAdmin && <div className="mt-5 flex gap-2"><Button variant="outline" onClick={() => { setError(""); setEditor({ mode: "edit", point: selected }); }}><Pencil className="mr-2 h-4 w-4" /> Sửa</Button><Button variant="destructive" onClick={() => void remove(selected)}><Trash2 className="mr-2 h-4 w-4" /> Xóa</Button></div>}
          </div>
        </section>}
      </div>}

      <Dialog open={editor !== null} onOpenChange={(open) => { if (!open) setEditor(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editor?.mode === "edit" ? "Sửa điểm giải cứu" : "Thêm điểm giải cứu"}</DialogTitle><DialogDescription>Thông tin này sẽ hiển thị cho tất cả vai trò.</DialogDescription></DialogHeader>
          {editor && <PointForm point={editor.mode === "edit" ? editor.point : undefined} pending={createPoint.isPending || updatePoint.isPending} onCancel={() => setEditor(null)} onSave={async (data) => {
            try {
              setError("");
              if (editor.mode === "edit") await updatePoint.mutateAsync({ id: editor.point.id, data }); else await createPoint.mutateAsync(data);
              setEditor(null);
            } catch { setError("Không thể lưu điểm giải cứu."); }
          }} />}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Status({ status }: { status: RescuePoint["status"] }) {
  const label = status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng";
  return <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"><CheckCircle2 className="h-3 w-3" /> {label}</span>;
}

function PointForm({ point, pending, onCancel, onSave }: { point?: RescuePoint; pending: boolean; onCancel: () => void; onSave: (data: RescuePointInput) => Promise<void> }) {
  const [form, setForm] = useState<RescuePointInput>({ name: point?.name ?? "", province: point?.province ?? "", district: point?.district ?? "", ward: point?.ward ?? "", addressDetail: point?.addressDetail ?? "", status: point?.status ?? "ACTIVE" });
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave(form); };
  return <form className="space-y-4" onSubmit={submit}>
    <Field label="Tên điểm"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
    <Field label="Tỉnh / thành"><Input required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
    <Field label="Quận / huyện"><Input value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
    <Field label="Phường / xã"><Input value={form.ward ?? ""} onChange={(e) => setForm({ ...form, ward: e.target.value })} /></Field>
    <Field label="Địa chỉ chi tiết"><Input required value={form.addressDetail} onChange={(e) => setForm({ ...form, addressDetail: e.target.value })} /></Field>
    <Field label="Trạng thái"><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RescuePoint["status"] })}><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Tạm ngưng</option></select></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu"}</Button></DialogFooter>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function formatPointAddress(point: RescuePoint) {
  return [point.addressDetail, point.ward, point.district, point.province].filter(Boolean).join(", ");
}
