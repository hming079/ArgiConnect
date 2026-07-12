import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  LifeBuoy,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  ShoppingCart,
  Sprout,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { CropBatch, CropBatchInput, CropBatchStatus } from "@/api/cropApi";
import type { RescuePoint } from "@/api/rescuePointApi";
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
import { useCart } from "@/hooks/use-cart";
import {
  useCreateCropBatch,
  useCrop,
  useCropBatches,
  useDeleteCropBatch,
  useUpdateCropBatch,
} from "@/hooks/use-crops";
import { useCreateRescueRegistration } from "@/hooks/use-rescue-registrations";
import { useRescuePoints } from "@/hooks/use-rescue-points";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/categories/$id")({
  head: () => ({ meta: [{ title: "Chi tiết nông sản – AgriConnect" }] }),
  component: CropDetailPage,
});

const statusLabels: Record<CropBatchStatus, string> = {
  pending: "Chờ duyệt",
  available: "Còn hàng",
  sold_out: "Đã bán hết",
  expired: "Hết hạn",
  cancelled: "Đã hủy",
};

const statusOptions: CropBatchStatus[] = ["pending", "available", "sold_out", "expired", "cancelled"];

const statusStyles: Record<CropBatchStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sold_out: "border-slate-200 bg-slate-100 text-slate-700",
  expired: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

type StatusFilter = "visible" | "all" | CropBatchStatus;

type BatchEditor = { mode: "create" } | { mode: "edit"; batch: CropBatch };

