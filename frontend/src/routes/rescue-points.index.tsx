import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, MapPin, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { RescuePoint, RescuePointInput } from "@/api/rescuePointApi";
import { VietnamAddressSelect } from "@/components/address/VietnamAddressSelect";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateRescuePoint,
  useDeleteRescuePoint,
  useRescuePoints,
  useUpdateRescuePoint,
} from "@/hooks/use-rescue-points";

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
  const points = useMemo(() => pointsQuery.data ?? [], [pointsQuery.data]);
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Đổi mặc định thành 5 cho cân đối với bản đồ
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState("");

  // Lọc điểm giải cứu theo từ khóa tìm kiếm
  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return points;
    const query = searchQuery.trim().toLowerCase();
    return points.filter((p) =>
      [p.name, p.province, p.district, p.addressDetail].some((val) =>
        val?.toLowerCase().includes(query)
      )
    );
  }, [points, searchQuery]);

  // Reset về trang 1 khi gõ tìm kiếm
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPoints.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [page, pageSize, filteredPoints.length]);

  const start = (page - 1) * pageSize;
  const pagedPoints = filteredPoints.slice(start, start + pageSize);

  useEffect(() => {
    if (pagedPoints.length > 0 && !pagedPoints.some((point) => point.id === activeId))
      setActiveId(pagedPoints[0].id);
  }, [activeId, pagedPoints]);

  const selected = pagedPoints.find((point) => point.id === activeId) ?? null;

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
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Điểm giải cứu
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Mạng lưới điểm tiếp nhận nông sản</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tìm điểm tiếp nhận và phân phối nông sản giải cứu gần bạn nhất.
          </p>
          {isAdmin && (
            <Button
              className="mt-6 rounded-full"
              onClick={() => {
                setError("");
                setEditor({ mode: "create" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm điểm
            </Button>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {pointsQuery.isPending && (
        <div className="mx-auto h-72 max-w-7xl animate-pulse rounded-2xl bg-muted my-10" />
      )}
      {pointsQuery.isError && (
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-3 text-xl font-bold">Không thể tải điểm giải cứu</h2>
          <Button className="mt-4" onClick={() => void pointsQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
          </Button>
        </div>
      )}
      {pointsQuery.isSuccess && points.length === 0 && (
        <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
          Chưa có điểm giải cứu nào.
        </div>
      )}

      {points.length > 0 && (
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
          <aside className="space-y-3.5">
            {/* Ô tìm kiếm nhanh */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm focus-within:border-primary">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, tỉnh, địa chỉ..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            {/* Danh sách các điểm giải cứu */}
            <div className="space-y-3">
              {pagedPoints.map((point) => (
                <button
                  key={point.id}
                  onClick={() => setActiveId(point.id)}
                  className={`w-full rounded-2xl border p-4 text-left shadow-card transition ${point.id === activeId ? "border-primary bg-primary-soft/50" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{point.name}</span>
                    <Status status={point.status} />
                  </div>
                  <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {formatPointAddress(point)}
                  </div>
                  <div className="mt-2 text-xs font-medium text-primary">{point.province}</div>
                </button>
              ))}

              {filteredPoints.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy điểm giải cứu phù hợp.
                </div>
              )}
            </div>

            Phân trang
            {filteredPoints.length > 0 && (
              <div className="pt-1">
                <PaginationControls
                  totalItems={filteredPoints.length}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </aside>

          {selected ? (
            <section className="space-y-5">
              <RescuePointMap point={selected} />
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatPointAddress(selected)}
                    </p>
                  </div>
                  <Status status={selected.status} />
                </div>
                {isAdmin && (
                  <div className="mt-5 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setError("");
                        setEditor({ mode: "edit", point: selected });
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Sửa
                    </Button>
                    <Button variant="destructive" onClick={() => void remove(selected)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Xóa
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="grid h-full min-h-[300px] place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              Chọn một điểm giải cứu bên trái để xem chi tiết bản đồ.
            </div>
          )}
        </div>
      )}

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "edit" ? "Sửa điểm giải cứu" : "Thêm điểm giải cứu"}
            </DialogTitle>
            <DialogDescription>Thông tin này sẽ hiển thị cho tất cả vai trò.</DialogDescription>
          </DialogHeader>
          {editor && (
            <PointForm
              point={editor.mode === "edit" ? editor.point : undefined}
              pending={createPoint.isPending || updatePoint.isPending}
              onCancel={() => setEditor(null)}
              onSave={async (data) => {
                try {
                  setError("");
                  if (editor.mode === "edit")
                    await updatePoint.mutateAsync({ id: editor.point.id, data });
                  else await createPoint.mutateAsync(data);
                  setEditor(null);
                } catch {
                  setError("Không thể lưu điểm giải cứu.");
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function RescuePointMap({ point }: { point: RescuePoint }) {
  const address = formatPointAddress(point).trim();
  const mapQuery = encodeURIComponent(address);

  if (!address) {
    return (
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground shadow-card">
        Chưa có địa chỉ để hiển thị bản đồ.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <iframe
        title={`Bản đồ ${point.name}`}
        src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
        loading="lazy"
        className="aspect-[4/3] w-full border-0"
      />
      <div className="border-t border-border px-4 py-3 text-sm">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          Mở trong Google Maps
        </a>
      </div>
    </div>
  );
}

function Status({ status }: { status: RescuePoint["status"] }) {
  const label = status === "ACTIVE" ? "Đang hoạt động" : "Tạm ngưng";
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
      <CheckCircle2 className="h-3 w-3" /> {label}
    </span>
  );
}

function PointForm({
  point,
  pending,
  onCancel,
  onSave,
}: {
  point?: RescuePoint;
  pending: boolean;
  onCancel: () => void;
  onSave: (data: RescuePointInput) => Promise<void>;
}) {
  const [form, setForm] = useState<RescuePointInput>({
    name: point?.name ?? "",
    province: point?.province ?? "",
    district: point?.district ?? "",
    ward: point?.ward ?? "",
    addressDetail: point?.addressDetail ?? "",
    status: point?.status ?? "ACTIVE",
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSave(form);
  };
  return (
    <form className="space-y-4" onSubmit={submit}>
      <Field label="Tên điểm">
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Địa chỉ">
        <VietnamAddressSelect
          required
          value={form.addressDetail}
          initialProvinceName={form.province}
          initialWardName={form.ward}
          onChange={(fullAddress, parts) =>
            setForm((current) => ({
              ...current,
              addressDetail: fullAddress,
              province: parts.provinceName || current.province,
              ward: parts.wardName || current.ward,
              district: "",
            }))
          }
        />
      </Field>
      <Field label="Trạng thái">
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as RescuePoint["status"] })}
        >
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Tạm ngưng</option>
        </select>
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function formatPointAddress(point: RescuePoint) {
  if (
    point.addressDetail &&
    [point.ward, point.district, point.province].some((part) =>
      part ? point.addressDetail.includes(part) : false,
    )
  ) {
    return point.addressDetail;
  }
  return [point.addressDetail, point.ward, point.district, point.province]
    .filter(Boolean)
    .join(", ");
}