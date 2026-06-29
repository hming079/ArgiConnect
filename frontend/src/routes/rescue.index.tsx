import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, ArrowRight, Building2, Clock, Map as MapIcon, MapPin, RefreshCw, ShoppingCart } from "lucide-react";

import type { Crop, CropBatch } from "@/api/cropApi";
import type { RescuePoint, RescuePointStatus } from "@/api/rescuePointApi";
import type { RescueRegistration } from "@/api/rescueRegistrationApi";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useRescueRegistrations } from "@/hooks/use-rescue-registrations";
import { useRescuePoints } from "@/hooks/use-rescue-points";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/rescue/")({
  head: () => ({ meta: [{ title: "Giải cứu nông sản - AgriConnect" }] }),
  component: RescueHubPage,
});

function RescueHubPage() {
  const registrationsQuery = useRescueRegistrations({ status: "APPROVED" });
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const pointsQuery = useRescuePoints();
  const { add } = useCart();
  const { role } = useAuth();
  const isBuyer = role === "BUYER";

  const registrations = registrationsQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const points = pointsQuery.data ?? [];
  const loading = registrationsQuery.isPending || batchesQuery.isPending || cropsQuery.isPending || pointsQuery.isPending;
  const failed = registrationsQuery.isError || batchesQuery.isError || cropsQuery.isError || pointsQuery.isError;
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const cropById = new Map(crops.map((crop) => [crop.id, crop]));
  const approvedItems = registrations
    .filter((registration) => registration.status === "APPROVED")
    .map((registration) => {
      const batch = batchById.get(registration.batchId);
      return {
        registration,
        batch,
        crop: batch ? cropById.get(batch.cropId) : undefined,
        point: points.find((point) => point.id === registration.rescuePointId),
      };
    })
    .filter((item): item is { registration: RescueRegistration; batch: CropBatch; crop: Crop | undefined; point: RescuePoint | undefined } => Boolean(item.batch));

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Giải cứu nông sản
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Cùng giải cứu nông sản Việt</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Các lô đã được admin phê duyệt sẽ hiển thị tại đây để người mua cùng hỗ trợ tiêu thụ.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 shadow-card">
            <Link to="/rescue" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <MapIcon className="h-4 w-4" /> Khu vực giải cứu
            </Link>
            <Link to="/rescue-points" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <Building2 className="h-4 w-4" /> Điểm giải cứu
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {failed && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <h2 className="mt-2 font-semibold">Không thể tải dữ liệu giải cứu</h2>
            <Button className="mt-4 rounded-full" onClick={() => { void registrationsQuery.refetch(); void batchesQuery.refetch(); void cropsQuery.refetch(); void pointsQuery.refetch(); }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
            </Button>
          </div>
        )}

        {loading && <div className="h-72 animate-pulse rounded-2xl bg-muted" />}

        {!loading && !failed && (
          <section>
            <h2 className="text-xl font-bold">Lô nông sản đang giải cứu</h2>
            <p className="text-sm text-muted-foreground">Dữ liệu lấy từ các đăng ký giải cứu đã được admin chấp nhận.</p>

            {approvedItems.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Chưa có lô nông sản nào được phê duyệt giải cứu.
              </div>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {approvedItems.map(({ registration, batch, crop, point }) => (
                  <RescueBatchCard
                    key={registration.id}
                    batch={batch}
                    crop={crop}
                    point={point}
                    isBuyer={isBuyer}
                    onAdd={() => {
                      const cropName = crop?.name ?? `Nông sản #${batch.cropId}`;
                      const image = getCropImage(cropName);
                      add({
                        id: `batch-${batch.id}`,
                        name: `Lô #${batch.id} · ${cropName}`,
                        image: image ?? "",
                        pricePerKg: Number(batch.unitPrice),
                        location: formatBatchAddress(batch),
                        qty: 20,
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && !failed && (
          <section>
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-bold">Điểm giải cứu</h2>
              <Link to="/rescue-points" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {points.slice(0, 6).map((point) => (
                <Link key={point.id} to="/rescue-points" className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold">{point.name}</div>
                    <Status status={point.status} />
                  </div>
                  <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3" /> {formatPointAddress(point)}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Theo thông tin điểm tiếp nhận
                  </div>
                  <ArrowRight className="mt-3 h-4 w-4 text-primary" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function RescueBatchCard({ batch, crop, point, isBuyer, onAdd }: { batch: CropBatch; crop?: Crop; point?: RescuePoint; isBuyer: boolean; onAdd: () => void }) {
  const cropName = crop?.name ?? `Nông sản #${batch.cropId}`;
  const image = getCropImage(cropName);
  const available = Number(batch.currentQuantity);
  const total = Number(batch.initialQuantity);
  const sold = Math.max(total - available, 0);
  const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative aspect-[16/10] overflow-hidden bg-primary-soft">
        {image ? <img src={image} alt={cropName} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl font-bold text-primary">#{batch.cropId}</div>}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground">
          <AlertTriangle className="h-3 w-3" /> Đang giải cứu
        </span>
      </div>
      <div className="p-5">
        <div className="font-mono text-xs text-muted-foreground">Lô #{batch.id}</div>
        <h3 className="mt-0.5 font-semibold">{cropName}</h3>
        <div className="mt-1 text-xs text-muted-foreground">Nông dân: {batch.farmerName}</div>
        <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {formatBatchAddress(batch) || "Chưa có địa chỉ"}
        </div>
        {point && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" /> {point.name}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-bold text-primary">{formatVND(Number(batch.unitPrice))}/{batch.unit}</span>
          <span className="text-xs text-muted-foreground">Còn {formatNumber(available)} {batch.unit}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        {isBuyer && available > 0 && (
          <button onClick={onAdd} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ giải cứu
          </button>
        )}
      </div>
    </div>
  );
}

function Status({ status }: { status: RescuePointStatus }) {
  return <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">{status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}</span>;
}

function formatBatchAddress(batch: CropBatch) {
  return [batch.addressDetail, batch.ward, batch.district, batch.province].filter(Boolean).join(", ");
}

function formatPointAddress(point: RescuePoint) {
  return [point.addressDetail, point.ward, point.district, point.province].filter(Boolean).join(", ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}