function CropDetailPage() {
  const { id } = Route.useParams();
  const cropId = Number(id);
  const isValidId = Number.isInteger(cropId) && cropId > 0;
  const { role } = useAuth();
  const isFarmer = role === "FARMER";
  const isBuyer = role === "BUYER";
  const { add } = useCart();
  const cropQuery = useCrop(cropId);
  const batchesQuery = useCropBatches(cropId, isFarmer);
  const createBatch = useCreateCropBatch();
  const updateBatch = useUpdateCropBatch();
  const deleteBatch = useDeleteCropBatch();
  const rescuePointsQuery = useRescuePoints();
  const createRegistration = useCreateRescueRegistration();
  const [editor, setEditor] = useState<BatchEditor | null>(null);
  const [batchToRegister, setBatchToRegister] = useState<CropBatch | null>(null);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("visible");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [mutationError, setMutationError] = useState("");
  const [notice, setNotice] = useState("");
  const batches = batchesQuery.data ?? [];
  const provinceOptions = useMemo(
    () =>
      Array.from(new Set(batches.map((batch) => batch.province).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [batches],
  );
  const filteredBatches = useMemo(
    () =>
      batches.filter((batch) => {
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "visible"
              ? batch.status !== "expired"
              : batch.status === statusFilter;
        const matchesProvince = provinceFilter === "all" || batch.province === provinceFilter;
        return matchesStatus && matchesProvince;
      }),
    [batches, provinceFilter, statusFilter],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filteredBatches.length, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [provinceFilter, statusFilter]);

  const start = (page - 1) * pageSize;
  const pagedBatches = filteredBatches.slice(start, start + pageSize);

  async function removeBatch(batch: CropBatch) {
    if (!isFarmer || !window.confirm(`Xóa lô #${batch.id}?`)) return;
    try {
      setMutationError("");
      await deleteBatch.mutateAsync(batch.id);
    } catch {
      setMutationError("Không thể xóa lô nông sản này.");
    }
  }

  if (!isValidId) return <CropNotFound />;

  if (cropQuery.isPending) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-7 w-36 animate-pulse rounded bg-muted" />
          <div className="h-56 animate-pulse rounded-2xl bg-muted" />
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        </div>
      </PageShell>
    );
  }

  if (cropQuery.isError || !cropQuery.data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 text-2xl font-bold">Không thể tải loại nông sản</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nông sản không tồn tại hoặc backend hiện không phản hồi.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/categories">Về danh mục</Link>
            </Button>
            <Button className="rounded-full" onClick={() => void cropQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const crop = cropQuery.data;
  const cropImage = getCropImage(crop.name);
  const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity), 0);
  const provinces = new Set(batches.map((batch) => batch.province).filter(Boolean)).size;

  function getCartQuantity(batch: CropBatch) {
    return cartQuantities[batch.id] ?? 1;
  }

  function setCartQuantity(batch: CropBatch, value: number) {
    const max = Math.max(1, Number(batch.currentQuantity));
    const next = Number.isFinite(value) ? Math.min(Math.max(1, value), max) : 1;
    setCartQuantities((current) => ({ ...current, [batch.id]: next }));
  }

  function addBatchToCart(batch: CropBatch) {
    const qty = getCartQuantity(batch);
    add({
      id: `batch-${batch.id}`,
      name: `Lô #${batch.id} · ${crop.name}`,
      image: cropImage ?? "",
      pricePerKg: Number(batch.unitPrice),
      location: formatBatchAddress(batch),
      qty,
    });
    setNotice(`Đã thêm ${formatNumber(qty)} ${batch.unit} từ lô #${batch.id} vào giỏ.`);
  }

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Danh mục
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {cropImage ? (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-primary-soft shadow-card">
              <img src={cropImage} alt={crop.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-border bg-primary-soft shadow-card">
              <Sprout className="h-24 w-24 text-primary/70" />
            </div>
          )}
          <div>
            <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Mã nông sản #{crop.id}
            </span>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{crop.name}</h1>
            <p className="mt-3 text-muted-foreground">{crop.description || "Chưa có mô tả."}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoCard
                icon={Clock}
                label="Thời gian bảo quản"
                value={`${crop.storageDays} ngày`}
              />
              <InfoCard icon={Scale} label="Đơn vị mặc định" value={crop.defaultUnit} />
              <InfoCard
                icon={Package}
                label="Số lô hiện có"
                value={batchesQuery.isPending ? "…" : batches.length}
              />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Dữ liệu kho
          </div>
          <h2 className="mt-1 text-2xl font-bold">Các lô {crop.name.toLowerCase()}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dữ liệu lô được lấy từ endpoint crop-batches theo cropId.
          </p>
          {isFarmer && (
            <Button
              className="mt-4 rounded-full"
              onClick={() => {
                setMutationError("");
                setEditor({ mode: "create" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm lô nông sản
            </Button>
          )}
          {mutationError && <p className="mt-3 text-sm text-destructive">{mutationError}</p>}
          {notice && <p className="mt-3 text-sm font-medium text-primary">{notice}</p>}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Tổng số lô"
            value={batchesQuery.isPending ? "…" : String(batches.length)}
          />
          <StatCard
            label="Tổng sản lượng"
            value={
              batchesQuery.isPending ? "…" : `${formatNumber(totalQuantity)} ${crop.defaultUnit}`
            }
          />
          <StatCard
            label="Số tỉnh thành"
            value={batchesQuery.isPending ? "…" : String(provinces)}
          />
        </div>

        {batchesQuery.data && batchesQuery.data.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bộ lọc lô
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Mặc định ẩn các lô đã hết hạn. Có thể lọc thêm theo tỉnh thành.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,16rem)]">
              <div className="space-y-1.5">
                <Label htmlFor="batch-status-filter" className="text-xs text-muted-foreground">
                  Trạng thái
                </Label>
                <select
                  id="batch-status-filter"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="visible">Tất cả trừ Hết hạn</option>
                  <option value="all">Tất cả trạng thái</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-province-filter" className="text-xs text-muted-foreground">
                  Tỉnh thành
                </Label>
                <select
                  id="batch-province-filter"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={provinceFilter}
                  onChange={(event) => setProvinceFilter(event.target.value)}
                >
                  <option value="all">Tất cả tỉnh thành</option>
                  {provinceOptions.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-muted-foreground sm:col-span-2">
                Hiển thị {filteredBatches.length}/{batches.length} lô
              </div>
            </div>
          </div>
        )}

        {batchesQuery.isError && (
          <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <h3 className="mt-2 font-semibold">Không thể tải các lô nông sản</h3>
            <Button className="mt-4 rounded-full" onClick={() => void batchesQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
          </div>
        )}

        {batchesQuery.isPending && (
          <div
            className="mt-6 h-64 animate-pulse rounded-2xl bg-muted"
            aria-label="Đang tải các lô nông sản"
          />
        )}

        {batchesQuery.data?.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">Chưa có lô {crop.name.toLowerCase()}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Backend chưa có crop batch thuộc loại nông sản này.
            </p>
          </div>
        )}

        {batchesQuery.data && batchesQuery.data.length > 0 && filteredBatches.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">Không có lô phù hợp</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Thử chọn trạng thái khác để xem thêm lô nông sản.
            </p>
          </div>
        )}

        {batchesQuery.data && batchesQuery.data.length > 0 && filteredBatches.length > 0 && (
          <>
            <div className="mt-6 grid gap-3 lg:hidden">
              {pagedBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  editable={isFarmer}
                  buyer={isBuyer}
                  cartQuantity={getCartQuantity(batch)}
                  onCartQuantityChange={(value) => setCartQuantity(batch, value)}
                  onAddToCart={() => addBatchToCart(batch)}
                  onEdit={() => setEditor({ mode: "edit", batch })}
                  onDelete={() => void removeBatch(batch)}
                  onRegister={() => {
                    setMutationError("");
                    setNotice("");
                    setBatchToRegister(batch);
                  }}
                />
              ))}
            </div>
            <BatchTable
              batches={pagedBatches}
              editable={isFarmer}
              buyer={isBuyer}
              getCartQuantity={getCartQuantity}
              onCartQuantityChange={setCartQuantity}
              onAddToCart={addBatchToCart}
              onEdit={(batch) => setEditor({ mode: "edit", batch })}
              onDelete={(batch) => void removeBatch(batch)}
              onRegister={(batch) => {
                setMutationError("");
                setNotice("");
                setBatchToRegister(batch);
              }}
            />
            <PaginationControls
              className="mt-4"
              totalItems={filteredBatches.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "edit" ? "Sửa lô nông sản" : "Thêm lô nông sản"}
            </DialogTitle>
            <DialogDescription>Lô này thuộc tài khoản nông dân đang đăng nhập.</DialogDescription>
          </DialogHeader>
          {editor && (
            <BatchForm
              cropId={cropId}
              defaultUnit={crop.defaultUnit}
              batch={editor.mode === "edit" ? editor.batch : undefined}
              pending={createBatch.isPending || updateBatch.isPending}
              onCancel={() => setEditor(null)}
              onSave={async (data) => {
                try {
                  setMutationError("");
                  if (editor.mode === "edit")
                    await updateBatch.mutateAsync({ id: editor.batch.id, data });
                  else await createBatch.mutateAsync(data);
                  setEditor(null);
                } catch {
                  setMutationError(
                    "Không thể lưu lô nông sản. Vui lòng kiểm tra dữ liệu và thử lại.",
                  );
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={batchToRegister !== null}
        onOpenChange={(open) => {
          if (!open) setBatchToRegister(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký giải cứu lô #{batchToRegister?.id}</DialogTitle>
            <DialogDescription>Chọn điểm giải cứu tiếp nhận lô nông sản này.</DialogDescription>
          </DialogHeader>
          {batchToRegister && (
            <RescueRegistrationForm
              points={rescuePointsQuery.data ?? []}
              loading={rescuePointsQuery.isPending}
              pending={createRegistration.isPending}
              onCancel={() => setBatchToRegister(null)}
              onSubmit={async (rescuePointId) => {
                try {
                  setMutationError("");
                  await createRegistration.mutateAsync({
                    batchId: batchToRegister.id,
                    rescuePointId,
                  });
                  setNotice(`Đã gửi đăng ký giải cứu cho lô #${batchToRegister.id}.`);
                  setBatchToRegister(null);
                } catch {
                  setMutationError("Không thể gửi đăng ký giải cứu. Vui lòng thử lại.");
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function CropNotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Mã nông sản không hợp lệ</h1>
        <Link to="/categories" className="mt-4 inline-block text-primary hover:underline">
          ← Về danh mục
        </Link>
      </div>
    </PageShell>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function BatchCard({
  batch,
  editable,
  buyer,
  cartQuantity,
  onCartQuantityChange,
  onAddToCart,
  onEdit,
  onDelete,
  onRegister,
}: {
  batch: CropBatch;
  editable: boolean;
  buyer: boolean;
  cartQuantity: number;
  onCartQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRegister: () => void;
}) {
  const available = Number(batch.currentQuantity);
  const canBuy = batch.status === "available" && available > 0;
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted-foreground">Lô #{batch.id}</div>
          <div className="mt-1 font-semibold">
            {formatNumber(Number(batch.currentQuantity))} /{" "}
            {formatNumber(Number(batch.initialQuantity))} {batch.unit}
          </div>
        </div>
        <StatusBadge status={batch.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <DataCell label="Thu hoạch" value={batch.harvestDate} />
        <DataCell label="Hết hạn" value={batch.expiryDate} />
        <DataCell label="Tỉnh" value={batch.province || "—"} />
        <DataCell label="Nông dân" value={batch.farmerName} />
        <DataCell label="Đơn giá" value={`${formatVND(Number(batch.unitPrice))}/${batch.unit}`} />
      </div>
      {buyer && (
        <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">
              Số lượng ({batch.unit})
            </span>
            <Input
              type="number"
              min={1}
              max={Math.max(1, available)}
              step={1}
              value={Math.min(cartQuantity, Math.max(1, available))}
              disabled={!canBuy}
              onChange={(event) => onCartQuantityChange(Number(event.target.value))}
            />
          </label>
          <Button
            type="button"
            className="h-10 rounded-xl px-3"
            disabled={!canBuy}
            onClick={onAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      )}
      {editable && <BatchActions onEdit={onEdit} onDelete={onDelete} onRegister={onRegister} />}
    </article>
  );
}

function BatchTable({
  batches,
  editable,
  buyer,
  getCartQuantity,
  onCartQuantityChange,
  onAddToCart,
  onEdit,
  onDelete,
  onRegister,
}: {
  batches: CropBatch[];
  editable: boolean;
  buyer: boolean;
  getCartQuantity: (batch: CropBatch) => number;
  onCartQuantityChange: (batch: CropBatch, value: number) => void;
  onAddToCart: (batch: CropBatch) => void;
  onEdit: (batch: CropBatch) => void;
  onDelete: (batch: CropBatch) => void;
  onRegister: (batch: CropBatch) => void;
}) {
  return (
    <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-[1380px] table-fixed text-sm">
          <colgroup>
            <col className="w-20" />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-64" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-28" />
            {buyer && <col className="w-28" />}
            {buyer && <col className="w-16" />}
            {editable && <col className="w-72" />}
          </colgroup>
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="whitespace-nowrap">
              <th className="px-4 py-3 text-left">Mã lô</th>
              <th className="px-4 py-3 text-right">Sản lượng</th>
              <th className="px-4 py-3 text-left">Thu hoạch</th>
              <th className="px-4 py-3 text-left">Hết hạn</th>
              <th className="px-3 py-3 text-left">Địa điểm</th>
              <th className="px-3 py-3 text-left">Nông dân</th>
              <th className="px-4 py-3 text-right">Đơn giá</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              {buyer && <th className="px-4 py-3 text-right">Số lượng</th>}
              {buyer && <th className="px-4 py-3 text-right">Giỏ</th>}
              {editable && <th className="px-4 py-3 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">#{batch.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                  {formatNumber(Number(batch.currentQuantity))} /{" "}
                  {formatNumber(Number(batch.initialQuantity))} {batch.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {batch.harvestDate}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{batch.expiryDate}</td>
                <td className="overflow-hidden px-3 py-3">
                  <span className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-xs">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {formatBatchAddress(batch) || "—"}
                  </span>
                </td>
                <td className="truncate px-3 py-3 text-xs" title={batch.farmerName}>
                  {batch.farmerName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary">
                  {formatVND(Number(batch.unitPrice))}/{batch.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={batch.status} />
                </td>
                {buyer && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <CartQuantityInput
                      batch={batch}
                      value={getCartQuantity(batch)}
                      onChange={(value) => onCartQuantityChange(batch, value)}
                    />
                  </td>
                )}
                {buyer && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      disabled={batch.status !== "available" || Number(batch.currentQuantity) <= 0}
                      onClick={() => onAddToCart(batch)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                )}
                {editable && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <BatchActions
                      compact
                      onEdit={() => onEdit(batch)}
                      onDelete={() => onDelete(batch)}
                      onRegister={() => onRegister(batch)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CartQuantityInput({
  batch,
  value,
  onChange,
}: {
  batch: CropBatch;
  value: number;
  onChange: (value: number) => void;
}) {
  const available = Number(batch.currentQuantity);
  const canBuy = batch.status === "available" && available > 0;
  return (
    <Input
      type="number"
      min={1}
      max={Math.max(1, available)}
      step={1}
      value={Math.min(value, Math.max(1, available))}
      disabled={!canBuy}
      onChange={(event) => onChange(Number(event.target.value))}
      className="ml-auto h-9 w-24 text-right"
    />
  );
}

function BatchActions({
  compact = false,
  onEdit,
  onDelete,
  onRegister,
}: {
  compact?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRegister: () => void;
}) {
  return (
    <div className={`${compact ? "" : "mt-3"} flex flex-nowrap justify-end gap-2`}>
      <Button type="button" size="sm" onClick={onRegister} className="whitespace-nowrap">
        <LifeBuoy className="mr-1 h-3.5 w-3.5" /> Giải cứu
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="whitespace-nowrap"
      >
        <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="whitespace-nowrap"
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa
      </Button>
    </div>
  );
}

function RescueRegistrationForm({
  points,
  loading,
  pending,
  onCancel,
  onSubmit,
}: {
  points: RescuePoint[];
  loading: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (rescuePointId: number) => Promise<void>;
}) {
  const activePoints = points.filter((point) => point.status === "ACTIVE");
  const [rescuePointId, setRescuePointId] = useState<number>(activePoints[0]?.id ?? 0);
  useEffect(() => {
    if (activePoints.length > 0 && !activePoints.some((point) => point.id === rescuePointId))
      setRescuePointId(activePoints[0].id);
  }, [activePoints, rescuePointId]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (rescuePointId > 0) void onSubmit(rescuePointId);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      {loading ? (
        <div className="h-9 animate-pulse rounded-md bg-muted" />
      ) : activePoints.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hiện chưa có điểm giải cứu đang hoạt động.</p>
      ) : (
        <div className="space-y-2">
          <Label>Điểm giải cứu</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={rescuePointId}
            onChange={(event) => setRescuePointId(Number(event.target.value))}
          >
            {activePoints.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name} — {point.province}
              </option>
            ))}
          </select>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={pending || loading || activePoints.length === 0}>
          {pending ? "Đang gửi…" : "Gửi đăng ký"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BatchForm({
  cropId,
  defaultUnit,
  batch,
  pending,
  onCancel,
  onSave,
}: {
  cropId: number;
  defaultUnit: string;
  batch?: CropBatch;
  pending: boolean;
  onCancel: () => void;
  onSave: (data: CropBatchInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CropBatchInput>({
    cropId,
    initialQuantity: batch?.initialQuantity ?? 0,
    currentQuantity: batch?.currentQuantity ?? batch?.initialQuantity ?? 0,
    unitPrice: batch?.unitPrice ?? 0,
    unit: batch?.unit ?? defaultUnit,
    harvestDate: batch?.harvestDate ?? "",
    expiryDate: batch?.expiryDate ?? "",
    province: batch?.province ?? "",
    district: batch?.district ?? "",
    ward: batch?.ward ?? "",
    addressDetail: batch?.addressDetail ?? "",
    status: batch?.status ?? "pending",
  });
  const field = (name: keyof CropBatchInput, value: string | number) =>
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "initialQuantity" ? { currentQuantity: Number(value) } : {}),
    }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sản lượng ban đầu">
          <Input
            type="number"
            min="100"
            step="100"
            required
            value={form.initialQuantity}
            onChange={(e) => field("initialQuantity", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Giá / đơn vị">
          <Input
            type="number"
            min="0"
            step="1000"
            required
            value={form.unitPrice}
            onChange={(e) => field("unitPrice", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Đơn vị">
          <Input required value={form.unit} onChange={(e) => field("unit", e.target.value)} />
        </FormField>
        <FormField label="Ngày thu hoạch">
          <Input
            type="date"
            required
            value={form.harvestDate}
            onChange={(e) => field("harvestDate", e.target.value)}
          />
        </FormField>
        <FormField label="Ngày hết hạn">
          <Input
            type="date"
            required
            min={form.harvestDate}
            value={form.expiryDate}
            onChange={(e) => field("expiryDate", e.target.value)}
          />
        </FormField>
        <FormField label="Địa chỉ" full>
          <VietnamAddressSelect
            required
            value={form.addressDetail ?? ""}
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
        </FormField>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu lô"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormField({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CropBatchStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBatchAddress(batch: CropBatch) {
  if (
    batch.addressDetail &&
    [batch.ward, batch.district, batch.province].some((part) =>
      part ? batch.addressDetail?.includes(part) : false,
    )
  ) {
    return batch.addressDetail;
  }
  return [batch.addressDetail, batch.ward, batch.district, batch.province]
    .filter(Boolean)
    .join(", ");
}
